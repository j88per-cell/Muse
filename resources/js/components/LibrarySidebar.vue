<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    books: Array,
    selectedBookId: [String, Number],
    openBooks: Object,
    chaptersByBook: Object,
    charactersByBook: Object,
    notesByBook: Object,
    bookCharactersOpen: Object,
    bookNotesOpen: Object,
    selectedChapterId: [Number, String],
    selectedCharacterId: [Number, String],
    selectedNoteId: [Number, String],
    mode: String,
});

const emit = defineEmits([
    'update:selectedBookId',
    'update:selectedChapterId',
    'update:selectedCharacterId',
    'update:selectedNoteId',
    'update:mode',
    'createBook',
    'createChapter',
    'deleteBook',
    'deleteChapter',
    'toggleBook',
    'toggleBookCharacters',
    'toggleBookNotes',
    'selectCharacter',
    'startNewCharacter',
    'selectNote',
    'startNewNote',
    'deleteNote',
]);
</script>

<template>
    <aside class="sidebar-panel space-y-5 rounded-3xl border border-ink/10 bg-white/70 p-4 shadow-[0_20px_60px_rgba(51,48,41,0.12)] backdrop-blur">
        <div>
            <div class="flex items-center justify-between">
                <p class="text-xs uppercase tracking-[0.35em] text-ink/50">Library</p>
                <button
                    class="rounded-full border border-ink/20 px-3 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink/60 transition hover:border-ink/40 hover:text-ink"
                    @click="emit('createBook')"
                >
                    New book
                </button>
            </div>
            <div class="mt-4 space-y-3 text-sm">
                <button
                    class="flex w-full items-center gap-2 rounded-xl px-[10px] py-1 text-left text-sm transition"
                    :class="
                        selectedBookId === 'all'
                            ? 'bg-ink text-paper'
                            : 'text-ink/70 hover:bg-ink/10 hover:text-ink'
                    "
                    @click="emit('update:selectedBookId', 'all')"
                >
                    <span class="text-lg">📁</span>
                    <span>All books</span>
                </button>

                <div v-for="book in books" :key="book.id" class="space-y-2">
                    <div class="flex items-center gap-2">
                        <button
                            class="flex h-6 w-6 items-center justify-center rounded-full border border-ink/20 text-xs leading-none text-ink/60"
                            @click="emit('toggleBook', book.id)"
                        >
                            {{ openBooks[book.id] ? '−' : '+' }}
                        </button>
                        <button
                            class="flex flex-1 items-center gap-2 rounded-xl px-[10px] py-1 text-left leading-tight transition"
                            :class="
                                selectedBookId === book.id
                                    ? 'bg-ink text-paper'
                                    : 'text-ink/70 hover:bg-ink/10 hover:text-ink'
                            "
                            @click="emit('update:selectedBookId', book.id)"
                        >
                            <span class="text-lg">📁</span>
                            <span class="truncate">{{ book.title }}</span>
                        </button>
                        <button
                            class="rounded-full border border-ink/20 px-2 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink/60"
                            @click="emit('createChapter', book)"
                        >
                            +
                        </button>
                        <button
                            class="rounded-full border border-ink/20 px-2 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink/60"
                            @click="emit('deleteBook', book)"
                        >
                            Delete
                        </button>
                    </div>
                    <div v-if="openBooks[book.id]" class="ml-8 space-y-3">
                        <!-- Chapters -->
                        <div class="space-y-1">
                            <div
                                v-for="chapter in chaptersByBook[book.id] || []"
                                :key="chapter.id"
                                class="flex items-center gap-2"
                            >
                                <button
                                    class="flex flex-1 items-center gap-2 rounded-xl px-[10px] py-1 text-left text-xs transition"
                                    :class="
                                        selectedChapterId === chapter.id && mode === 'writing'
                                            ? 'bg-ink text-paper'
                                            : 'text-ink/60 hover:bg-ink/10 hover:text-ink'
                                    "
                                    @click="
                                        emit('update:selectedChapterId', chapter.id);
                                        emit('update:selectedNoteId', null);
                                        emit('update:mode', 'writing');
                                    "
                                >
                                    <span>📄</span>
                                    <span class="truncate">{{ chapter.title }}</span>
                                </button>
                                <button
                                    class="rounded-full border border-ink/20 px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-ink/50"
                                    @click="emit('deleteChapter', chapter)"
                                >
                                    Delete
                                </button>
                            </div>
                            <div v-if="!(chaptersByBook[book.id] || []).length" class="text-xs text-ink/40">
                                No chapters yet
                            </div>
                        </div>

                        <!-- Characters -->
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <button
                                    class="flex h-5 w-5 items-center justify-center rounded-full border border-ink/20 text-xs leading-none text-ink/60"
                                    @click="emit('toggleBookCharacters', book.id)"
                                >
                                    {{ bookCharactersOpen[book.id] ? '−' : '+' }}
                                </button>
                                <span class="text-xs text-ink/60">👤 Characters</span>
                                <button
                                    class="ml-auto rounded-full border border-ink/20 px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-ink/50"
                                    @click="emit('startNewCharacter')"
                                >
                                    +
                                </button>
                            </div>
                            <div v-if="bookCharactersOpen[book.id]" class="ml-6 space-y-1">
                                <button
                                    v-for="character in charactersByBook[book.id] || []"
                                    :key="character.id"
                                    class="flex w-full items-center gap-2 rounded-xl px-[10px] py-1 text-left text-xs transition"
                                    :class="
                                        selectedCharacterId === character.id && mode === 'characters'
                                            ? 'bg-ink text-paper'
                                            : 'text-ink/60 hover:bg-ink/10 hover:text-ink'
                                    "
                                    @click="emit('selectCharacter', character)"
                                >
                                    <span>👤</span>
                                    <span class="truncate">{{ character.name }}</span>
                                </button>
                                <div v-if="!(charactersByBook[book.id] || []).length" class="text-xs text-ink/40">
                                    No characters yet
                                </div>
                            </div>
                        </div>

                        <!-- Notes -->
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <button
                                    class="flex h-5 w-5 items-center justify-center rounded-full border border-ink/20 text-xs leading-none text-ink/60"
                                    @click="emit('toggleBookNotes', book.id)"
                                >
                                    {{ bookNotesOpen[book.id] ? '−' : '+' }}
                                </button>
                                <span class="text-xs text-ink/60">🗒️ Notes</span>
                                <button
                                    class="ml-auto rounded-full border border-ink/20 px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-ink/50"
                                    @click="emit('startNewNote')"
                                >
                                    +
                                </button>
                            </div>
                            <div v-if="bookNotesOpen[book.id]" class="ml-6 space-y-1">
                                <div
                                    v-for="note in notesByBook[book.id] || []"
                                    :key="note.id"
                                    class="flex items-center gap-2"
                                >
                                    <button
                                        class="flex flex-1 items-center gap-2 rounded-xl px-[10px] py-1 text-left text-xs transition"
                                        :class="
                                            selectedNoteId === note.id && mode === 'notes'
                                                ? 'bg-ink text-paper'
                                                : 'text-ink/60 hover:bg-ink/10 hover:text-ink'
                                        "
                                        @click="emit('selectNote', note)"
                                    >
                                        <span>🗒️</span>
                                        <span class="truncate">{{ note.title || 'Untitled note' }}</span>
                                    </button>
                                    <button
                                        class="rounded-full border border-ink/20 px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-ink/50"
                                        @click="emit('deleteNote', note)"
                                    >
                                        Delete
                                    </button>
                                </div>
                                <div v-if="!(notesByBook[book.id] || []).length" class="text-xs text-ink/40">
                                    No notes yet
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </aside>
</template>
