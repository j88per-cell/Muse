<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BookController;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\CharacterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;

Route::get('/', function () {
    return view('app');
});

Route::apiResource('books', BookController::class)
    ->only(['index', 'store', 'update', 'destroy']);

Route::get('books/{book}/export/pdf', [ExportController::class, 'bookPdf']);

Route::prefix('api')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('chapters', [ChapterController::class, 'index']);
    Route::post('chapters', [ChapterController::class, 'store']);
    Route::patch('chapters/{chapter}', [ChapterController::class, 'update']);
    Route::delete('chapters/{chapter}', [ChapterController::class, 'destroy']);
    Route::get('characters', [CharacterController::class, 'index']);
    Route::post('characters', [CharacterController::class, 'store']);
    Route::patch('characters/{character}', [CharacterController::class, 'update']);
    Route::delete('characters/{character}', [CharacterController::class, 'destroy']);
});
