<script setup>
import { defineProps, defineEmits, onMounted, watch, ref } from 'vue';
import 'quill/dist/quill.snow.css';

const props = defineProps({
    selectedChapter: Object,
    isSaving: Boolean,
    isDirty: Boolean,
    isHeadingFaded: Boolean,
    editorFontSize: Number,
    currentSelection: Object,
    annotations: Array,
});

const emit = defineEmits(['saveContent', 'ensureEditor', 'syncEditor', 'setEditorEl', 'addAnnotation', 'deleteAnnotation', 'scrollToAnnotation']);

const editorEl = ref(null);

// Annotation form state
const annotationFormOpen = ref(false);
const annotationBody = ref('');
const pendingRange = ref(null);

const openAnnotationForm = () => {
    if (!props.currentSelection || props.currentSelection.length === 0) return;
    pendingRange.value = { index: props.currentSelection.index, length: props.currentSelection.length };
    annotationBody.value = '';
    annotationFormOpen.value = true;
};

const submitAnnotation = () => {
    if (!annotationBody.value.trim() || !pendingRange.value) return;
    emit('addAnnotation', {
        index: pendingRange.value.index,
        length: pendingRange.value.length,
        body: annotationBody.value.trim(),
    });
    annotationFormOpen.value = false;
    annotationBody.value = '';
    pendingRange.value = null;
};

const cancelAnnotation = () => {
    annotationFormOpen.value = false;
    annotationBody.value = '';
    pendingRange.value = null;
};

onMounted(() => {
    emit('setEditorEl', editorEl);
    emit('ensureEditor');
});

watch(() => props.selectedChapter, () => {
    emit('syncEditor');
    annotationFormOpen.value = false;
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
                        v-if="selectedChapter && currentSelection && currentSelection.length > 0 && !annotationFormOpen"
                        class="rounded-full border border-amber-400/60 bg-amber-50 px-3 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-amber-700 hover:bg-amber-100"
                        @click="openAnnotationForm"
                    >
                        Annotate
                    </button>
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

            <!-- Annotation input form -->
            <div v-if="annotationFormOpen" class="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <div class="flex-1">
                    <p class="mb-1 text-[0.65rem] uppercase tracking-[0.2em] text-amber-700/70">New annotation</p>
                    <textarea
                        v-model="annotationBody"
                        class="w-full resize-none rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-amber-300"
                        rows="2"
                        placeholder="Your annotation…"
                        autofocus
                        @keydown.enter.meta="submitAnnotation"
                        @keydown.escape="cancelAnnotation"
                    ></textarea>
                </div>
                <div class="flex flex-col gap-1 pt-6">
                    <button
                        class="rounded-full border border-amber-400 bg-amber-400 px-3 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-white hover:bg-amber-500"
                        @click="submitAnnotation"
                    >
                        Add
                    </button>
                    <button
                        class="rounded-full border border-ink/20 px-3 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink/50 hover:bg-ink/5"
                        @click="cancelAnnotation"
                    >
                        Cancel
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

            <!-- Annotations list -->
            <div v-if="selectedChapter && annotations && annotations.length > 0" class="mt-4 space-y-2">
                <p class="text-xs uppercase tracking-[0.3em] text-ink/40">Annotations</p>
                <div
                    v-for="annotation in annotations"
                    :key="annotation.id"
                    class="group flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 hover:border-amber-200 hover:bg-amber-50 transition cursor-pointer"
                    @click="emit('scrollToAnnotation', annotation.id)"
                >
                    <span class="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400"></span>
                    <p class="flex-1 text-sm text-ink/80">{{ annotation.body }}</p>
                    <button
                        class="flex-shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.15em] text-ink/30 opacity-0 transition hover:bg-ink/10 hover:text-ink/60 group-hover:opacity-100"
                        @click.stop="emit('deleteAnnotation', annotation.id)"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
