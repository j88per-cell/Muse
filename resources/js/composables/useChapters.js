import { ref, computed } from 'vue';
import { useApi } from './useApi';

export function useChapters(selectedBookId) {
    const chapters = ref([]);
    const selectedChapterId = ref(null);
    const titleDraft = ref('');
    const positionDraft = ref('');

    const { apiRequest, getCsrfToken } = useApi();

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

    const loadChapters = async () => {
        chapters.value = await fetch('/api/chapters').then(res => res.json());

        if (!selectedChapterId.value && chapters.value.length > 0) {
            selectedChapterId.value = chapters.value[0].id;
        }
    };

    const createChapter = async (book) => {
        if (!book?.id) {
            return;
        }
        const title = window.prompt(`New chapter title for "${book.title}"`);
        if (!title) {
            return;
        }

        await apiRequest('/api/chapters', {
            method: 'POST',
            body: JSON.stringify({ book_id: book.id, title }),
        });

        await loadChapters();
    };

    const updateChapterField = async (chapterId, payload, { refresh = false, applyLocal = true } = {}) => {
        const updated = await apiRequest(`/api/chapters/${chapterId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        if (applyLocal && updated) {
            const index = chapters.value.findIndex((chapter) => chapter.id === chapterId);
            if (index !== -1) {
                chapters.value.splice(index, 1, { ...chapters.value[index], ...updated });
            }
        }

        if (refresh) {
            await loadChapters();
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

        await loadChapters();

        if (selectedChapterId.value === chapter.id) {
            selectedChapterId.value = chapters.value[0]?.id ?? null;
        }
    };

    return {
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
    };
}
