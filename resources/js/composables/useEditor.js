import { ref, markRaw, nextTick } from 'vue';
import Quill from 'quill';

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
    const saveTimers = ref({
        title: null,
        position: null,
        content: null,
    });

    const ensureEditor = async () => {
        // Get the actual DOM element - editorEl.value might be a ref or the element itself
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

    const getEditorContent = () => {
        if (!editorInstance.value) {
            return { text: '', delta: null };
        }
        return {
            delta: editorInstance.value.getContents(),
            text: editorInstance.value.getText(),
        };
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
        saveTimers,
        ensureEditor,
        syncEditor,
        onTextChange,
        getEditorContent,
        scheduleSave,
    };
}
