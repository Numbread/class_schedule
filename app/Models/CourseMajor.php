<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseMajor extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'code',
        'name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the course that owns this major.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the subjects for this major.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class, 'major_id');
    }

    /**
     * Get the full display name.
     */
    public function getFullNameAttribute(): string
    {
        $code = $this->code ? "{$this->code} - " : '';
        return "{$code}{$this->name}";
    }
}

