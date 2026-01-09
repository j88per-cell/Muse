<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Chapter;
use App\Models\Character;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'books' => Book::count(),
            'chapters' => Chapter::count(),
            'characters' => Character::count(),
            'recent_chapters' => Chapter::query()
                ->latest('updated_at')
                ->limit(5)
                ->get(['id', 'book_id', 'title', 'updated_at']),
        ]);
    }
}
