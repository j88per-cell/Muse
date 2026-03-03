import { ref, computed } from 'vue';
import { useApi } from './useApi';

export function useCharacters() {
    const characters = ref([]);
    const selectedCharacterId = ref(null);
    const bookCharactersOpen = ref({});
    const characterDraft = ref({
        name: '',
        notes: '',
        book_ids: [],
    });

    const { apiRequest, getCsrfToken } = useApi();

    const selectedCharacter = computed(() => {
        return characters.value.find((character) => character.id === selectedCharacterId.value) || null;
    });

    const charactersByBook = computed(() => {
        const groups = {};
        for (const character of characters.value) {
            const bookIds = (character.books || []).map((book) => book.id);
            for (const bookId of bookIds) {
                if (!groups[bookId]) {
                    groups[bookId] = [];
                }
                groups[bookId].push(character);
            }
        }
        return groups;
    });

    const loadCharacters = async () => {
        characters.value = await fetch('/api/characters').then(res => res.json());
    };

    const startNewCharacter = () => {
        selectedCharacterId.value = null;
        characterDraft.value = {
            name: '',
            notes: '',
            book_ids: [],
        };
    };

    const selectCharacter = (character) => {
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

        const saved = await apiRequest(url, {
            method,
            body: JSON.stringify(payload),
        });

        await loadCharacters();
        selectedCharacterId.value = saved.id;

        return saved;
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

        await loadCharacters();
        selectedCharacterId.value = null;
        characterDraft.value = { name: '', notes: '', book_ids: [] };
    };

    const toggleBookCharacters = (bookId) => {
        bookCharactersOpen.value = {
            ...bookCharactersOpen.value,
            [bookId]: !bookCharactersOpen.value[bookId],
        };
    };

    return {
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
    };
}
