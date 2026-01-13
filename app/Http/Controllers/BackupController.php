<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Character;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class BackupController extends Controller
{
    public function export(): JsonResponse
    {
        $timestamp = Carbon::now()->format('Ymd-His');
        $baseDir = storage_path("app/exports/muse-backup-{$timestamp}");
        $booksDir = "{$baseDir}/books";
        $charactersDir = "{$baseDir}/characters";

        File::ensureDirectoryExists($booksDir);
        File::ensureDirectoryExists($charactersDir);

        $books = Book::query()
            ->with(['chapters' => fn ($query) => $query->orderBy('position')])
            ->orderBy('title')
            ->get();

        $characters = Character::query()
            ->with('books:id,title')
            ->orderBy('name')
            ->get();

        $notes = Note::query()
            ->with('book:id,title')
            ->orderByDesc('updated_at')
            ->get();

        $manifest = [
            'exported_at' => Carbon::now()->toIso8601String(),
            'version' => 1,
            'books' => $books->count(),
            'chapters' => $books->sum(fn ($book) => $book->chapters->count()),
            'characters' => $characters->count(),
            'notes' => $notes->count(),
        ];

        File::put("{$baseDir}/manifest.json", json_encode($manifest, JSON_PRETTY_PRINT));
        File::put("{$charactersDir}/characters.json", $characters->toJson(JSON_PRETTY_PRINT));
        File::put("{$baseDir}/notes.json", $notes->toJson(JSON_PRETTY_PRINT));

        foreach ($books as $book) {
            $bookSlug = Str::slug($book->title ?: 'untitled-book');
            $bookPath = "{$booksDir}/{$bookSlug}";
            $chaptersPath = "{$bookPath}/chapters";

            File::ensureDirectoryExists($chaptersPath);
            File::put("{$bookPath}/book.json", $book->toJson(JSON_PRETTY_PRINT));

            foreach ($book->chapters as $chapter) {
                $index = str_pad((string) ($chapter->position + 1), 3, '0', STR_PAD_LEFT);
                $chapterSlug = Str::slug($chapter->title ?: 'chapter');
                $fileName = "{$index}-{$chapterSlug}.md";
                $body = trim($chapter->content ?? '');
                $markdown = "---\n";
                $markdown .= "title: \"" . str_replace('"', '\\"', $chapter->title ?? '') . "\"\n";
                $markdown .= "position: " . ($chapter->position + 1) . "\n";
                $markdown .= "book: \"" . str_replace('"', '\\"', $book->title ?? '') . "\"\n";
                $markdown .= "---\n\n";
                $markdown .= $body;
                $markdown .= "\n";

                File::put("{$chaptersPath}/{$fileName}", $markdown);
            }

            $bookNotes = $notes->where('book_id', $book->id);
            if ($bookNotes->isNotEmpty()) {
                $notesPath = "{$bookPath}/notes";
                File::ensureDirectoryExists($notesPath);
                foreach ($bookNotes as $note) {
                    $noteSlug = Str::slug($note->title ?: 'note');
                    $noteFile = "{$noteSlug}.md";
                    $noteBody = trim($note->body ?? '');
                    $noteMarkdown = "---\n";
                    $noteMarkdown .= "title: \"" . str_replace('"', '\\"', $note->title ?? '') . "\"\n";
                    $noteMarkdown .= "book: \"" . str_replace('"', '\\"', $book->title ?? '') . "\"\n";
                    $noteMarkdown .= "---\n\n";
                    $noteMarkdown .= $noteBody;
                    $noteMarkdown .= "\n";
                    File::put("{$notesPath}/{$noteFile}", $noteMarkdown);
                }
            }
        }

        return response()->json([
            'status' => 'ok',
            'path' => $baseDir,
            'message' => 'Backup exported to local folder.',
        ]);
    }
}
