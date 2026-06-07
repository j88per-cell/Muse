<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportCsvData extends Command
{
    protected $signature = 'import:csv {path : Directory containing the CSV files}';

    protected $description = 'Import CSV exports from SQLite into the current database';

    public function handle(): int
    {
        $path = rtrim($this->argument('path'), '/');

        if (! is_dir($path)) {
            $this->error("Directory not found: $path");
            return 1;
        }

        // Order matters: parents before children
        $tables = [
            'books'               => ['id', 'title', 'created_at', 'updated_at', 'deleted_at'],
            'characters'          => ['id', 'name', 'notes', 'created_at', 'updated_at'],
            'book_character'      => ['book_id', 'character_id', 'created_at', 'updated_at'],
            'chapters'            => ['id', 'book_id', 'title', 'position', 'content', 'created_at', 'updated_at', 'deleted_at', 'content_delta', 'content_format'],
            'notes'               => ['id', 'book_id', 'title', 'body', 'created_at', 'updated_at', 'deleted_at'],
            'chapter_annotations' => ['id', 'chapter_id', 'quill_index', 'quill_length', 'body', 'created_at', 'updated_at'],
        ];

        foreach ($tables as $table => $columns) {
            $file = "$path/$table.csv";

            if (! file_exists($file)) {
                $this->warn("Skipping $table — file not found: $file");
                continue;
            }

            $handle = fopen($file, 'r');
            $header = fgetcsv($handle);

            if ($header === false) {
                $this->warn("Skipping $table — empty file");
                fclose($handle);
                continue;
            }

            $this->info("Importing $table...");
            $count = 0;

            DB::transaction(function () use ($handle, $header, $table, $columns, &$count) {
                while (($row = fgetcsv($handle)) !== false) {
                    $data = array_combine($header, $row);

                    // Only keep columns that exist in our schema
                    $data = array_intersect_key($data, array_flip($columns));

                    // Convert empty strings to null for nullable fields
                    $data = array_map(fn($v) => $v === '' ? null : $v, $data);

                    DB::table($table)->insert($data);
                    $count++;
                }
            });

            fclose($handle);
            $this->info("  → $count rows inserted");
        }

        $this->info('Import complete.');
        return 0;
    }
}
