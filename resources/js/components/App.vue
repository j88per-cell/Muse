<script setup>
import { computed, markRaw, nextTick, onMounted, ref, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const books = ref([]);
const chapters = ref([]);
const characters = ref([]);
const notes = ref([]);
const stats = ref(null);
const loading = ref(true);
const error = ref(null);

const selectedBookId = ref('all');
const selectedChapterId = ref(null);
const siteFontSize = ref(18);
const editorFontSize = ref(24);
const openBooks = ref({});
const charactersOpen = ref(true);
const notesOpen = ref(true);
const mode = ref('writing');
const selectedCharacterId = ref(null);
const selectedNoteId = ref(null);
const characterDraft = ref({
    name: '',
    notes: '',
    book_ids: [],
});
const noteDraft = ref({
    title: '',
    body: '',
    book_id: '',
});
const theme = ref('light');

const editorEl = ref(null);
const editorInstance = ref(null);
const editorInitInProgress = ref(false);
const isSyncingEditor = ref(false);
const isSaving = ref(false);
const isDirty = ref(false);
const titleDraft = ref('');
const positionDraft = ref('');
const bookTitleDraft = ref('');
const isHeadingFaded = ref(false);
const editorScrollBound = ref(false);
const latestContent = ref({ text: '', delta: null });
const saveTimers = ref({
    title: null,
    position: null,
    content: null,
});

const filteredChapters = computed(() => {
    if (selectedBookId.value === 'all') {
        return chapters.value;
    }
    return chapters.value.filter((chapter) => chapter.book_id === selectedBookId.value);
});

const chaptersByBook = computed(() => {
    const groups = chapters.value.reduce((acc, chapter) => {
        acc[chapter.book_id] = acc[chapter.book_id] || [];
        acc[chapter.book_id].push(chapter);
        return acc;
    }, {});
    Object.values(groups).forEach((group) => {
        group.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });
    return groups;
});

const selectedChapter = computed(() => {
    return chapters.value.find((chapter) => chapter.id === selectedChapterId.value) || null;
});

const selectedCharacter = computed(() => {
    return characters.value.find((character) => character.id === selectedCharacterId.value) || null;
});

const selectedNote = computed(() => {
    return notes.value.find((note) => note.id === selectedNoteId.value) || null;
});
const selectedBook = computed(() => {
    return books.value.find((book) => book.id === selectedBookId.value) || null;
});

const activeBook = computed(() => {
    return selectedChapter.value?.book || selectedBook.value || null;
});

const noteBook = computed(() => {
    return books.value.find((book) => book.id === noteDraft.value.book_id) || null;
});

const bookStats = computed(() => {
    if (!selectedBook.value) {
        return {
            title: 'All books',
            chapters: filteredChapters.value.length,
        };
    }
    return {
        title: selectedBook.value.title,
        chapters: filteredChapters.value.length,
    };
});

const visibleNotes = computed(() => {
    if (!activeBook.value) {
        return notes.value;
    }
    return notes.value.filter((note) => note.book_id === activeBook.value.id);
});

const loadData = async () => {
    try {
        loading.value = true;
        const [statsRes, booksRes, chaptersRes, charactersRes, notesRes] = await Promise.all([
            fetch('/api/dashboard'),
            fetch('/books'),
            fetch('/api/chapters'),
            fetch('/api/characters'),
            fetch('/api/notes'),
        ]);

        stats.value = await statsRes.json();
        books.value = await booksRes.json();
        chapters.value = await chaptersRes.json();
        characters.value = await charactersRes.json();
        notes.value = await notesRes.json();

        if (!selectedChapterId.value && chapters.value.length > 0) {
            selectedChapterId.value = chapters.value[0].id;
        }
        if (Object.keys(openBooks.value).length === 0) {
            const next = {};
            for (const book of books.value) {
                next[book.id] = false;
            }
            openBooks.value = next;
        }
    } catch (err) {
        error.value = err?.message || 'Failed to load dashboard data.';
    } finally {
        loading.value = false;
    }
};

const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

const createChapter = async (book) => {
    if (!book?.id) {
        return;
    }
    const title = window.prompt(`New chapter title for "${book.title}"`);
    if (!title) {
        return;
    }
    await fetch('/api/chapters', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ book_id: book.id, title }),
    });
    selectedBookId.value = book.id;
    await loadData();
};

