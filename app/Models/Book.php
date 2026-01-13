<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Book extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'title',
    ];

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class);
    }

    public function characters(): BelongsToMany
    {
        return $this->belongsToMany(Character::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }
}
