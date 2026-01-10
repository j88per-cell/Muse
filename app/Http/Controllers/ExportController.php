<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class ExportController extends Controller
{
    public function bookPdf(Book $book): Response
    {
        $book->load(['chapters' => fn ($query) => $query->orderBy('position')]);

        $filename = Str::slug($book->title ?: 'book') . '.pdf';

        return Pdf::loadView('exports.book', [
            'book' => $book,
        ])->download($filename);
    }
}