const setMode = (nextMode) => {
    mode.value = nextMode;
};

const startNewCharacter = () => {
    setMode('characters');
    selectedCharacterId.value = null;
    characterDraft.value = {
        name: '',
        notes: '',
        book_ids: [],
    };
};

const selectCharacter = (character) => {
    setMode('characters');
    selectedCharacterId.value = character.id;
    characterDraft.value = {
        name: character.name || '',
        notes: character.notes || '',
        book_ids: (character.books || []).map((book) => book.id),
    };
};

const saveCharacter = async () => {
    const payload = {
        name: characterDraft.value.name?.trim(),
        notes: characterDraft.value.notes?.trim() || null,
        book_ids: characterDraft.value.book_ids || [],
    };
    if (!payload.name) {
        return;
    }
    const isNew = !selectedCharacterId.value;
    const url = isNew ? '/api/characters' : `/api/characters/${selectedCharacterId.value}`;
    const method = isNew ? 'POST' : 'PATCH';
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const text = await response.text();
        error.value = `Save failed (${response.status}). ${text.slice(0, 200)}`;
        return;
    }
    const saved = await response.json();
    await loadData();
    selectedCharacterId.value = saved.id;
    mode.value = 'characters';
};

const deleteCharacter = async () => {
    if (!selectedCharacterId.value) {
        return;
    }
    const name = selectedCharacter.value?.name || 'this character';
    const confirmed = window.confirm(`Delete "${name}"?`);
    if (!confirmed) {
        return;
    }
    await fetch(`/api/characters/${selectedCharacterId.value}`, {
        method: 'DELETE',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
    });
    await loadData();
    selectedCharacterId.value = null;
    characterDraft.value = { name: '', notes: '', book_ids: [] };
    mode.value = 'writing';
};

const toggleNotes = () => {
    notesOpen.value = !notesOpen.value;
};

const startNewNote = () => {
    setMode('notes');
    selectedNoteId.value = null;
    noteDraft.value = {
        title: '',
        body: '',
        book_id: activeBook.value?.id || books.value[0]?.id || '',
    };
};

const selectNote = (note) => {
    setMode('notes');
    selectedNoteId.value = note.id;
    noteDraft.value = {
        title: note.title || '',
        body: note.body || '',
        book_id: note.book_id,
    };
};

const saveNote = async () => {
    const payload = {
        title: noteDraft.value.title?.trim() || null,
        body: noteDraft.value.body?.trim() || null,
        book_id: noteDraft.value.book_id,
    };
    if (!payload.book_id) {
        error.value = 'Select a book for this note.';
        return;
    }
    const isNew = !selectedNoteId.value;
    const url = isNew ? '/api/notes' : `/api/notes/${selectedNoteId.value}`;
    const method = isNew ? 'POST' : 'PATCH';
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const text = await response.text();
        error.value = `Save failed (${response.status}). ${text.slice(0, 200)}`;
        return;
    }
    const saved = await response.json();
    await loadData();
    selectedNoteId.value = saved.id;
    mode.value = 'notes';
};

const deleteNote = async (note = null) => {
    const noteId = note?.id || selectedNoteId.value;
    if (!noteId) {
        return;
    }
    const title = note?.title || noteDraft.value.title || 'this note';
    const confirmed = window.confirm(`Delete "${title}"?`);
    if (!confirmed) {
        return;
    }
    await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
    });
    await loadData();
    if (selectedNoteId.value === noteId) {
        selectedNoteId.value = null;
        noteDraft.value = { title: '', body: '', book_id: '' };
        mode.value = 'writing';
    }
};

const createBook = async () => {
    const title = window.prompt('New book title');
    if (!title) {
        return;
    }
    const response = await fetch('/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ title }),
    });
    if (!response.ok) {
        const text = await response.text();
        error.value = `Save failed (${response.status}). ${text.slice(0, 200)}`;
        return;
    }
    await loadData();
};

