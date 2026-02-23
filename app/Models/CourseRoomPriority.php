<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseRoomPriority extends Model
{
    use HasFactory;

    protected $table = 'course_room_priorities';

    protected $fillable = [
        'course_id',
        'room_id',
        'priority',
        'max_students',
        'room_type',
    ];

    protected function casts(): array
    {
        return [
            'priority' => 'integer',
            'max_students' => 'integer',
        ];
    }

    /**
     * Get the course.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the room.
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Check if this priority applies to a given class size.
     */
    public function appliesTo(int $studentCount): bool
    {
        if ($this->max_students === null) {
            return true;
        }
        return $studentCount <= $this->max_students;
    }

    /**
     * Get priority rooms for a course and class size.
     */
    public static function getPriorityRoomsForCourse(
        int $courseId, 
        int $studentCount, 
        ?string $roomType = null
    ): array {
        $query = static::where('course_id', $courseId)
            ->where(function ($q) use ($studentCount) {
                $q->whereNull('max_students')
                    ->orWhere('max_students', '>=', $studentCount);
            });

        if ($roomType) {
            $query->where(function ($q) use ($roomType) {
                $q->whereNull('room_type')
                    ->orWhere('room_type', $roomType);
            });
        }

        return $query->orderBy('priority', 'desc')
            ->pluck('room_id')
            ->toArray();
    }
}
