<?php

namespace App\Http\Controllers;

use App\Models\ScheduleChangeRequest;
use App\Models\ScheduleEntry;
use App\Models\TimeSlot;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

use App\Services\Scheduling\ConflictAnalysisService;

class ScheduleChangeRequestController extends Controller
{
    public function __construct(
        protected ConflictAnalysisService $conflictService
    ) {}

    /**
     * Store a new change request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'schedule_entry_id' => 'required|exists:schedule_entries,id',
            'target_time_slot_id' => 'required|exists:time_slots,id',
            'target_room_id' => 'required|exists:rooms,id',
            'target_day' => 'required|string',
            'reason' => 'nullable|string',
        ]);

        $entry = ScheduleEntry::findOrFail($validated['schedule_entry_id']);

        // Verify ownership
        if ($entry->user_id !== Auth::id()) {
            abort(403, 'Unauthorized');
        }

        // Perform Conflict Check (Server-side enforcement)
        // Perform Conflict Check (Server-side enforcement)
        $conflicts = $this->conflictService->analyzeConflicts(
            $entry->schedule_id,
            $validated['target_day'],
            $validated['target_time_slot_id'],
            $validated['target_room_id'],
            $entry->id, // exclude current entry (though it's a move, so checking target)
            $entry->user_id,
            $entry->academic_setup_subject_id
        );

        if (!empty($conflicts)) {
            // Return with errors instead of throwing Exception to ensure redirect response
            return redirect()->back()->withErrors([
                'conflict' => 'The requested slot has conflicts: ' . implode(', ', $conflicts)
            ]);
        }

        ScheduleChangeRequest::create([
            'schedule_entry_id' => $validated['schedule_entry_id'],
            'user_id' => Auth::id(),
            'target_time_slot_id' => $validated['target_time_slot_id'],
            'target_room_id' => $validated['target_room_id'],
            'target_day' => $validated['target_day'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Change request submitted successfully.');
    }

    /**
     * Check for conflicts for a potential move.
     */
    public function check(Request $request)
    {
        $request->validate([
            'schedule_entry_id' => 'required|exists:schedule_entries,id',
            'target_time_slot_id' => 'required|exists:time_slots,id',
            'target_room_id' => 'required|exists:rooms,id',
            'target_day' => 'required|string',
        ]);

        $entry = ScheduleEntry::findOrFail($request->schedule_entry_id);

        $conflicts = $this->conflictService->analyzeConflicts(
            $entry->schedule_id,
            $request->target_day,
            $request->target_time_slot_id,
            $request->target_room_id,
            $entry->id,
            $entry->user_id,
            $entry->academic_setup_subject_id
        );

        return redirect()->back()->with('conflict_check', [
            'has_conflict' => !empty($conflicts),
            'conflicts' => $conflicts
        ]);
    }