const updateChapterField = async (chapterId, payload, { refresh = false, applyLocal = true } = {}) => {
    const response = await fetch(`/api/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const text = await response.text();
        error.value = `Save failed (${response.status}). ${text.slice(0, 200)}`;
        return;
    }
    let updated = null;
    try {
        updated = await response.json();
    } catch (err) {
        updated = null;
    }
    if (applyLocal && updated) {
        const index = chapters.value.findIndex((chapter) => chapter.id === chapterId);
        if (index !== -1) {
            chapters.value.splice(index, 1, { ...chapters.value[index], ...updated });
        }
    }
    if (refresh) {
        await loadData();
    }
};

const updateBookTitle = async () => {
    const book = activeBook.value;
    if (!book) {
        return;
    }
    const value = bookTitleDraft.value.trim();
    if (!value || value === book.title) {
        return;
    }
    const response = await fetch(`/books/${book.id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ title: value }),
    });
    if (!response.ok) {
        const text = await response.text();
        error.value = `Save failed (${response.status}). ${text.slice(0, 200)}`;
        return;
    }
    const updated = await response.json();
    const index = books.value.findIndex((item) => item.id === updated.id);
    if (index !== -1) {
        books.value.splice(index, 1, { ...books.value[index], ...updated });
    }
};
const toggleBook = (bookId) => {
    openBooks.value = {
        ...openBooks.value,
        [bookId]: !openBooks.value[bookId],
    };
};

const toggleCharacters = () => {
    charactersOpen.value = !charactersOpen.value;
};

const deleteBook = async (book) => {
    if (!book?.id) {
        return;
    }
    const confirmed = window.confirm(
        `Delete "${book.title}"? Chapters will be soft-deleted and orphan characters removed.`
    );
    if (!confirmed) {
        return;
    }

    await fetch(`/books/${book.id}`, {
        method: 'DELETE',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
    });
    await loadData();
    if (selectedBookId.value === book.id) {
        selectedBookId.value = 'all';
    }
};

const deleteChapter = async (chapter) => {
    if (!chapter?.id) {
        return;
    }
    const confirmed = window.confirm(`Delete "${chapter.title}"?`);
    if (!confirmed) {
        return;
    }

    await fetch(`/api/chapters/${chapter.id}`, {
        method: 'DELETE',
        headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
    });
    await loadData();
    if (selectedChapterId.value === chapter.id) {
        selectedChapterId.value = chapters.value[0]?.id ?? null;
    }
};

const scheduleSave = (key, handler, delay = 600) => {
    if (saveTimers.value[key]) {
        clearTimeout(saveTimers.value[key]);
    }
    saveTimers.value[key] = setTimeout(async () => {
        isSaving.value = true;
        try {
            await handler();
        } finally {
            isSaving.value = false;
        }
    }, delay);
};

const saveEditorContent = async () => {
    if (isSyncingEditor.value || !selectedChapter.value || !editorInstance.value) {
        return;
    }
    const chapterId = selectedChapter.value.id;
    latestContent.value = {
        delta: editorInstance.value.getContents(),
        text: editorInstance.value.getText(),
    };
    await updateChapterField(
        chapterId,
        {
            content: latestContent.value.text,
            content_delta: JSON.stringify(latestContent.value.delta),
            content_format: 'delta',
        },
        { applyLocal: true }
    );
    isDirty.value = false;
};

const queueContentSave = () => {
    scheduleSave('content', async () => {
        await saveEditorContent();
    }, 900);
};

