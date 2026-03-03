<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    noteDraft: Object,
    books: Array,
    selectedNoteId: [Number, String],
});

const emit = defineEmits([
    'update:noteDraft',
    'saveNote',
    'deleteNote',
    'update:mode',
]);

const updateTitle = (value) => {
    emit('update:noteDraft', { ...props.noteDraft, title: value });
};

const updateBody = (value) => {
    emit('update:noteDraft', { ...props.noteDraft, body: value });
};

const updateBookId = (value) => {
    emit('update:noteDraft', { ...props.noteDraft, book_id: value });
};
</script>

<template>
    <section class="editor-panel space-y-4 rounded-[26px] border border-ink/10 bg-white/70 p-4 shadow-[0_30px_80px_rgba(61,60,52,0.18)] backdrop-blur">
        <div>
            <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-[0.3em] text-ink/50">Note</p>
            </div>

            <div class="mt-3 space-y-4 rounded-3xl border border-ink/10 bg-white/90 p-4">
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Title</label>
                    <input
                        :value="noteDraft.title"
                        @input="updateTitle($event.target.value)"
                        class="mt-2 w-full rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                        placeholder="Note title"
                    />
                </div>
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Book</label>
                    <select
                        :value="noteDraft.book_id"
                        @input="updateBookId($event.target.value)"
                        class="mt-2 w-full rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                    >
                        <option value="" disabled>Select a book</option>
                        <option v-for="book in books" :key="book.id" :value="book.id">
                            {{ book.title }}
                        </option>
                    </select>
                </div>
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Note</label>
                    <textarea
                        :value="noteDraft.body"
                        @input="updateBody($event.target.value)"
                        class="mt-2 h-48 w-full resize-none rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                        placeholder="Plain text note..."
                    ></textarea>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        class="rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-[0.2em] text-paper"
                        @click="emit('saveNote')"
                    >
                        Save note
                    </button>
                    <button
                        class="rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                        @click="emit('update:mode', 'writing')"
                    >
                        Back to writing
                    </button>
                    <button
                        v-if="selectedNoteId"
                        class="ml-auto rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                        @click="emit('deleteNote')"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
