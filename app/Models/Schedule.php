<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_setup_id',
        'name',
        'status',
        'fitness_score',
        'generation',
        'metadata',
        'created_by',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'fitness_score' => 'integer',
            'generation' => 'integer',
            'metadata' => 'array',
            'published_at' => 'datetime',
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
     * Get the creator.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the schedule entries.
     */
    public function entries(): HasMany
    {
        return $this->hasMany(ScheduleEntry::class);
    }

    /**
     * Scope for published schedules.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope for draft schedules.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Publish the schedule.
     */
    public function publish(): void
    {
        $this->update([
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}

