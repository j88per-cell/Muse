<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chapter_annotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('chapter_id')->index();
            $table->unsignedInteger('quill_index');
            $table->unsignedInteger('quill_length');
            $table->text('body');
            $table->timestamps();

            $table->foreign('chapter_id')
                ->references('id')
                ->on('chapters')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapter_annotations');
    }
};
