<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
    mode: String,
    theme: String,
    siteFontSize: Number,
    editorFontSize: Number,
    selectedChapter: Object,
    selectedCharacter: Object,
    activeBook: Object,
    noteBook: Object,
    bookStats: Object,
    isSaving: Boolean,
    noteDraft: Object,
    characterDraft: Object,
    bookTitleDraft: String,
    titleDraft: String,
    positionDraft: String,
});

const emit = defineEmits([
    'update:theme',
    'update:siteFontSize',
    'update:editorFontSize',
    'update:bookTitleDraft',
    'update:titleDraft',
    'update:positionDraft',
    'update:mode',
    'saveBookTitle',
    'saveChapterTitle',
    'saveChapterPosition',
]);
</script>

<template>
    <aside class="sidebar-panel space-y-5 rounded-3xl border border-ink/10 bg-white/70 p-4 shadow-[0_20px_60px_rgba(51,48,41,0.12)] backdrop-blur">
        <div>
            <p class="text-xs uppercase tracking-[0.35em] text-ink/50">Settings</p>
            <div class="mt-4 space-y-4 text-sm">
                <label class="block">
                    <span class="text-xs uppercase tracking-[0.3em] text-ink/40">Theme</span>
                    <div class="mt-2 flex items-center gap-2">
                        <button
                            class="flex-1 rounded-2xl border border-ink/15 px-3 py-2 text-xs uppercase tracking-[0.2em]"
                            :class="theme === 'light' ? 'bg-ink text-paper' : 'text-ink/60'"
                            @click="emit('update:theme', 'light')"
                        >
                            Light
                        </button>
                        <button
                            class="flex-1 rounded-2xl border border-ink/15 px-3 py-2 text-xs uppercase tracking-[0.2em]"
                            :class="theme === 'dark' ? 'bg-ink text-paper' : 'text-ink/60'"
                            @click="emit('update:theme', 'dark')"
                        >
                            Dark
                        </button>
                    </div>
                </label>
                <label class="block">
                    <span class="text-xs uppercase tracking-[0.3em] text-ink/40">Site font size</span>
                    <div class="mt-2 flex items-center gap-3">
                        <input
                            :value="siteFontSize"
                            @input="emit('update:siteFontSize', Number($event.target.value))"
                            type="range"
                            min="16"
                            max="22"
                            step="1"
                            class="w-full"
                        />
                        <span class="w-10 text-right">{{ siteFontSize }}px</span>
                    </div>
                </label>
                <label class="block">
                    <span class="text-xs uppercase tracking-[0.3em] text-ink/40">Editor font size</span>
                    <div class="mt-2 flex items-center gap-3">
                        <input
                            :value="editorFontSize"
                            @input="emit('update:editorFontSize', Number($event.target.value))"
                            type="range"
                            min="18"
                            max="32"
                            step="1"
                            class="w-full"
                        />
                        <span class="w-10 text-right">{{ editorFontSize }}px</span>
                    </div>
                </label>
            </div>
        </div>

        <div v-if="mode === 'writing'" class="rounded-2xl border border-ink/10 bg-paper/70 px-3 py-4 text-sm">
            <p class="text-xs uppercase tracking-[0.3em] text-ink/40">Context</p>
            <div class="mt-3 space-y-3">
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Book</label>
                    <input
                        :value="bookTitleDraft"
                        @input="emit('update:bookTitleDraft', $event.target.value); emit('saveBookTitle')"
                        class="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-base"
                        :disabled="!activeBook"
                        :placeholder="activeBook ? 'Book title' : 'All books'"
                    />
                </div>
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Chapter title</label>
                    <input
                        :value="titleDraft"
                        @input="emit('update:titleDraft', $event.target.value); emit('saveChapterTitle')"
                        class="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-base"
                        placeholder="Select a chapter"
                    />
                </div>
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Chapter number</label>
                    <input
                        :value="positionDraft"
                        @input="emit('update:positionDraft', $event.target.value); emit('saveChapterPosition')"
                        class="mt-1 w-full rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-base"
                        type="number"
                        min="1"
                    />
                </div>
                <div class="text-xs text-ink/50">
                    {{ isSaving ? 'Saving…' : 'Auto-save on' }}
                </div>
                <div class="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-xs text-ink/60">
                    {{ bookStats?.title }} · {{ bookStats?.chapters }} chapters
                </div>
                <a
                    v-if="activeBook"
                    class="inline-flex items-center justify-center rounded-full border border-ink/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                    :href="`/books/${activeBook.id}/export/pdf`"
                    target="_blank"
                    rel="noopener"
                >
                    Export PDF
                </a>
                <a
                    class="inline-flex items-center justify-center rounded-full border border-ink/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                    href="/exports/backup"
                    target="_blank"
                    rel="noopener"
                >
                    Export Backup (folder)
                </a>
            </div>
        </div>

        <div v-else-if="mode === 'characters'" class="rounded-2xl border border-ink/10 bg-paper/70 px-3 py-4 text-sm">
            <p class="text-xs uppercase tracking-[0.3em] text-ink/40">Character</p>
            <div class="mt-3 space-y-2 text-sm text-ink/70">
                <p class="text-base font-semibold text-ink">
                    {{ selectedCharacter?.name || 'New character' }}
                </p>
                <p class="text-xs text-ink/50">
                    {{ (characterDraft?.book_ids || []).length }} linked books
                </p>
                <button
                    class="mt-2 rounded-full border border-ink/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                    @click="emit('update:mode', 'writing')"
                >
                    Back to writing
                </button>
            </div>
        </div>

        <div v-else class="rounded-2xl border border-ink/10 bg-paper/70 px-3 py-4 text-sm">
            <p class="text-xs uppercase tracking-[0.3em] text-ink/40">Note</p>
            <div class="mt-3 space-y-2 text-sm text-ink/70">
                <p class="text-base font-semibold text-ink">
                    {{ noteDraft?.title || 'Untitled note' }}
                </p>
                <p class="text-xs text-ink/50">
                    {{ noteBook?.title || 'No book selected' }}
                </p>
                <button
                    class="mt-2 rounded-full border border-ink/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                    @click="emit('update:mode', 'writing')"
                >
                    Back to writing
                </button>
            </div>
        </div>
    </aside>
</template>
