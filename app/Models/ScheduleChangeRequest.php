<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_entry_id',
        'user_id',
        'target_time_slot_id',
        'target_room_id',
        'target_day',
        'status',
        'reason',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function scheduleEntry(): BelongsTo
    {
        return $this->belongsTo(ScheduleEntry::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function targetTimeSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class, 'target_time_slot_id');
    }

    public function targetRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'target_room_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
