<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'building_id',
        'floor',
        'room_type',
        'capacity',
        'priority',
        'equipment',
        'class_settings',
        'is_available',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'priority' => 'integer',
            'equipment' => 'array',
            'class_settings' => 'array',
            'is_available' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the schedules for the room.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(RoomSchedule::class);
    }

    /**
     * Get the building this room belongs to.
     */
    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class, 'building_id');
    }

    /**
     * Get the academic setups that use this room.
     */
    public function academicSetups(): BelongsToMany
    {
        return $this->belongsToMany(AcademicSetup::class, 'academic_setup_room')
            ->withTimestamps();
    }

    /**
     * Get full room name with building.
     */
    public function getFullNameAttribute(): string
    {
        if ($this->building) {
            return $this->name . ' (' . $this->building->code . ')';
        }
        return $this->name;
    }

    /**
     * Scope to get active rooms only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get available rooms only.
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)->where('is_active', true);
    }

    /**
     * Scope to filter by room type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('room_type', $type);
    }

    /**
     * Scope to filter by minimum capacity.
     */
    public function scopeWithMinCapacity($query, int $capacity)
    {
        return $query->where('capacity', '>=', $capacity);
    }

    /**
     * Order by priority (higher priority first).
     */
    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }
}

