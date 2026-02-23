<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomSchedule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'room_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_available',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_available' => 'boolean',
        ];
    }

    /**
     * Get the room that owns the schedule.
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Scope to get available schedules only.
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    /**
     * Get display name for the schedule.
     */
    public function getDisplayNameAttribute(): string
    {
        return ucfirst($this->day_of_week) . ' ' . $this->start_time . ' - ' . $this->end_time;
    }
}