const ensureEditor = async () => {
    if (editorInstance.value || editorInitInProgress.value || !editorEl.value) {
        return;
    }
    editorInitInProgress.value = true;
    await nextTick();
    if (editorEl.value.querySelector('.ql-toolbar, .ql-container')) {
        editorEl.value.innerHTML = '';
    }
    editorInstance.value = markRaw(
        new Quill(editorEl.value, {
            theme: 'snow',
            placeholder: 'Select a chapter to review...',
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link'],
                    ['clean'],
                ],
            },
        })
    );
    editorInstance.value.on('editor-change', (eventName, _delta, _old, source) => {
        if (eventName !== 'text-change') {
            return;
        }
        if (isSyncingEditor.value) {
            return;
        }
        if (source && source !== 'user') {
            return;
        }
        isDirty.value = true;
        queueContentSave();
    });
    if (!editorScrollBound.value && editorInstance.value.root) {
        editorInstance.value.root.addEventListener('scroll', () => {
            isHeadingFaded.value = editorInstance.value.root.scrollTop > 40;
        });
        editorScrollBound.value = true;
    }
    editorInitInProgress.value = false;
};

const syncEditor = () => {
    if (!editorInstance.value) {
        return;
    }
    const content = selectedChapter.value?.content || '';
    const delta = selectedChapter.value?.content_delta || null;
    isSyncingEditor.value = true;
    if (delta) {
        try {
            const parsed = typeof delta === 'string' ? JSON.parse(delta) : delta;
            if (parsed && parsed.ops) {
                editorInstance.value.setContents(parsed, 'silent');
            } else {
                editorInstance.value.setText(content, 'silent');
            }
        } catch (err) {
            editorInstance.value.setText(content, 'silent');
        }
    } else {
        editorInstance.value.setText(content, 'silent');
    }
    isDirty.value = false;
    isHeadingFaded.value = false;
    isSyncingEditor.value = false;
};

const applySiteFontSize = () => {
    document.documentElement.style.fontSize = `${siteFontSize.value}px`;
};

const applyTheme = () => {
    document.documentElement.dataset.theme = theme.value;
    localStorage.setItem('muse-theme', theme.value);
};

onMounted(async () => {
    await loadData();
    await ensureEditor();
    syncEditor();
    applySiteFontSize();
    const storedTheme = localStorage.getItem('muse-theme');
    theme.value = storedTheme || 'light';
    applyTheme();
});

watch(selectedChapterId, async () => {
    await ensureEditor();
    syncEditor();
    titleDraft.value = selectedChapter.value?.title || '';
    bookTitleDraft.value = activeBook.value?.title || '';
    positionDraft.value =
        selectedChapter.value && selectedChapter.value.position !== null
            ? String(selectedChapter.value.position + 1)
            : '';
});

watch(selectedBookId, () => {
    bookTitleDraft.value = activeBook.value?.title || '';
});

watch(selectedCharacterId, () => {
    if (!selectedCharacter.value) {
        return;
    }
    characterDraft.value = {
        name: selectedCharacter.value.name || '',
        notes: selectedCharacter.value.notes || '',
        book_ids: (selectedCharacter.value.books || []).map((book) => book.id),
    };
});

watch(selectedNoteId, () => {
    if (!selectedNote.value) {
        return;
    }
    noteDraft.value = {
        title: selectedNote.value.title || '',
        body: selectedNote.value.body || '',
        book_id: selectedNote.value.book_id,
    };
});

watch(siteFontSize, () => {
    applySiteFontSize();
});

watch(theme, () => {
    applyTheme();
});
</script>

