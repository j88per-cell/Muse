<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\Book;
use App\Models\Chapter;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('import:wonderpen {--fresh}', function () {
    $path = storage_path('app/private/data.json');
    if (!File::exists($path)) {
        $this->error('WonderPen data not found at storage/app/private/data.json.');
        return 1;
    }

    $fresh = (bool) $this->option('fresh');

    if (Book::count() > 0 && !$fresh) {
        $this->error('Books already exist. Re-run with --fresh to wipe and re-import.');
        return 1;
    }

    DB::transaction(function () use ($path, $fresh) {
        if ($fresh) {
            Chapter::query()->forceDelete();
            Book::query()->forceDelete();
        }

        $raw = json_decode(File::get($path), true);
        $docTree = Arr::get($raw, 'list.doc_tree', []);
        $items = Arr::get($raw, 'item.data', []);

        $docItems = collect($items)
            ->filter(fn ($item) => ($item['item_type'] ?? null) === 'doc')
            ->keyBy('item_id');

        $usedIds = [];
        $markUsed = function (?string $id) use (&$usedIds) {
            if ($id) {
                $usedIds[$id] = true;
            }
        };

        foreach ($docTree as $root) {
            $rootId = $root['id'] ?? null;
            $markUsed($rootId);

            $bookTitle = $root['title'] ?? 'Untitled Book';
            $book = Book::create(['title' => $bookTitle]);

            $position = 0;
            $rootItem = $rootId ? $docItems->get($rootId) : null;
            if ($rootItem && !empty($rootItem['content'])) {
                Chapter::create([
                    'book_id' => $book->id,
                    'title' => $rootItem['title'] ?? $bookTitle,
                    'position' => $position,
                    'content' => $rootItem['content'],
                ]);
                $position++;
            }

            foreach ($root['children'] ?? [] as $child) {
                $childId = $child['id'] ?? null;
                $markUsed($childId);

                if (!$childId) {
                    continue;
                }

                $item = $docItems->get($childId);
                Chapter::create([
                    'book_id' => $book->id,
                    'title' => $child['title'] ?? ($item['title'] ?? 'Untitled Chapter'),
                    'position' => $position,
                    'content' => $item['content'] ?? null,
                ]);
                $position++;
            }
        }

        $unsortedItems = $docItems
            ->reject(fn ($item, $id) => isset($usedIds[$id]))
            ->sortBy(fn ($item) => $item['created_at_ms'] ?? PHP_INT_MAX);

        if ($unsortedItems->isNotEmpty()) {
            $unsortedBook = Book::create(['title' => 'Unsorted']);
            $position = 0;
            foreach ($unsortedItems as $item) {
                Chapter::create([
                    'book_id' => $unsortedBook->id,
                    'title' => $item['title'] ?? 'Untitled Chapter',
                    'position' => $position,
                    'content' => $item['content'] ?? null,
                ]);
                $position++;
            }
        }
    });

    $this->info('WonderPen import complete.');
    return 0;
})->purpose('Import WonderPen data.json into books and chapters');
