<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useBooks } from '../composables/useBooks';
import { useChapters } from '../composables/useChapters';
import { useCharacters } from '../composables/useCharacters';
import { useNotes } from '../composables/useNotes';
import { useSettings } from '../composables/useSettings';
import { useEditor } from '../composables/useEditor';
import LibrarySidebar from './LibrarySidebar.vue';
import SettingsSidebar from './SettingsSidebar.vue';
import WritingPage from '../pages/WritingPage.vue';
import CharactersPage from '../pages/CharactersPage.vue';
import NotesPage from '../pages/NotesPage.vue';

// Mode management
const mode = ref('writing');

// Initialize composables
const {
    books,
    selectedBookId,
    selectedBook,
    openBooks,
    bookTitleDraft,
    loadBooks,
    createBook,
    updateBookTitle,
    deleteBook,
    toggleBook,
} = useBooks();

const {
    chapters,
    selectedChapterId,
    selectedChapter,
    filteredChapters,
    chaptersByBook,
    titleDraft,
    positionDraft,
    loadChapters,
    createChapter,
    updateChapterField,
    deleteChapter,
} = useChapters(selectedBookId);

const {
    characters,
    selectedCharacterId,
    selectedCharacter,
    charactersByBook,
    characterDraft,
    bookCharactersOpen,
    loadCharacters,
    startNewCharacter,
    selectCharacter,
    saveCharacter,
    deleteCharacter,
    toggleBookCharacters,
} = useCharacters();

const {
    notes,
    selectedNoteId,
    selectedNote,
    notesByBook,
    noteDraft,
    bookNotesOpen,
    loadNotes,
    startNewNote,
    selectNote,
    saveNote,
    deleteNote,
    toggleBookNotes,
} = useNotes();

const {
    siteFontSize,
    editorFontSize,
    theme,
    loadSettings,
} = useSettings();

const {
    editorEl,
    editorInstance,
    isSaving,
    isDirty,
    isHeadingFaded,
    latestContent,
    saveTimers,
    ensureEditor,
    syncEditor,
    onTextChange,
    getEditorContent,
    scheduleSave,
} = useEditor();

// Computed properties
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

// Load all data
const loadData = async () => {
    await Promise.all([
        loadBooks(),
        loadChapters(),
        loadCharacters(),
        loadNotes(),
    ]);
};

