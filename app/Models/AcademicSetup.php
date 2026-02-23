<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class AcademicSetup extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'course_id', // Deprecated: kept for backwards compatibility, use courses() instead
        'curriculum_name',
        'academic_year',
        'semester',
        'is_active',
        'status', // draft, configuring, active, archived
        'current_config_year', // Which year level is currently being configured
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'current_config_year' => 'integer',
        ];
    }

    /**
     * Get the department.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the courses/programs included in this setup (many-to-many).
     * This is the new way - a setup can include multiple courses from the same department.
     */
    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'academic_setup_courses')
            ->withTimestamps();
    }

    /**
     * Get the primary course (deprecated, for backwards compatibility).
     * Use courses() instead.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get all course IDs in this setup.
     */
    public function getCourseIdsAttribute(): array
    {
        return $this->courses->pluck('id')->toArray();
    }

    /**
     * Get course codes as a comma-separated string.
     */
    public function getCourseCodesAttribute(): string
    {
        return $this->courses->pluck('code')->implode(', ');
    }

    /**
     * Get the creator.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the year levels for this setup.
     */
    public function yearLevels(): HasMany
    {
        return $this->hasMany(AcademicSetupYearLevel::class)->orderByRaw("FIELD(year_level, '1st', '2nd', '3rd', '4th', '5th')");
    }

    /**
     * Get all subjects across all year levels.
     */
    public function subjects(): HasManyThrough
    {
        return $this->hasManyThrough(
            AcademicSetupSubject::class,
            AcademicSetupYearLevel::class,
            'academic_setup_id', // FK on year_levels table
            'year_level_id', // FK on subjects table
            'id', // Local key on academic_setups
            'id' // Local key on year_levels
        );
    }

    /**
     * Get the faculty in this setup (available for all year levels).
     */
    public function faculty(): HasMany
    {
        return $this->hasMany(AcademicSetupFaculty::class);
    }

    /**
     * Get the subject-faculty assignments across all year levels.
     */
    public function subjectFacultyAssignments(): HasMany
    {
        return $this->hasMany(SubjectFacultyAssignment::class);
    }

    /**
     * Get the generated schedules.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * Get the buildings selected for this setup.
     */
    public function buildings(): BelongsToMany
    {
        return $this->belongsToMany(Building::class, 'academic_setup_building')
            ->withTimestamps();
    }

    /**
     * Get the specific rooms selected for this setup.
     * If empty, all rooms from selected buildings are available.
     */
    public function selectedRooms(): BelongsToMany
    {
        return $this->belongsToMany(Room::class, 'academic_setup_room')
            ->withTimestamps();
    }

    /**
     * Get all available rooms for this setup.
     * Returns selected rooms if specified, otherwise all rooms from selected buildings.
     */
    public function getAvailableRoomsAttribute()
    {
        // If specific rooms are selected, use those
        if ($this->selectedRooms()->exists()) {
            return $this->selectedRooms()->with('building')->get();
        }

        // Otherwise, get all rooms from selected buildings
        $buildingIds = $this->buildings()->pluck('buildings.id');
        if ($buildingIds->isNotEmpty()) {
            return Room::whereIn('building_id', $buildingIds)
                ->where('is_active', true)
                ->with('building')
                ->get();
        }

        // Fallback: return all active rooms (legacy behavior)
        return Room::where('is_active', true)->get();
    }

    /**
     * Get the display name for this setup.
     */
    public function getDisplayNameAttribute(): string
    {
        $configuredYears = $this->yearLevels()->configured()->pluck('year_level')->toArray();
        $yearsText = empty($configuredYears) ? 'No years configured' : implode(', ', $configuredYears);
        
        // Use multiple courses if available, otherwise fall back to single course
        $courseCodes = $this->course_codes ?: ($this->course?->code ?? 'N/A');
        return "{$courseCodes} {$this->semester} Sem ({$this->academic_year}) - {$yearsText}";
    }

    /**
     * Get the configured year levels as a comma-separated string.
     */
    public function getConfiguredYearsAttribute(): string
    {
        return $this->yearLevels()
            ->configured()
            ->pluck('year_level')
            ->implode(', ');
    }

    /**
     * Get the next year level that needs to be configured.
     */
    public function getNextYearToConfigureAttribute(): ?AcademicSetupYearLevel
    {
        return $this->yearLevels()->unconfigured()->first();
    }

    /**
     * Get the progress percentage.
     */
    public function getProgressPercentageAttribute(): int
    {
        $total = $this->yearLevels()->count();
        if ($total === 0) return 0;
        
        $configured = $this->yearLevels()->configured()->count();
        return (int) round(($configured / $total) * 100);
    }

    /**
     * Check if setup is complete (all year levels configured).
     */
    public function isComplete(): bool
    {
        $total = $this->yearLevels()->count();
        if ($total === 0) return false;
        
        $configured = $this->yearLevels()->configured()->count();
        return $configured === $total && in_array($this->status, ['completed', 'active']);
    }

    /**
     * Check if setup is ready for schedule generation.
     */
    public function isReadyForScheduling(): bool
    {
        // At least one year level must be configured
        return $this->yearLevels()->configured()->exists() 
            && in_array($this->status, ['configuring', 'active', 'completed']);
    }

    /**
     * Initialize year levels for this setup based on course duration.
     */
    public function initializeYearLevels(?int $yearCount = null): void
    {
        $years = $yearCount ?? $this->course->years ?? 4;
        $yearLevelNames = ['1st', '2nd', '3rd', '4th', '5th'];

        for ($i = 0; $i < min($years, 5); $i++) {
            $this->yearLevels()->firstOrCreate([
                'year_level' => $yearLevelNames[$i],
            ], [
                'section_count' => 1,
                'expected_students' => 40,
                'is_configured' => false,
            ]);
        }
    }

    /**
     * Scope for active setups.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for setups ready for scheduling.
     */
    public function scopeReadyForScheduling($query)
    {
        return $query->whereIn('status', ['configuring', 'active', 'completed'])
            ->whereHas('yearLevels', function ($q) {
                $q->where('is_configured', true);
            });
    }

    /**
     * Scope for completed setups.
     */
    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['completed', 'active']);
    }
}
