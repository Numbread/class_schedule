<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoomAssignmentRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'subject_category',
        'faculty_specialization',
        'allowed_room_ids',
        'priority_room_ids',
        'priority',
        'is_active',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'allowed_room_ids' => 'array',
            'priority_room_ids' => 'array',
            'priority' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get rooms allowed by this rule.
     */
    public function getAllowedRooms()
    {
        if (empty($this->allowed_room_ids)) {
            return collect();
        }
        return Room::whereIn('id', $this->allowed_room_ids)->get();
    }

    /**
     * Get priority rooms for this rule.
     */
    public function getPriorityRooms()
    {
        if (empty($this->priority_room_ids)) {
            return collect();
        }
        return Room::whereIn('id', $this->priority_room_ids)->get();
    }

    /**
     * Check if a room is allowed for a subject.
     */
    public function isRoomAllowed(Room $room): bool
    {
        if (empty($this->allowed_room_ids)) {
            return true; // No restriction
        }
        return in_array($room->id, $this->allowed_room_ids);
    }

    /**
     * Check if a faculty can teach this subject category.
     */
    public function canFacultyTeach(?User $faculty): bool
    {
        if (!$faculty || empty($this->faculty_specialization)) {
            return true; // No restriction
        }
        return $faculty->specialization === $this->faculty_specialization;
    }

    /**
     * Get a rule for a subject category.
     */
    public static function findForCategory(?string $category): ?self
    {
        if (!$category) {
            return null;
        }
        return static::where('subject_category', $category)
            ->where('is_active', true)
            ->orderBy('priority', 'desc')
            ->first();
    }

    /**
     * Scope for active rules.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
