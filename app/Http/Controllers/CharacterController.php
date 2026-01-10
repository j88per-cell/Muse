<?php

namespace App\Http\Controllers;

use App\Models\Character;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CharacterController extends Controller
{
    public function index(): JsonResponse
    {
        $characters = Character::query()
            ->with('books:id,title')
            ->withCount('books')
            ->orderBy('name')
            ->get();

        return response()->json($characters);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'book_ids' => ['nullable', 'array'],
            'book_ids.*' => ['uuid', 'exists:books,id'],
        ]);

        $character = Character::create([
            'name' => $data['name'],
            'notes' => $data['notes'] ?? null,
        ]);

        if (!empty($data['book_ids'])) {
            $character->books()->sync($data['book_ids']);
        }

        return response()->json($character->load('books:id,title'), 201);
    }

    public function update(Request $request, Character $character): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'book_ids' => ['nullable', 'array'],
            'book_ids.*' => ['uuid', 'exists:books,id'],
        ]);

        $character->update([
            'name' => $data['name'],
            'notes' => $data['notes'] ?? null,
        ]);

        $character->books()->sync($data['book_ids'] ?? []);

        return response()->json($character->load('books:id,title'));
    }

    public function destroy(Character $character): JsonResponse
    {
        $character->books()->detach();
        $character->delete();

        return response()->json(['deleted' => true]);
    }
}
