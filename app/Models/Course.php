<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'code',
        'name',
        'description',
        'years',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'years' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the department that owns this course.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the majors for this course.
     */
    public function majors(): HasMany
    {
        return $this->hasMany(CourseMajor::class);
    }

    /**
     * Get the subjects for this course (legacy relationship).
     * @deprecated Use sharedSubjects() for the many-to-many relationship.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    /**
     * Get subjects that belong to this course (many-to-many).
     */
    public function sharedSubjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'course_subject')
            ->withTimestamps();
    }

    /**
     * Get the full display name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->code} - {$this->name}";
    }
}

