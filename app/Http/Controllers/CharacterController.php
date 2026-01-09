<?php

namespace App\Http\Controllers;

use App\Models\Character;
use Illuminate\Http\JsonResponse;

class CharacterController extends Controller
{
    public function index(): JsonResponse
    {
        $characters = Character::query()
            ->withCount('books')
            ->orderBy('name')
            ->get();

        return response()->json($characters);
    }
}