    /**
     * Cancel a pending request.
     */
    public function cancel(Request $request, $id)
    {
        $changeRequest = ScheduleChangeRequest::where('id', $id)
            ->where('user_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        $changeRequest->delete(); // Or set status to 'cancelled' if we want history. Deleting is cleaner for now.

        return redirect()->back()->with('success', 'Request simplified.');
    }

    /**
     * Display a listing of the resource (For Schedulers/Admins).
     */
    public function index()
    {
        $relationships = [
            'user', // Requester
            'scheduleEntry.academicSetupSubject.subject',
            'scheduleEntry.academicSetupSubject.yearLevel',
            'scheduleEntry.academicSetupSubject.courses',
            'scheduleEntry.room', // Original Room
            'scheduleEntry.timeSlot', // Original Time
            'targetRoom',
            'targetTimeSlot'
        ];

        $requests = ScheduleChangeRequest::with($relationships)
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();

        $history = ScheduleChangeRequest::with($relationships)
            ->whereIn('status', ['approved', 'rejected'])
            ->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('scheduler/requests/index', [
            'requests' => $requests,
            'history' => $history
        ]);
    }

    /**
     * Approve a request.
     */
    public function approve(Request $request, $id)
    {
        $changeRequest = ScheduleChangeRequest::findOrFail($id);

        if ($changeRequest->status !== 'pending') {
            return redirect()->back()->withErrors(['error' => 'Request is already processed.']);
        }

        // Final Conflict Check
        $conflicts = $this->conflictService->analyzeConflicts(
            $changeRequest->scheduleEntry->schedule_id,
            $changeRequest->target_day,
            $changeRequest->target_time_slot_id,
            $changeRequest->target_room_id,
            $changeRequest->schedule_entry_id,
            $changeRequest->scheduleEntry->user_id, // Faculty
            $changeRequest->scheduleEntry->academicSetupSubject->id // Subject (for student check)
        );

        if (!empty($conflicts)) {
            return redirect()->back()->withErrors([
                'conflict' => 'Cannot approve: ' . implode(', ', $conflicts)
            ]);
        }

        DB::transaction(function () use ($changeRequest) {
            $entry = $changeRequest->scheduleEntry;
            $targetTimeSlot = TimeSlot::find($changeRequest->target_time_slot_id);

            // Determine day groups
            $originalDayGroup = $this->getDayGroup($entry->day);
            $targetDayGroup = $this->getDayGroup($changeRequest->target_day);

            // Get the paired day for MW/TTH
            $pairedDay = $this->getPairedDay($changeRequest->target_day);

            // Check if we're changing day groups (e.g., FRI -> TTH or TTH -> FRI)
            $changingDayGroups = $originalDayGroup !== $targetDayGroup;

            if ($changingDayGroups) {
                // Moving FROM Friday/Saturday/Sunday TO MW/TTH: Need to create a paired entry
                if (in_array($originalDayGroup, ['FRI', 'SAT', 'SUN']) && in_array($targetDayGroup, ['MW', 'TTH'])) {
                    // Calculate new duration (half of original since meeting twice)
                    $originalDurationMinutes = $this->calculateDurationMinutes($entry);
                    $newDurationMinutes = (int) ($originalDurationMinutes / 2);

                    // Calculate new end time based on target time slot start
                    $newStartTime = $targetTimeSlot->start_time;
                    $newEndTime = $this->addMinutesToTime($newStartTime, $newDurationMinutes);

                    // Update the original entry
                    $entry->day = $changeRequest->target_day;
                    $entry->time_slot_id = $changeRequest->target_time_slot_id;
                    $entry->room_id = $changeRequest->target_room_id;
                    $entry->custom_start_time = $newStartTime;
                    $entry->custom_end_time = $newEndTime;
                    $entry->save();

                    // Create the paired entry (e.g., Thursday if moving to Tuesday)
                    if ($pairedDay) {
                        ScheduleEntry::create([
                            'schedule_id' => $entry->schedule_id,
                            'academic_setup_subject_id' => $entry->academic_setup_subject_id,
                            'room_id' => $changeRequest->target_room_id,
                            'time_slot_id' => $changeRequest->target_time_slot_id,
                            'user_id' => $entry->user_id,
                            'day' => $pairedDay,
                            'is_lab_session' => $entry->is_lab_session,
                            'custom_start_time' => $newStartTime,
                            'custom_end_time' => $newEndTime,
                            'session_group_id' => $entry->session_group_id,
                            'slots_span' => $entry->slots_span,
                        ]);
                    }
                }
                // Moving FROM MW/TTH TO Friday/Saturday/Sunday: Need to remove paired entry and double duration
                elseif (in_array($originalDayGroup, ['MW', 'TTH']) && in_array($targetDayGroup, ['FRI', 'SAT', 'SUN'])) {
                    // Find and delete the paired entry (the other day in MW or TTH)
                    $originalPairedDay = $this->getPairedDay($entry->day);
                    if ($originalPairedDay) {
                        ScheduleEntry::where('schedule_id', $entry->schedule_id)
                            ->where('academic_setup_subject_id', $entry->academic_setup_subject_id)
                            ->where('time_slot_id', $entry->time_slot_id)
                            ->where('day', $originalPairedDay)
                            ->where('is_lab_session', $entry->is_lab_session)
                            ->delete();
                    }

                    // Calculate new duration (double since only meeting once)
                    $originalDurationMinutes = $this->calculateDurationMinutes($entry);
                    $newDurationMinutes = $originalDurationMinutes * 2;

                    // Calculate new end time
                    $newStartTime = $targetTimeSlot->start_time;
                    $newEndTime = $this->addMinutesToTime($newStartTime, $newDurationMinutes);

                    // Update the entry
                    $entry->day = $changeRequest->target_day;
                    $entry->time_slot_id = $changeRequest->target_time_slot_id;
                    $entry->room_id = $changeRequest->target_room_id;
                    $entry->custom_start_time = $newStartTime;
                    $entry->custom_end_time = $newEndTime;
                    $entry->save();
                }
            } else {
                // Same day group - update the entry AND its pair if it exists

                // Find the pair (before modifying entry)
                $originalPairedDay = $this->getPairedDay($entry->day);
                $pair = null;

                if ($originalPairedDay) {
                    $pair = ScheduleEntry::where('schedule_id', $entry->schedule_id)
                        ->where('academic_setup_subject_id', $entry->academic_setup_subject_id)
                        ->where('time_slot_id', $entry->time_slot_id)
                        ->where('day', $originalPairedDay)
                        ->where('is_lab_session', $entry->is_lab_session)
                        ->first();
                }

                // Update the main entry
                $entry->day = $changeRequest->target_day;
                $entry->time_slot_id = $changeRequest->target_time_slot_id;
                $entry->room_id = $changeRequest->target_room_id;

                if ($targetTimeSlot) {
                    $entry->custom_start_time = $targetTimeSlot->start_time;
                    $entry->custom_end_time = $targetTimeSlot->end_time;
                }

                $entry->save();

                // Update the pair if found
                if ($pair) {
                    $pair->day = $this->getPairedDay($changeRequest->target_day);
                    $pair->time_slot_id = $changeRequest->target_time_slot_id;
                    $pair->room_id = $changeRequest->target_room_id;

                    if ($targetTimeSlot) {
                        $pair->custom_start_time = $targetTimeSlot->start_time;
                        $pair->custom_end_time = $targetTimeSlot->end_time;
                    }

                    $pair->save();
                }
            }

            // Update Request Status
            $changeRequest->update([
                'status' => 'approved',
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Request approved and schedule updated.');
    }

    /**
     * Get the day group for a given day.
     */
    private function getDayGroup(string $day): string
    {
        $dayLower = strtolower($day);
        if (in_array($dayLower, ['monday', 'wednesday'])) return 'MW';
        if (in_array($dayLower, ['tuesday', 'thursday'])) return 'TTH';
        if ($dayLower === 'friday') return 'FRI';
        if ($dayLower === 'saturday') return 'SAT';
        return 'SUN';
    }

    /**
     * Get the paired day for MW/TTH schedules.
     */
    private function getPairedDay(string $day): ?string
    {
        $dayLower = strtolower($day);
        return match ($dayLower) {
            'monday' => 'wednesday',
            'wednesday' => 'monday',
            'tuesday' => 'thursday',
            'thursday' => 'tuesday',
            default => null,
        };
    }

    /**
     * Calculate duration in minutes from an entry.
     */
    private function calculateDurationMinutes(ScheduleEntry $entry): int
    {
        if ($entry->custom_start_time && $entry->custom_end_time) {
            $start = $this->getTimestamp($entry->custom_start_time);
            $end = $this->getTimestamp($entry->custom_end_time);
        } elseif ($entry->timeSlot) {
            $start = $this->getTimestamp($entry->timeSlot->start_time);
            $end = $this->getTimestamp($entry->timeSlot->end_time);
        } else {
            return 60; // Default 1 hour
        }

        return (int) (($end - $start) / 60);
    }

    /**
     * Helper to get timestamp from string or DateTime.
     */
    private function getTimestamp($time): int
    {
        if ($time instanceof \DateTimeInterface) {
            return $time->getTimestamp();
        }
        return strtotime($time);
    }

    /**
     * Add minutes to a time string or object.
     */
    private function addMinutesToTime($time, int $minutes): string
    {
        $timestamp = $this->getTimestamp($time);
        $newTimestamp = $timestamp + ($minutes * 60);
        return date('H:i:s', $newTimestamp);
    }

    /**
     * Reject a request.
     */
    public function reject(Request $request, $id)
    {
        $changeRequest = ScheduleChangeRequest::findOrFail($id);

        $changeRequest->update([
            'status' => 'rejected',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
            'admin_notes' => $request->input('reason', null),
        ]);

        return redirect()->back()->with('success', 'Request rejected.');
    }

    // Private detection method removed in favor of ConflictAnalysisService
}