<template>
    <div class="min-h-screen bg-paper text-ink" :style="{ '--editor-font-size': `${editorFontSize}px` }">
        <div class="page-grid"></div>

        <header class="relative z-10 mx-auto flex w-full max-w-none items-center justify-between px-1 py-2">
            <div>
                <p class="text-xs uppercase tracking-[0.3em] text-ink/50">Muse Studio</p>
                <h1 class="text-3xl font-semibold">Writing Admin</h1>
            </div>
        </header>

        <main
            class="app-shell relative z-10 mx-auto grid w-full max-w-none gap-2 px-1 pb-6 lg:grid-cols-[360px_minmax(0,1fr)_240px]"
        >
            <aside class="sidebar-panel space-y-5 rounded-3xl border border-ink/10 bg-white/70 p-4 shadow-[0_20px_60px_rgba(51,48,41,0.12)] backdrop-blur">
                <div>
                    <p class="text-xs uppercase tracking-[0.35em] text-ink/50">Library</p>
                    <div class="mt-4 space-y-3 text-sm">
                        <button
                            class="flex w-full items-center gap-2 rounded-xl px-[10px] py-1 text-left text-sm transition"
                            :class="
                                selectedBookId === 'all'
                                    ? 'bg-ink text-paper'
                                    : 'text-ink/70 hover:bg-ink/10 hover:text-ink'
                            "
                            @click="selectedBookId = 'all'"
                        >
                            <span class="text-lg">📁</span>
                            <span>All books</span>
                        </button>

                        <div v-for="book in books" :key="book.id" class="space-y-2">
                            <div class="flex items-center gap-2">
                                <button
                                    class="flex h-6 w-6 items-center justify-center rounded-full border border-ink/20 text-xs leading-none text-ink/60"
                                    @click="toggleBook(book.id)"
                                >
                                    {{ openBooks[book.id] ? '−' : '+' }}
                                </button>
                                <button
                                    class="flex flex-1 items-center gap-2 rounded-xl px-[10px] py-1 text-left leading-tight transition"
                                    :class="
                                        selectedBookId === book.id
                                            ? 'bg-ink text-paper'
                                            : 'text-ink/70 hover:bg-ink/10 hover:text-ink'
                                    "
                                    @click="selectedBookId = book.id"
                                >
                                    <span class="text-lg">📁</span>
                                    <span class="truncate">{{ book.title }}</span>
                                </button>
                                <button
                                    class="rounded-full border border-ink/20 px-2 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink/60"
                                    @click="createChapter(book)"
                                >
                                    +
                                </button>
                                <button
                                    class="rounded-full border border-ink/20 px-2 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink/60"
                                    @click="deleteBook(book)"
                                >
                                    Delete
                                </button>
                            </div>
                            <div v-if="openBooks[book.id]" class="ml-8 space-y-1">
                                <div
                                    v-for="chapter in chaptersByBook[book.id] || []"
                                    :key="chapter.id"
                                    class="flex items-center gap-2"
                                >
                                    <button
                                        class="flex flex-1 items-center gap-2 rounded-xl px-[10px] py-1 text-left text-xs transition"
                                        :class="
                                            selectedChapterId === chapter.id && mode === 'writing'
                                                ? 'bg-ink text-paper'
                                                : 'text-ink/60 hover:bg-ink/10 hover:text-ink'
                                        "
                                        @click="
                                            selectedChapterId = chapter.id;
                                            selectedNoteId = null;
                                            mode = 'writing';
                                        "
                                    >
                                        <span>📄</span>
                                        <span class="truncate">{{ chapter.title }}</span>
                                    </button>
                                    <button
                                        class="rounded-full border border-ink/20 px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-ink/50"
                                        @click="deleteChapter(chapter)"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <div v-if="!(chaptersByBook[book.id] || []).length" class="text-xs text-ink/40">
                                    No chapters yet
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <p class="text-xs uppercase tracking-[0.35em] text-ink/50">Characters</p>
                    <div class="mt-3 space-y-2 text-xs text-ink/60">
                        <div class="flex items-center gap-2 text-sm text-ink/70">
                            <button
                                class="flex h-6 w-6 items-center justify-center rounded-full border border-ink/20 text-xs leading-none text-ink/60"
                                @click="toggleCharacters"
                            >
                                {{ charactersOpen ? '−' : '+' }}
                            </button>
                            <span class="text-lg">📁</span>
                            <span>Characters</span>
                            <button
                                class="ml-auto rounded-full border border-ink/20 px-2 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink/60"
                                @click="startNewCharacter"
                            >
                                +
                            </button>
                        </div>
                        <div v-if="charactersOpen" class="ml-6 space-y-1">
                            <button
                                v-for="character in characters"
                                :key="character.id"
                                class="flex w-full items-center gap-2 rounded-xl px-[10px] py-1 text-left text-xs transition"
                                :class="
                                    selectedCharacterId === character.id && mode === 'characters'
                                        ? 'bg-ink text-paper'
                                        : 'text-ink/60 hover:bg-ink/10 hover:text-ink'
                                "
                                @click="selectCharacter(character)"
                            >
                                <span>📄</span>
                                <span class="truncate">{{ character.name }}</span>
                            </button>
                            <div v-if="!characters.length && !loading" class="text-ink/40">No characters yet</div>
                        </div>
                    </div>
                </div>

                <div>
                    <p class="text-xs uppercase tracking-[0.35em] text-ink/50">Notes</p>
                    <div class="mt-3 space-y-2 text-xs text-ink/60">
                        <div class="flex items-center gap-2 text-sm text-ink/70">
                            <button
                                class="flex h-6 w-6 items-center justify-center rounded-full border border-ink/20 text-xs leading-none text-ink/60"
                                @click="toggleNotes"
                            >
                                {{ notesOpen ? '−' : '+' }}
                            </button>
                            <span class="text-lg">📁</span>
                            <span>Notes</span>
                            <button
                                class="ml-auto rounded-full border border-ink/20 px-2 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink/60"
                                @click="startNewNote"
                            >
                                +
                            </button>
                        </div>
                        <div v-if="notesOpen" class="ml-6 space-y-1">
                            <button
                                v-for="note in visibleNotes"
                                :key="note.id"
                                class="flex w-full items-center gap-2 rounded-xl px-[10px] py-1 text-left text-xs transition"
                                :class="
                                    selectedNoteId === note.id && mode === 'notes'
                                        ? 'bg-ink text-paper'
                                        : 'text-ink/60 hover:bg-ink/10 hover:text-ink'
                                "
                                @click="selectNote(note)"
                            >
                                <span>🗒️</span>
                                <span class="truncate">{{ note.title || 'Untitled note' }}</span>
                            </button>
                            <button
                                v-for="note in visibleNotes"
                                :key="`${note.id}-delete`"
                                class="ml-8 rounded-full border border-ink/20 px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-ink/50"
                                @click="deleteNote(note)"
                            >
                                Delete
                            </button>
                            <div v-if="!visibleNotes.length && !loading" class="text-ink/40">No notes yet</div>
                        </div>
                    </div>
                </div>
            </aside>

            <section class="editor-panel space-y-4 rounded-[26px] border border-ink/10 bg-white/70 p-4 shadow-[0_30px_80px_rgba(61,60,52,0.18)] backdrop-blur">
                <div>
                    <div class="flex items-center justify-between">
                        <p class="text-xs uppercase tracking-[0.3em] text-ink/50">
                            {{
                                mode === 'characters'
                                    ? 'Character'
                                    : mode === 'notes'
                                        ? 'Note'
                                        : 'Editor'
                            }}
                        </p>
                        <div class="flex items-center gap-2 text-xs text-ink/50" v-if="mode === 'writing'">
                            <span v-if="selectedChapter">
                                {{ isSaving ? 'Saving…' : isDirty ? 'Unsaved changes' : 'Saved' }}
                            </span>
                            <button
                                class="rounded-full border border-ink/20 px-3 py-1 text-[0.6rem] uppercase tracking-[0.18em]"
                                :class="
                                    selectedChapter
                                        ? 'text-ink/70 hover:bg-ink/10'
                                        : 'text-ink/30 cursor-not-allowed'
                                "
                                :disabled="!selectedChapter"
                                @click="
                                    scheduleSave('manual', async () => {
                                        await saveEditorContent();
                                    }, 0)
                                "
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    <div v-show="mode === 'writing'" class="editor-shell mt-3 rounded-3xl border border-ink/10 bg-white/90">
                        <div
                            v-if="selectedChapter"
                            class="editor-heading"
                            :class="{ 'editor-heading--faded': isHeadingFaded }"
                        >
                            <p class="editor-heading__label">
                                Chapter {{ (selectedChapter.position ?? 0) + 1 }}
                            </p>
                            <p class="editor-heading__title">{{ selectedChapter.title }}</p>
                        </div>
                        <div ref="editorEl" class="quill-editor min-h-[520px]"></div>
                    </div>

                    <div v-if="mode === 'characters'" class="mt-3 space-y-4 rounded-3xl border border-ink/10 bg-white/90 p-4">
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Name</label>
                            <input
                                v-model="characterDraft.name"
                                class="mt-2 w-full rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                                placeholder="Character name"
                            />
                        </div>
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Notes</label>
                            <textarea
                                v-model="characterDraft.notes"
                                class="mt-2 h-40 w-full resize-none rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                                placeholder="Traits, backstory, voice notes..."
                            ></textarea>
                        </div>
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Books</label>
                            <div class="mt-2 space-y-2 text-sm text-ink/70">
                                <label v-for="book in books" :key="book.id" class="flex items-center gap-2">
                                    <input
                                        v-model="characterDraft.book_ids"
                                        type="checkbox"
                                        :value="book.id"
                                    />
                                    <span>{{ book.title }}</span>
                                </label>
                                <div v-if="!books.length" class="text-xs text-ink/50">No books yet.</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                class="rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-[0.2em] text-paper"
                                @click="saveCharacter"
                            >
                                Save character
                            </button>
                            <button
                                class="rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                                @click="mode = 'writing'"
                            >
                                Back to writing
                            </button>
                            <button
                                v-if="selectedCharacterId"
                                class="ml-auto rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                                @click="deleteCharacter"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    <div v-if="mode === 'notes'" class="mt-3 space-y-4 rounded-3xl border border-ink/10 bg-white/90 p-4">
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Title</label>
                            <input
                                v-model="noteDraft.title"
                                class="mt-2 w-full rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                                placeholder="Note title"
                            />
                        </div>
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Book</label>
                            <select
                                v-model="noteDraft.book_id"
                                class="mt-2 w-full rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                            >
                                <option value="" disabled>Select a book</option>
                                <option v-for="book in books" :key="book.id" :value="book.id">
                                    {{ book.title }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Note</label>
                            <textarea
                                v-model="noteDraft.body"
                                class="mt-2 h-48 w-full resize-none rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                                placeholder="Plain text note..."
                            ></textarea>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                class="rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-[0.2em] text-paper"
                                @click="saveNote"
                            >
                                Save note
                            </button>
                            <button
                                class="rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                                @click="mode = 'writing'"
                            >
                                Back to writing
                            </button>
                            <button
                                v-if="selectedNoteId"
                                class="ml-auto rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                                @click="deleteNote"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <aside class="sidebar-panel space-y-5 rounded-3xl border border-ink/10 bg-white/70 p-4 shadow-[0_20px_60px_rgba(51,48,41,0.12)] backdrop-blur">
                <div>
                    <p class="text-xs uppercase tracking-[0.35em] text-ink/50">Settings</p>
                    <div class="mt-4 space-y-4 text-sm">
                        <label class="block">
                            <span class="text-xs uppercase tracking-[0.3em] text-ink/40">Theme</span>
                            <div class="mt-2 flex items-center gap-2">
                                <button
                                    class="flex-1 rounded-2xl border border-ink/15 px-3 py-2 text-xs uppercase tracking-[0.2em]"
                                    :class="theme === 'light' ? 'bg-ink text-paper' : 'text-ink/60'"
                                    @click="theme = 'light'"
                                >
                                    Light
                                </button>
                                <button
                                    class="flex-1 rounded-2xl border border-ink/15 px-3 py-2 text-xs uppercase tracking-[0.2em]"
                                    :class="theme === 'dark' ? 'bg-ink text-paper' : 'text-ink/60'"
                                    @click="theme = 'dark'"
                                >
                                    Dark
                                </button>
                            </div>
                        </label>
                        <label class="block">
                            <span class="text-xs uppercase tracking-[0.3em] text-ink/40">Site font size</span>
                            <div class="mt-2 flex items-center gap-3">
                                <input
                                    v-model.number="siteFontSize"
                                    type="range"
                                    min="16"
                                    max="22"
                                    step="1"
                                    class="w-full"
                                />
                                <span class="w-10 text-right">{{ siteFontSize }}px</span>
                            </div>
                        </label>
                        <label class="block">
                            <span class="text-xs uppercase tracking-[0.3em] text-ink/40">Editor font size</span>
                            <div class="mt-2 flex items-center gap-3">
                                <input
                                    v-model.number="editorFontSize"
                                    type="range"
                                    min="18"
                                    max="32"
                                    step="1"
                                    class="w-full"
                                />
                                <span class="w-10 text-right">{{ editorFontSize }}px</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div v-if="mode === 'writing'" class="rounded-2xl border border-ink/10 bg-paper/70 px-3 py-4 text-sm">
                    <p class="text-xs uppercase tracking-[0.3em] text-ink/40">Context</p>
                    <div class="mt-3 space-y-3">
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Book</label>
                            <input
                                v-model="bookTitleDraft"
                                class="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-base"
                                :disabled="!activeBook"
                                :placeholder="activeBook ? 'Book title' : 'All books'"
                                @input="scheduleSave('book-title', async () => { await updateBookTitle(); })"
                            />
                        </div>
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Chapter title</label>
                            <input
                                v-model="titleDraft"
                                class="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-base"
                                placeholder="Select a chapter"
                                @input="
                                    scheduleSave('title', async () => {
                                        if (!selectedChapter) return;
                                        const value = titleDraft.trim();
                                        if (!value || value === selectedChapter.title) return;
                                        await updateChapterField(selectedChapter.id, { title: value });
                                    })
                                "
                            />
                        </div>
                        <div>
                            <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Chapter number</label>
                            <input
                                v-model="positionDraft"
                                class="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-base"
                                type="number"
                                min="1"
                                @input="
                                    scheduleSave('position', async () => {
                                        if (!selectedChapter) return;
                                        const value = Number(positionDraft);
                                        if (!Number.isFinite(value) || value < 1) return;
                                        const position = value - 1;
                                        if (position === selectedChapter.position) return;
                                        await updateChapterField(selectedChapter.id, { position });
                                    })
                                "
                            />
                        </div>
                        <div class="text-xs text-ink/50">
                            {{ isSaving ? 'Saving…' : 'Auto-save on' }}
                        </div>
                        <div class="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-xs text-ink/60">
                            {{ bookStats.title }} · {{ bookStats.chapters }} chapters
                        </div>
                        <a
                            v-if="activeBook"
                            class="inline-flex items-center justify-center rounded-full border border-ink/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                            :href="`/books/${activeBook.id}/export/pdf`"
                            target="_blank"
                            rel="noopener"
                        >
                            Export PDF
                        </a>
                        <a
                            class="inline-flex items-center justify-center rounded-full border border-ink/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                            href="/exports/backup"
                            target="_blank"
                            rel="noopener"
                        >
                            Export Backup (folder)
                        </a>
                    </div>
                </div>

                <div v-else-if="mode === 'characters'" class="rounded-2xl border border-ink/10 bg-paper/70 px-3 py-4 text-sm">
                    <p class="text-xs uppercase tracking-[0.3em] text-ink/40">Character</p>
                    <div class="mt-3 space-y-2 text-sm text-ink/70">
                        <p class="text-base font-semibold text-ink">
                            {{ selectedCharacter?.name || 'New character' }}
                        </p>
                        <p class="text-xs text-ink/50">
                            {{ (characterDraft.book_ids || []).length }} linked books
                        </p>
                        <button
                            class="mt-2 rounded-full border border-ink/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                            @click="mode = 'writing'"
                        >
                            Back to writing
                        </button>
                    </div>
                </div>

                <div v-else class="rounded-2xl border border-ink/10 bg-paper/70 px-3 py-4 text-sm">
                    <p class="text-xs uppercase tracking-[0.3em] text-ink/40">Note</p>
                    <div class="mt-3 space-y-2 text-sm text-ink/70">
                        <p class="text-base font-semibold text-ink">
                            {{ noteDraft.title || 'Untitled note' }}
                        </p>
                        <p class="text-xs text-ink/50">
                            {{ noteBook?.title || 'No book selected' }}
                        </p>
                        <button
                            class="mt-2 rounded-full border border-ink/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                            @click="mode = 'writing'"
                        >
                            Back to writing
                        </button>
                    </div>
                </div>
            </aside>
        </main>
    </div>
</template>
