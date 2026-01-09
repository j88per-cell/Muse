<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Chapter extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'book_id',
        'title',
        'position',
        'content',
        'content_delta',
        'content_format',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}
