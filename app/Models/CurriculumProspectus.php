<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CurriculumProspectus extends Model
{
    use HasFactory;

    protected $table = 'curriculum_prospectuses';

    protected $fillable = [
        'department_id',
        'course_id',
        'name',
        'academic_year',
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
     * Get the department this prospectus belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the course this prospectus belongs to.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the subjects in this prospectus with their year level and semester.
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'curriculum_prospectus_subjects')
            ->withPivot(['year_level', 'semester', 'sort_order'])
            ->withTimestamps()
            ->orderByPivot('year_level')
            ->orderByPivot('semester')
            ->orderByPivot('sort_order');
    }

    /**
     * Get subjects for a specific year level.
     */
    public function subjectsForYear(string $yearLevel): BelongsToMany
    {
        return $this->subjects()->wherePivot('year_level', $yearLevel);
    }

    /**
     * Get subjects for a specific year level and semester.
     */
    public function subjectsForYearAndSemester(string $yearLevel, string $semester): BelongsToMany
    {
        return $this->subjects()
            ->wherePivot('year_level', $yearLevel)
            ->wherePivot('semester', $semester);
    }

    /**
     * Get the prospectus data organized by year level and semester.
     */
    public function getOrganizedSubjectsAttribute(): array
    {
        $organized = [];
        $yearLevels = ['1st', '2nd', '3rd', '4th', '5th'];
        $semesters = ['1st', '2nd', 'summer'];

        foreach ($yearLevels as $year) {
            $organized[$year] = [];
            foreach ($semesters as $sem) {
                $subjects = $this->subjects()
                    ->wherePivot('year_level', $year)
                    ->wherePivot('semester', $sem)
                    ->orderByPivot('sort_order')
                    ->get();

                if ($subjects->isNotEmpty()) {
                    $organized[$year][$sem] = $subjects;
                }
            }
            // Remove empty year levels
            if (empty($organized[$year])) {
                unset($organized[$year]);
            }
        }

        return $organized;
    }

    /**
     * Calculate total units for a semester.
     */
    public function getTotalUnitsForSemester(string $yearLevel, string $semester): int
    {
        return $this->subjects()
            ->wherePivot('year_level', $yearLevel)
            ->wherePivot('semester', $semester)
            ->sum('units');
    }

    /**
     * Get the full display name.
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->course?->code} - {$this->name}";
    }

    /**
     * Scope to get only active prospectuses.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