// Editor operations
const saveEditorContent = async () => {
    if (!selectedChapter.value || !editorInstance.value) {
        return;
    }
    const chapterId = selectedChapter.value.id;
    latestContent.value = getEditorContent();
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

const handleEnsureEditor = async () => {
    await ensureEditor();
    // Bind text change event
    onTextChange(() => {
        queueContentSave();
    });
};

const handleSyncEditor = () => {
    syncEditor(selectedChapter.value);
};

// Character handlers
const handleStartNewCharacter = () => {
    mode.value = 'characters';
    startNewCharacter();
};

const handleSelectCharacter = (character) => {
    mode.value = 'characters';
    selectCharacter(character);
};

const handleSaveCharacter = async () => {
    await saveCharacter();
    mode.value = 'characters';
};

const handleDeleteCharacter = async () => {
    await deleteCharacter();
    mode.value = 'writing';
};

// Note handlers
const handleStartNewNote = () => {
    mode.value = 'notes';
    startNewNote(activeBook.value?.id || books.value[0]?.id);
};

const handleSelectNote = (note) => {
    mode.value = 'notes';
    selectNote(note);
};

const handleSaveNote = async () => {
    try {
        await saveNote();
        mode.value = 'notes';
    } catch (err) {
        console.error('Failed to save note:', err);
    }
};

const handleDeleteNote = async (note = null) => {
    await deleteNote(note);
    if (!note || selectedNoteId.value === note?.id) {
        mode.value = 'writing';
    }
};

// Book/Chapter handlers
const handleUpdateBookTitle = () => {
    scheduleSave('book-title', async () => {
        const book = activeBook.value;
        if (!book) return;
        const value = bookTitleDraft.value.trim();
        if (!value || value === book.title) return;
        await updateBookTitle(book.id, value);
    });
};

const handleSaveChapterTitle = () => {
    scheduleSave('title', async () => {
        if (!selectedChapter.value) return;
        const value = titleDraft.value.trim();
        if (!value || value === selectedChapter.value.title) return;
        await updateChapterField(selectedChapter.value.id, { title: value });
    });
};

const handleSaveChapterPosition = () => {
    scheduleSave('position', async () => {
        if (!selectedChapter.value) return;
        const value = Number(positionDraft.value);
        if (!Number.isFinite(value) || value < 1) return;
        const position = value - 1;
        if (position === selectedChapter.value.position) return;
        await updateChapterField(selectedChapter.value.id, { position });
    });
};

const handleCreateChapter = async (book) => {
    await createChapter(book);
    selectedBookId.value = book.id;
};

const handleDeleteBook = async (book) => {
    await deleteBook(book);
};

const handleDeleteChapter = async (chapter) => {
    await deleteChapter(chapter);
};

// Initialize
onMounted(async () => {
    await loadData();
    await handleEnsureEditor();
    handleSyncEditor();
    loadSettings();
});

// Watchers
watch(selectedChapterId, async () => {
    await handleEnsureEditor();
    handleSyncEditor();
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
    if (!selectedCharacter.value) return;
    characterDraft.value = {
        name: selectedCharacter.value.name || '',
        notes: selectedCharacter.value.notes || '',
        book_ids: (selectedCharacter.value.books || []).map((book) => book.id),
    };
});

watch(selectedNoteId, () => {
    if (!selectedNote.value) return;
    noteDraft.value = {
        title: selectedNote.value.title || '',
        body: selectedNote.value.body || '',
        book_id: selectedNote.value.book_id,
    };
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
            <LibrarySidebar
                :books="books"
                :selected-book-id="selectedBookId"
                :open-books="openBooks"
                :chapters-by-book="chaptersByBook"
                :characters-by-book="charactersByBook"
                :notes-by-book="notesByBook"
                :book-characters-open="bookCharactersOpen"
                :book-notes-open="bookNotesOpen"
                :selected-chapter-id="selectedChapterId"
                :selected-character-id="selectedCharacterId"
                :selected-note-id="selectedNoteId"
                :mode="mode"
                @update:selected-book-id="selectedBookId = $event"
                @update:selected-chapter-id="selectedChapterId = $event"
                @update:selected-character-id="selectedCharacterId = $event"
                @update:selected-note-id="selectedNoteId = $event"
                @update:mode="mode = $event"
                @create-book="createBook"
                @create-chapter="handleCreateChapter"
                @delete-book="handleDeleteBook"
                @delete-chapter="handleDeleteChapter"
                @toggle-book="toggleBook"
                @toggle-book-characters="toggleBookCharacters"
                @toggle-book-notes="toggleBookNotes"
                @select-character="handleSelectCharacter"
                @start-new-character="handleStartNewCharacter"
                @select-note="handleSelectNote"
                @start-new-note="handleStartNewNote"
                @delete-note="handleDeleteNote"
            />

            <WritingPage
                v-if="mode === 'writing'"
                :selected-chapter="selectedChapter"
                :is-saving="isSaving"
                :is-dirty="isDirty"
                :is-heading-faded="isHeadingFaded"
                :editor-font-size="editorFontSize"
                @set-editor-el="editorEl = $event"
                @save-content="scheduleSave('manual', saveEditorContent, 0)"
                @ensure-editor="handleEnsureEditor"
                @sync-editor="handleSyncEditor"
            />

            <CharactersPage
                v-else-if="mode === 'characters'"
                :character-draft="characterDraft"
                :books="books"
                :selected-character-id="selectedCharacterId"
                @update:character-draft="characterDraft = $event"
                @save-character="handleSaveCharacter"
                @delete-character="handleDeleteCharacter"
                @update:mode="mode = $event"
            />

            <NotesPage
                v-else
                :note-draft="noteDraft"
                :books="books"
                :selected-note-id="selectedNoteId"
                @update:note-draft="noteDraft = $event"
                @save-note="handleSaveNote"
                @delete-note="handleDeleteNote"
                @update:mode="mode = $event"
            />

            <SettingsSidebar
                :mode="mode"
                :theme="theme"
                :site-font-size="siteFontSize"
                :editor-font-size="editorFontSize"
                :selected-chapter="selectedChapter"
                :selected-character="selectedCharacter"
                :active-book="activeBook"
                :note-book="noteBook"
                :book-stats="bookStats"
                :is-saving="isSaving"
                :note-draft="noteDraft"
                :character-draft="characterDraft"
                :book-title-draft="bookTitleDraft"
                :title-draft="titleDraft"
                :position-draft="positionDraft"
                @update:theme="theme = $event"
                @update:site-font-size="siteFontSize = $event"
                @update:editor-font-size="editorFontSize = $event"
                @update:book-title-draft="bookTitleDraft = $event"
                @update:title-draft="titleDraft = $event"
                @update:position-draft="positionDraft = $event"
                @update:mode="mode = $event"
                @save-book-title="handleUpdateBookTitle"
                @save-chapter-title="handleSaveChapterTitle"
                @save-chapter-position="handleSaveChapterPosition"
            />
        </main>
    </div>
</template>
