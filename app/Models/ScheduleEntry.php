<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'academic_setup_subject_id',
        'room_id',
        'time_slot_id',
        'user_id',
        'day',
        'is_lab_session',
        'custom_start_time',
        'custom_end_time',
        'session_group_id',
        'slots_span',
    ];

    protected function casts(): array
    {
        return [
            'is_lab_session' => 'boolean',
            'custom_start_time' => 'datetime:H:i',
            'custom_end_time' => 'datetime:H:i',
            'slots_span' => 'integer',
        ];
    }

    /**
     * Get the display time for this entry.
     * Returns custom time if set, otherwise the time slot's time.
     */
    public function getDisplayTimeAttribute(): string
    {
        if ($this->custom_start_time && $this->custom_end_time) {
            $start = $this->custom_start_time->format('g:i A');
            $end = $this->custom_end_time->format('g:i A');
            return "{$start} - {$end}";
        }

        return $this->timeSlot?->display_time ?? 'N/A';
    }

    /**
     * Get formatted custom start time.
     */
    public function getFormattedCustomStartTimeAttribute(): ?string
    {
        return $this->custom_start_time?->format('H:i');
    }

    /**
     * Get formatted custom end time.
     */
    public function getFormattedCustomEndTimeAttribute(): ?string
    {
        return $this->custom_end_time?->format('H:i');
    }

    /**
     * Get the schedule.
     */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    /**
     * Get the academic setup subject.
     */
    public function academicSetupSubject(): BelongsTo
    {
        return $this->belongsTo(AcademicSetupSubject::class, 'academic_setup_subject_id');
    }

    /**
     * Get the room.
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the time slot.
     */
    public function timeSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class);
    }

    /**
     * Get the faculty.
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get display info for the entry.
     */
    public function getDisplayInfoAttribute(): array
    {
        $setupSubject = $this->academicSetupSubject;
        $blockNumber = $setupSubject->block_number ?? 1;

        return [
            'subject_code' => $setupSubject->subject->code ?? 'N/A',
            'subject_name' => $setupSubject->subject->name ?? 'N/A',
            'display_code' => $setupSubject->display_code ?? ($setupSubject->subject->code ?? 'N/A'), // e.g., CSC401
            'block_number' => $blockNumber,
            'block_display' => "Block {$blockNumber}",
            'room_name' => $this->room->name ?? 'N/A',
            'time' => $this->display_time,
            'time_slot_time' => $this->timeSlot->display_time ?? 'N/A',
            'custom_start_time' => $this->formatted_custom_start_time,
            'custom_end_time' => $this->formatted_custom_end_time,
            'session_group_id' => $this->session_group_id,
            'day' => ucfirst($this->day),
            'faculty' => $this->faculty ? "{$this->faculty->fname} {$this->faculty->lname}" : 'TBA',
        ];
    }
}

