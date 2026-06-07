<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PDO;

class ExportSqliteCsv extends Command
{
    protected $signature = 'export:sqlite-csv
                            {sqlite : Path to the SQLite file}
                            {output : Directory to write CSV files}';

    protected $description = 'Export SQLite tables to properly-escaped CSV files for Postgres import';

    private array $tables = [
        'books',
        'characters',
        'book_character',
        'chapters',
        'notes',
        'chapter_annotations',
    ];

    public function handle(): int
    {
        $sqlitePath = $this->argument('sqlite');
        $outputDir  = rtrim($this->argument('output'), '/');

        if (! file_exists($sqlitePath)) {
            $this->error("SQLite file not found: $sqlitePath");
            return 1;
        }

        if (! is_dir($outputDir) && ! mkdir($outputDir, 0755, true)) {
            $this->error("Could not create output directory: $outputDir");
            return 1;
        }

        $pdo = new PDO("sqlite:$sqlitePath");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        foreach ($this->tables as $table) {
            $file = "$outputDir/$table.csv";
            $handle = fopen($file, 'w');

            $stmt = $pdo->query("SELECT * FROM $table");
            $first = true;
            $count = 0;

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if ($first) {
                    fputcsv($handle, array_keys($row));
                    $first = false;
                }
                fputcsv($handle, array_values($row));
                $count++;
            }

            fclose($handle);
            $this->info("Exported $table → $count rows");
        }

        $this->info("Done. CSVs written to $outputDir/");
        return 0;
    }
}
