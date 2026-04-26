<?php

namespace App\Http\Controllers;

use App\Models\Chapter;
use App\Models\ChapterAnnotation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChapterAnnotationController extends Controller
{
    public function index(Chapter $chapter): JsonResponse
    {
        return response()->json(
            $chapter->annotations()->orderBy('quill_index')->get()
        );
    }

    public function store(Request $request, Chapter $chapter): JsonResponse
    {
        $data = $request->validate([
            'quill_index'  => ['required', 'integer', 'min:0'],
            'quill_length' => ['required', 'integer', 'min:1'],
            'body'         => ['required', 'string', 'max:2000'],
        ]);

        $annotation = $chapter->annotations()->create($data);

        return response()->json($annotation, 201);
    }

    public function destroy(ChapterAnnotation $annotation): JsonResponse
    {
        $annotation->delete();

        return response()->json(['deleted' => true]);
    }
}
