<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChapterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Chapter::query()->with('book')->orderBy('position');

        if ($request->filled('book_id')) {
            $query->where('book_id', $request->string('book_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'book_id' => ['required', 'uuid', 'exists:books,id'],
            'title' => ['required', 'string', 'max:255'],
        ]);

        $position = Chapter::query()
            ->where('book_id', $data['book_id'])
            ->max('position');
        $position = is_null($position) ? 0 : $position + 1;

        $chapter = Chapter::create([
            'book_id' => $data['book_id'],
            'title' => $data['title'],
            'position' => $position,
            'content' => null,
        ]);

        return response()->json($chapter, 201);
    }

    public function destroy(Chapter $chapter): JsonResponse
    {
        $chapter->delete();

        return response()->json(['deleted' => true]);
    }

    public function update(Request $request, Chapter $chapter): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'position' => ['sometimes', 'required', 'integer', 'min:0'],
            'content' => ['sometimes', 'nullable', 'string'],
            'content_delta' => ['sometimes', 'nullable', 'string'],
            'content_format' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $chapter->update($data);

        return response()->json($chapter);
    }
}
