import { ref } from 'vue';
import { useApi } from './useApi';

export function useChapterAnnotations() {
    const annotations = ref([]);
    const { apiRequest, getCsrfToken } = useApi();

    const loadAnnotations = async (chapterId) => {
        if (!chapterId) {
            annotations.value = [];
            return;
        }
        annotations.value = await fetch(`/api/chapters/${chapterId}/annotations`).then(r => r.json());
    };

    const createAnnotation = async (chapterId, quillIndex, quillLength, body) => {
        const annotation = await apiRequest(`/api/chapters/${chapterId}/annotations`, {
            method: 'POST',
            body: JSON.stringify({ quill_index: quillIndex, quill_length: quillLength, body }),
        });
        annotations.value.push(annotation);
        annotations.value.sort((a, b) => a.quill_index - b.quill_index);
        return annotation;
    };

    const deleteAnnotation = async (annotationId) => {
        await fetch(`/api/annotations/${annotationId}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': getCsrfToken() },
            credentials: 'same-origin',
        });
        annotations.value = annotations.value.filter(a => a.id !== annotationId);
    };

    // After a content save, remove any DB annotations whose blot is gone from the delta
    const pruneOrphaned = async (delta) => {
        if (!delta?.ops) return;
        const activeIds = new Set(
            delta.ops
                .filter(op => op.attributes?.annotation)
                .map(op => String(op.attributes.annotation))
        );
        const orphaned = annotations.value.filter(a => !activeIds.has(String(a.id)));
        for (const annotation of orphaned) {
            await deleteAnnotation(annotation.id);
        }
    };

    return {
        annotations,
        loadAnnotations,
        createAnnotation,
        deleteAnnotation,
        pruneOrphaned,
    };
}
