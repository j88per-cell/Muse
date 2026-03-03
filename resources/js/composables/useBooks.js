import { ref, computed } from 'vue';
import { useApi } from './useApi';

export function useBooks() {
    const books = ref([]);
    const selectedBookId = ref('all');

    // Restore expanded books state from localStorage
    const storedOpenBooks = localStorage.getItem('muse-open-books');
    const openBooks = ref(storedOpenBooks ? JSON.parse(storedOpenBooks) : {});
    const bookTitleDraft = ref('');

    const { apiRequest, getCsrfToken } = useApi();

    const selectedBook = computed(() => {
        return books.value.find((book) => book.id === selectedBookId.value) || null;
    });

    const loadBooks = async () => {
        books.value = await fetch('/books').then(res => res.json());

        if (Object.keys(openBooks.value).length === 0) {
            const next = {};
            for (const book of books.value) {
                next[book.id] = false;
            }
            openBooks.value = next;
        }
    };

    const createBook = async () => {
        const title = window.prompt('New book title');
        if (!title) {
            return;
        }

        await apiRequest('/books', {
            method: 'POST',
            body: JSON.stringify({ title }),
        });

        await loadBooks();
    };

    const updateBookTitle = async (bookId, title) => {
        const value = title.trim();
        if (!value) {
            return;
        }

        const updated = await apiRequest(`/books/${bookId}`, {
            method: 'PATCH',
            body: JSON.stringify({ title: value }),
        });

        const index = books.value.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
            books.value.splice(index, 1, { ...books.value[index], ...updated });
        }
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

        await loadBooks();

        if (selectedBookId.value === book.id) {
            selectedBookId.value = 'all';
        }
    };

    const toggleBook = (bookId) => {
        openBooks.value = {
            ...openBooks.value,
            [bookId]: !openBooks.value[bookId],
        };
    };

    return {
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
    };
}
