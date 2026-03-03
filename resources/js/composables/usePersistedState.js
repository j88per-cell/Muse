import { ref, watch } from 'vue';

/**
 * Creates a reactive ref that syncs with localStorage
 * @param {string} key - localStorage key
 * @param {*} defaultValue - default value if nothing in storage
 * @returns {Ref} - reactive ref synced with localStorage
 */
export function usePersistedState(key, defaultValue) {
    // Try to load from localStorage
    const stored = localStorage.getItem(key);
    const initialValue = stored !== null ? JSON.parse(stored) : defaultValue;

    const state = ref(initialValue);

    // Watch for changes and persist to localStorage
    watch(state, (newValue) => {
        if (newValue === null || newValue === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(newValue));
        }
    }, { deep: true });

    return state;
}

/**
 * Saves the current navigation state to localStorage
 */
export function saveNavigationState(state) {
    localStorage.setItem('muse-navigation', JSON.stringify({
        mode: state.mode,
        selectedBookId: state.selectedBookId,
        selectedChapterId: state.selectedChapterId,
        selectedCharacterId: state.selectedCharacterId,
        selectedNoteId: state.selectedNoteId,
    }));
}

/**
 * Loads navigation state from localStorage
 * Returns null if no state is saved
 */
export function loadNavigationState() {
    const stored = localStorage.getItem('muse-navigation');
    if (!stored) {
        return null;
    }

    try {
        return JSON.parse(stored);
    } catch (err) {
        console.error('Failed to parse stored navigation state:', err);
        return null;
    }
}

/**
 * Clears the stored navigation state
 */
export function clearNavigationState() {
    localStorage.removeItem('muse-navigation');
}
