<?php

namespace App\Services\Scheduling;

use App\Models\ScheduleEntry;
use App\Models\AcademicSetupSubject;
use Illuminate\Support\Collection;

class ConflictAnalysisService
{
    /**
     * Analyze conflicts using DB queries (for single entry checks/checks against DB state).
     * Useful when moving a single entry and detecting collisions with existing DB records.
     */
    public function analyzeConflicts($scheduleId, $day, $timeSlotId, $roomId, $entryIdToExclude, $facultyId, $subjectId = null)
    {
        $conflicts = [];
        $day = strtolower($day);

        // 1. Check Room Conflict
        $roomOccupied = ScheduleEntry::where('schedule_id', $scheduleId)
            ->where('day', $day)
            ->where('time_slot_id', $timeSlotId)
            ->where('room_id', $roomId)
            ->when($entryIdToExclude, function ($q) use ($entryIdToExclude) {
                return $q->where('id', '!=', $entryIdToExclude);
            })
            ->with(['academicSetupSubject.subject', 'faculty'])
            ->first();

        if ($roomOccupied) {
            $subject = $roomOccupied->academicSetupSubject?->subject?->code ?? 'Unknown';
            $faculty = $roomOccupied->faculty ? ($roomOccupied->faculty->lname) : 'TBA';
            $conflicts[] = "Room is occupied by {$subject} ({$faculty})";
        }

        // 2. Check Faculty Conflict (Is faculty teaching elsewhere?)
        if ($facultyId) {
            $facultyBusy = ScheduleEntry::where('schedule_id', $scheduleId)
                ->where('day', $day)
                ->where('time_slot_id', $timeSlotId)
                ->where('user_id', $facultyId)
                ->when($entryIdToExclude, function ($q) use ($entryIdToExclude) {
                    return $q->where('id', '!=', $entryIdToExclude);
                })
                ->where('id', '!=', $entryIdToExclude) // Redundant but safe
                ->first();

            if ($facultyBusy) {
                $conflicts[] = "Faculty is already teaching {$facultyBusy->academicSetupSubject?->subject?->code} at this time";
            }
        }

        // 3. Check Section/Block Conflict
        if ($subjectId) {
            $subjectModel = AcademicSetupSubject::find($subjectId);
            if ($subjectModel) {
                $blockRef = $subjectModel->block_number;
                $yearRef = $subjectModel->year_level_id;

                $studentConflict = ScheduleEntry::where('schedule_id', $scheduleId)
                    ->where('day', $day)
                    ->where('time_slot_id', $timeSlotId)
                    ->whereHas('academicSetupSubject', function ($q) use ($blockRef, $yearRef) {
                        $q->where('block_number', $blockRef)
                            ->where('year_level_id', $yearRef);
                    })
                    ->when($entryIdToExclude, function ($q) use ($entryIdToExclude) {
                        return $q->where('id', '!=', $entryIdToExclude);
                    })
                    ->with('academicSetupSubject.subject')
                    ->first();

                if ($studentConflict) {
                    $conflicts[] = "Students (Block {$blockRef}) have {$studentConflict->academicSetupSubject?->subject?->code}";
                }
            }
        }

        return $conflicts;
    }

    /**
     * Analyze conflicts for a collection of entries (in-memory).
     * Returns an array of entry IDs that have conflicts, mapped to reasons.
     * Efficient for checking an entire schedule at once.
     * 
     * @param Collection $entries Must have relations loaded: 'academicSetupSubject.subject', 'faculty', 'timeSlot', 'room'
     * @return array [entryId => ['Room conflict...', 'Faculty conflict...']]
     */
    public function analyzeBroadConflicts(Collection $entries)
    {
        $conflicts = []; // entryId => []
        
        // Group by Day+TimeSlot
        $grouped = $entries->groupBy(function($entry) {
            return strtolower($entry->day) . '-' . $entry->time_slot_id;
        });

        foreach ($grouped as $key => $slotEntries) {
            // 1. Room Conflicts in this slot
            $byRoom = $slotEntries->groupBy('room_id');
            foreach ($byRoom as $roomId => $roomEntries) {
                if ($roomId && $roomEntries->count() > 1) {
                    foreach ($roomEntries as $entry) {
                        $others = $roomEntries->where('id', '!=', $entry->id);
                        if ($others->count() > 0) {
                             $reasons = $others->map(fn($o) => "Room shared with " . ($o->academicSetupSubject?->subject?->code ?? 'Unknown'))->values()->toArray();
                             $this->addConflicts($conflicts, $entry->id, $reasons);
                        }
                    }
                }
            }

            // 2. Faculty Conflicts in this slot
            $byFaculty = $slotEntries->whereNotNull('user_id')->groupBy('user_id');
            foreach ($byFaculty as $facultyId => $facultyEntries) {
                if ($facultyEntries->count() > 1) {
                    foreach ($facultyEntries as $entry) {
                        $others = $facultyEntries->where('id', '!=', $entry->id);
                         if ($others->count() > 0) {
                             $reasons = $others->map(fn($o) => "Faculty also teaching " . ($o->academicSetupSubject?->subject?->code ?? 'Unknown'))->values()->toArray();
                             $this->addConflicts($conflicts, $entry->id, $reasons);
                        }
                    }
                }
            }
            
            // 3. Student Block Conflicts in this slot
            $byBlock = $slotEntries->groupBy(function($entry) {
                $sub = $entry->academicSetupSubject;
                if (!$sub) return 'none';
                return $sub->year_level_id . '-' . $sub->block_number;
            });
            
            foreach ($byBlock as $blockKey => $blockEntries) {
                if ($blockKey === 'none') continue;
                if ($blockEntries->count() > 1) {
                     foreach ($blockEntries as $entry) {
                        $others = $blockEntries->where('id', '!=', $entry->id);
                         if ($others->count() > 0) {
                             $reasons = $others->map(fn($o) => "Block students also have " . ($o->academicSetupSubject?->subject?->code ?? 'Unknown'))->values()->toArray();
                             $this->addConflicts($conflicts, $entry->id, $reasons);
                        }
                    }
                }
            }
        }
        
        // 4. Individual Constraints (Capacity, Type)
        foreach ($entries as $entry) {
            $room = $entry->room;
            $subject = $entry->academicSetupSubject;
            
            if ($room && $subject) {
                // Check Capacity
                $expected = $subject->expected_students ?? 40;
                if ($room->capacity < $expected) {
                    $this->addConflicts($conflicts, $entry->id, ["Room capacity ({$room->capacity}) too small for {$expected} students"]);
                }

                // Check Room Type
                if ($entry->is_lab_session && $room->room_type === 'lecture') {
                    $this->addConflicts($conflicts, $entry->id, ["Lab subject assigned to Lecture room"]);
                }
            }
        }
        
        return $conflicts;
    }
    
    private function addConflicts(&$conflicts, $id, $reasons) {
        if (!isset($conflicts[$id])) $conflicts[$id] = [];
        $conflicts[$id] = array_unique(array_merge($conflicts[$id], $reasons));
    }
}
