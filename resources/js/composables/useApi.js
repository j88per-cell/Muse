import { ref } from 'vue';

export function useApi() {
    const loading = ref(false);
    const error = ref(null);

    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    };

    const apiRequest = async (url, options = {}) => {
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                ...options.headers,
            },
            credentials: 'same-origin',
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Request failed (${response.status}). ${text.slice(0, 200)}`);
        }

        return response.json();
    };

    return {
        loading,
        error,
        getCsrfToken,
        apiRequest,
    };
}
