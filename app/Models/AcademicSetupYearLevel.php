<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicSetupYearLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_setup_id',
        'year_level',
        'section_count',
        'expected_students',
        'is_configured',
    ];

    protected function casts(): array
    {
        return [
            'section_count' => 'integer',
            'expected_students' => 'integer',
            'is_configured' => 'boolean',
        ];
    }

    /**
     * Get the academic setup this year level belongs to.
     */
    public function academicSetup(): BelongsTo
    {
        return $this->belongsTo(AcademicSetup::class);
    }

    /**
     * Get the subjects for this year level.
     */
    public function subjects(): HasMany
    {
        return $this->hasMany(AcademicSetupSubject::class, 'year_level_id');
    }

    /**
     * Get the year level display name.
     */
    public function getDisplayNameAttribute(): string
    {
        return match ($this->year_level) {
            '1st' => '1st Year',
            '2nd' => '2nd Year',
            '3rd' => '3rd Year',
            '4th' => '4th Year',
            '5th' => '5th Year',
            default => $this->year_level,
        };
    }

    /**
     * Scope for configured year levels.
     */
    public function scopeConfigured($query)
    {
        return $query->where('is_configured', true);
    }

    /**
     * Scope for unconfigured year levels.
     */
    public function scopeUnconfigured($query)
    {
        return $query->where('is_configured', false);
    }
}

