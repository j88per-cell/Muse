<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Character;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookController extends Controller
{
    public function index(): JsonResponse
    {
        $books = Book::query()
            ->withCount('chapters')
            ->orderBy('title')
            ->get();

        return response()->json($books);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $book = Book::create($data);

        return response()->json($book, 201);
    }

    public function update(Request $request, Book $book): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $book->update($data);

        return response()->json($book);
    }

    public function destroy(Book $book): JsonResponse
    {
        DB::transaction(function () use ($book) {
            $book->chapters()->delete();
            $book->characters()->detach();
            $book->delete();

            $orphanedCharacters = Character::query()
                ->whereDoesntHave('books')
                ->get();
            foreach ($orphanedCharacters as $character) {
                $character->delete();
            }
        });

        return response()->json(['deleted' => true]);
    }
}
