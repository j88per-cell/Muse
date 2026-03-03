import { ref, computed } from 'vue';
import { useApi } from './useApi';

export function useNotes() {
    const notes = ref([]);
    const selectedNoteId = ref(null);

    // Restore expanded notes sections from localStorage
    const storedNotesOpen = localStorage.getItem('muse-book-notes-open');
    const bookNotesOpen = ref(storedNotesOpen ? JSON.parse(storedNotesOpen) : {});

    const noteDraft = ref({
        title: '',
        body: '',
        book_id: '',
    });

    const { apiRequest, getCsrfToken } = useApi();

    const selectedNote = computed(() => {
        return notes.value.find((note) => note.id === selectedNoteId.value) || null;
    });

    const notesByBook = computed(() => {
        const groups = {};
        for (const note of notes.value) {
            if (note.book_id) {
                if (!groups[note.book_id]) {
                    groups[note.book_id] = [];
                }
                groups[note.book_id].push(note);
            }
        }
        return groups;
    });

    const loadNotes = async () => {
        notes.value = await fetch('/api/notes').then(res => res.json());
    };

    const startNewNote = (defaultBookId = null) => {
        selectedNoteId.value = null;
        noteDraft.value = {
            title: '',
            body: '',
            book_id: defaultBookId || '',
        };
    };

    const selectNote = (note) => {
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
            throw new Error('Select a book for this note.');
        }

        const isNew = !selectedNoteId.value;
        const url = isNew ? '/api/notes' : `/api/notes/${selectedNoteId.value}`;
        const method = isNew ? 'POST' : 'PATCH';

        const saved = await apiRequest(url, {
            method,
            body: JSON.stringify(payload),
        });

        await loadNotes();
        selectedNoteId.value = saved.id;

        return saved;
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

        await loadNotes();

        if (selectedNoteId.value === noteId) {
            selectedNoteId.value = null;
            noteDraft.value = { title: '', body: '', book_id: '' };
        }
    };

    const toggleBookNotes = (bookId) => {
        bookNotesOpen.value = {
            ...bookNotesOpen.value,
            [bookId]: !bookNotesOpen.value[bookId],
        };
    };

    return {
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
    };
}
