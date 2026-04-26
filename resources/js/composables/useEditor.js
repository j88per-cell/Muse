import { ref, markRaw, nextTick } from 'vue';
import Quill from 'quill';

// Register annotation blot once at module load
const Inline = Quill.import('blots/inline');
class AnnotationBlot extends Inline {
    static create(annotationId) {
        const node = super.create();
        node.setAttribute('data-annotation-id', String(annotationId));
        return node;
    }
    static formats(node) {
        return node.getAttribute('data-annotation-id');
    }
}
AnnotationBlot.blotName = 'annotation';
AnnotationBlot.tagName = 'span';
AnnotationBlot.className = 'ql-annotation';
Quill.register(AnnotationBlot);

export function useEditor() {
    const editorEl = ref(null);
    const editorInstance = ref(null);
    const editorInitInProgress = ref(false);
    const isSyncingEditor = ref(false);
    const isSaving = ref(false);
    const isDirty = ref(false);
    const isHeadingFaded = ref(false);
    const editorScrollBound = ref(false);
    const latestContent = ref({ text: '', delta: null });
    const currentSelection = ref(null);
    const saveTimers = ref({
        title: null,
        position: null,
        content: null,
    });

    const ensureEditor = async () => {
        const element = editorEl.value?.value || editorEl.value;

        if (editorInstance.value || editorInitInProgress.value || !element) {
            return;
        }
        editorInitInProgress.value = true;
        await nextTick();
        if (element.querySelector('.ql-toolbar, .ql-container')) {
            element.innerHTML = '';
        }
        editorInstance.value = markRaw(
            new Quill(element, {
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

        if (!editorScrollBound.value && editorInstance.value.root) {
            editorInstance.value.root.addEventListener('scroll', () => {
                isHeadingFaded.value = editorInstance.value.root.scrollTop > 40;
            });
            editorScrollBound.value = true;
        }

        editorInitInProgress.value = false;
    };

    const syncEditor = (chapter) => {
        if (!editorInstance.value) {
            return;
        }
        const content = chapter?.content || '';
        const delta = chapter?.content_delta || null;
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

    const onTextChange = (callback) => {
        if (!editorInstance.value) return;

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
            callback();
        });
    };

    const onSelectionChange = (callback) => {
        if (!editorInstance.value) return;
        editorInstance.value.on('selection-change', (range) => {
            currentSelection.value = range;
            if (callback) callback(range);
        });
    };

    const getEditorContent = () => {
        if (!editorInstance.value) {
            return { text: '', delta: null };
        }
        return {
            delta: editorInstance.value.getContents(),
            text: editorInstance.value.getText(),
        };
    };

    const applyAnnotation = (index, length, annotationId) => {
        if (!editorInstance.value) return;
        editorInstance.value.formatText(index, length, 'annotation', annotationId, 'api');
    };

    const removeAnnotationById = (annotationId) => {
        if (!editorInstance.value) return;
        const delta = editorInstance.value.getContents();
        const ranges = [];
        let index = 0;
        for (const op of delta.ops) {
            const opLen = typeof op.insert === 'string' ? op.insert.length : 1;
            if (String(op.attributes?.annotation) === String(annotationId)) {
                ranges.push({ index, length: opLen });
            }
            index += opLen;
        }
        for (const range of ranges) {
            editorInstance.value.formatText(range.index, range.length, 'annotation', false, 'api');
        }
    };

    const scrollToAnnotation = (annotationId) => {
        if (!editorInstance.value) return;
        const el = editorInstance.value.root.querySelector(`[data-annotation-id="${annotationId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    return {
        editorEl,
        editorInstance,
        isSaving,
        isDirty,
        isHeadingFaded,
        latestContent,
        currentSelection,
        saveTimers,
        ensureEditor,
        syncEditor,
        onTextChange,
        onSelectionChange,
        getEditorContent,
        applyAnnotation,
        removeAnnotationById,
        scrollToAnnotation,
        scheduleSave,
    };
}
