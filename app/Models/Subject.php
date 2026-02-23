<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'major_id',
        'code',
        'name',
        'description',
        'units',
        'category',
        'lecture_hours',
        'lab_hours',
        'is_active',
    ];

    /**
     * Available subject categories for room assignment rules.
     */
    public static function getCategoryOptions(): array
    {
        return [
            'CISCO' => 'Cisco Subjects (CCNA, CCNP, etc.)',
            'BSCS_PURE' => 'BSCS Pure Subjects',
            'LICT' => 'LICT Subjects',
            'IT_CORE' => 'IT Core Subjects',
            'CPE_CORE' => 'CPE Core Subjects',
            'IS_CORE' => 'IS Core Subjects',
            'LIS' => 'Library and Information Science',
            'GENERAL' => 'General Education',
            'MINOR' => 'Minor Subjects',
        ];
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'units' => 'integer',
            'lecture_hours' => 'integer',
            'lab_hours' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the course that owns this subject (legacy single course relationship).
     * @deprecated Use courses() for the many-to-many relationship instead.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get all courses this subject belongs to.
     */
    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_subject')
            ->withTimestamps();
    }

    /**
     * Get the major for this subject.
     */
    public function major(): BelongsTo
    {
        return $this->belongsTo(CourseMajor::class, 'major_id');
    }

    /**
     * Get the prerequisites for this subject.
     */
    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'subject_prerequisites', 'subject_id', 'prerequisite_id')
            ->withPivot('requirement_type')
            ->withTimestamps();
    }

    /**
     * Get the subjects that require this subject as a prerequisite.
     */
    public function requiredFor(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'subject_prerequisites', 'prerequisite_id', 'subject_id')
            ->withPivot('requirement_type')
            ->withTimestamps();
    }

    /**
     * Get total hours (lecture + lab).
     */
    public function getTotalHoursAttribute(): int
    {
        return $this->lecture_hours + $this->lab_hours;
    }

    /**
     * Scope to get active subjects only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get equivalences where this subject is the primary.
     */
    public function equivalencesAsPrimary(): HasMany
    {
        return $this->hasMany(SubjectEquivalent::class, 'subject_id');
    }

    /**
     * Get equivalences where this subject is the equivalent.
     */
    public function equivalencesAsEquivalent(): HasMany
    {
        return $this->hasMany(SubjectEquivalent::class, 'equivalent_subject_id');
    }

    /**
     * Get all equivalent subjects for a given department.
     */
    public function getEquivalents(int $departmentId): array
    {
        return SubjectEquivalent::getEquivalentsFor($this->id, $departmentId);
    }

    /**
     * Check if this subject is equivalent to another subject.
     */
    public function isEquivalentTo(int $otherSubjectId, int $departmentId): bool
    {
        return SubjectEquivalent::areEquivalent($this->id, $otherSubjectId, $departmentId);
    }
}

