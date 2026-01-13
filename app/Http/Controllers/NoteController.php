<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Note::query()->with('book:id,title')->orderByDesc('updated_at');

        if ($request->filled('book_id')) {
            $query->where('book_id', $request->string('book_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'book_id' => ['required', 'uuid', 'exists:books,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
        ]);

        $note = Note::create($data);

        return response()->json($note->load('book:id,title'), 201);
    }

    public function update(Request $request, Note $note): JsonResponse
    {
        $data = $request->validate([
            'book_id' => ['required', 'uuid', 'exists:books,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
        ]);

        $note->update($data);

        return response()->json($note->load('book:id,title'));
    }

    public function destroy(Note $note): JsonResponse
    {
        $note->delete();

        return response()->json(['deleted' => true]);
    }
}
