<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    characterDraft: Object,
    books: Array,
    selectedCharacterId: [Number, String],
});

const emit = defineEmits([
    'update:characterDraft',
    'saveCharacter',
    'deleteCharacter',
    'update:mode',
]);

const updateName = (value) => {
    emit('update:characterDraft', { ...props.characterDraft, name: value });
};

const updateNotes = (value) => {
    emit('update:characterDraft', { ...props.characterDraft, notes: value });
};

const updateBookIds = (value) => {
    emit('update:characterDraft', { ...props.characterDraft, book_ids: value });
};
</script>

<template>
    <section class="editor-panel space-y-4 rounded-[26px] border border-ink/10 bg-white/70 p-4 shadow-[0_30px_80px_rgba(61,60,52,0.18)] backdrop-blur">
        <div>
            <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-[0.3em] text-ink/50">Character</p>
            </div>

            <div class="mt-3 space-y-4 rounded-3xl border border-ink/10 bg-white/90 p-4">
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Name</label>
                    <input
                        :value="characterDraft.name"
                        @input="updateName($event.target.value)"
                        class="mt-2 w-full rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                        placeholder="Character name"
                    />
                </div>
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Notes</label>
                    <textarea
                        :value="characterDraft.notes"
                        @input="updateNotes($event.target.value)"
                        class="mt-2 h-40 w-full resize-none rounded-2xl border border-ink/10 bg-white/90 px-3 py-2 text-base"
                        placeholder="Traits, backstory, voice notes..."
                    ></textarea>
                </div>
                <div>
                    <label class="text-xs uppercase tracking-[0.3em] text-ink/40">Books</label>
                    <div class="mt-2 space-y-2 text-sm text-ink/70">
                        <label v-for="book in books" :key="book.id" class="flex items-center gap-2">
                            <input
                                :checked="characterDraft.book_ids.includes(book.id)"
                                @change="
                                    $event.target.checked
                                        ? updateBookIds([...characterDraft.book_ids, book.id])
                                        : updateBookIds(characterDraft.book_ids.filter(id => id !== book.id))
                                "
                                type="checkbox"
                                :value="book.id"
                            />
                            <span>{{ book.title }}</span>
                        </label>
                        <div v-if="!books.length" class="text-xs text-ink/50">No books yet.</div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        class="rounded-full bg-ink px-4 py-2 text-xs uppercase tracking-[0.2em] text-paper"
                        @click="emit('saveCharacter')"
                    >
                        Save character
                    </button>
                    <button
                        class="rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                        @click="emit('update:mode', 'writing')"
                    >
                        Back to writing
                    </button>
                    <button
                        v-if="selectedCharacterId"
                        class="ml-auto rounded-full border border-ink/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ink/70"
                        @click="emit('deleteCharacter')"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
