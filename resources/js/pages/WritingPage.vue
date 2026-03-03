<script setup>
import { defineProps, defineEmits, onMounted, watch, ref } from 'vue';
import 'quill/dist/quill.snow.css';

const props = defineProps({
    selectedChapter: Object,
    isSaving: Boolean,
    isDirty: Boolean,
    isHeadingFaded: Boolean,
    editorFontSize: Number,
});

const emit = defineEmits(['saveContent', 'ensureEditor', 'syncEditor', 'setEditorEl']);

const editorEl = ref(null);

onMounted(() => {
    emit('setEditorEl', editorEl);
    emit('ensureEditor');
});

watch(() => props.selectedChapter, () => {
    emit('syncEditor');
});
</script>

<template>
    <section class="editor-panel space-y-4 rounded-[26px] border border-ink/10 bg-white/70 p-4 shadow-[0_30px_80px_rgba(61,60,52,0.18)] backdrop-blur">
        <div>
            <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-[0.3em] text-ink/50">Editor</p>
                <div class="flex items-center gap-2 text-xs text-ink/50">
                    <span v-if="selectedChapter">
                        {{ isSaving ? 'Saving…' : isDirty ? 'Unsaved changes' : 'Saved' }}
                    </span>
                    <button
                        class="rounded-full border border-ink/20 px-3 py-1 text-[0.6rem] uppercase tracking-[0.18em]"
                        :class="
                            selectedChapter
                                ? 'text-ink/70 hover:bg-ink/10'
                                : 'text-ink/30 cursor-not-allowed'
                        "
                        :disabled="!selectedChapter"
                        @click="emit('saveContent')"
                    >
                        Save
                    </button>
                </div>
            </div>

            <div class="editor-shell mt-3 rounded-3xl border border-ink/10 bg-white/90" :style="{ '--editor-font-size': `${editorFontSize}px` }">
                <div
                    v-if="selectedChapter"
                    class="editor-heading"
                    :class="{ 'editor-heading--faded': isHeadingFaded }"
                >
                    <p class="editor-heading__label">
                        Chapter {{ (selectedChapter.position ?? 0) + 1 }}
                    </p>
                    <p class="editor-heading__title">{{ selectedChapter.title }}</p>
                </div>
                <div ref="editorEl" class="quill-editor min-h-[520px]"></div>
            </div>
        </div>
    </section>
</template>
