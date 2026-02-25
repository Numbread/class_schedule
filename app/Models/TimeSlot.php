<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'day_group',
        'priority',
        'duration_minutes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'priority' => 'integer',
            'duration_minutes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the display time for this time slot.
     */
    public function getDisplayTimeAttribute(): string
    {
        if ($this->start_time && $this->end_time) {
            $start = $this->start_time->format('g:i A');
            $end = $this->end_time->format('g:i A');
            return "{$start} - {$end}";
        }
        return 'N/A';
    }

    /**
     * Scope to get active time slots.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get time slots by day group.
     */
    public function scopeByDayGroup($query, string $dayGroup)
    {
        return $query->where('day_group', $dayGroup);
    }

    /**
     * Order by priority.
     */
    public function scopeOrderByPriority($query)
    {
        return $query->orderBy('priority');
    }

    /**
     * Get the days this slot applies to.
     */
    public function getDaysAttribute(): array
    {
        return match ($this->day_group) {
            'MW' => ['monday', 'wednesday'],
            'TTH' => ['tuesday', 'thursday'],
            'FRI' => ['friday'],
            'SAT' => ['saturday'],
            'SUN' => ['sunday'],
            default => [],
        };
    }
}

