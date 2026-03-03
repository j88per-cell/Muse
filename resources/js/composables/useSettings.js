import { ref, watch, onMounted } from 'vue';

export function useSettings() {
    const siteFontSize = ref(18);
    const editorFontSize = ref(24);
    const theme = ref('light');

    const applySiteFontSize = () => {
        document.documentElement.style.fontSize = `${siteFontSize.value}px`;
    };

    const applyTheme = () => {
        document.documentElement.dataset.theme = theme.value;
        localStorage.setItem('muse-theme', theme.value);
    };

    const loadSettings = () => {
        const storedTheme = localStorage.getItem('muse-theme');
        theme.value = storedTheme || 'light';
        applyTheme();
        applySiteFontSize();
    };

    watch(siteFontSize, () => {
        applySiteFontSize();
    });

    watch(theme, () => {
        applyTheme();
    });

    return {
        siteFontSize,
        editorFontSize,
        theme,
        loadSettings,
        applySiteFontSize,
        applyTheme,
    };
}
