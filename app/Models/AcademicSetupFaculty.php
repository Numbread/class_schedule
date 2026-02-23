<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicSetupFaculty extends Model
{
    use HasFactory;

    protected $table = 'academic_setup_faculty';

    protected $fillable = [
        'academic_setup_id',
        'user_id',
        'max_units',
        'preferred_day_off',
        'preferred_time_period',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'max_units' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the academic setup.
     */
    public function academicSetup(): BelongsTo
    {
        return $this->belongsTo(AcademicSetup::class);
    }

    /**
     * Get the faculty user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get subject assignments for this faculty.
     */
    public function subjectAssignments(): HasMany
    {
        return $this->hasMany(SubjectFacultyAssignment::class, 'user_id', 'user_id')
            ->where('academic_setup_id', $this->academic_setup_id);
    }

    /**
     * Scope to get active faculty.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get day name from string value.
     */
    public function getPreferredDayOffNameAttribute(): ?string
    {
        if (!$this->preferred_day_off) {
            return null;
        }

        // Convert 'monday' to 'Monday', etc.
        return ucfirst($this->preferred_day_off);
    }
}

