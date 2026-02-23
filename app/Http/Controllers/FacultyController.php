<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\ScheduleEntry;
use App\Models\TimeSlot;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FacultyController extends Controller
{
    /**
     * Display the faculty schedule page.
     */
    public function schedule(Request $request): Response
    {
        $user = Auth::user();

        // Find all schedules where this faculty has assignments
        $schedules = Schedule::whereHas('entries', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(['academicSetup.department']) // Load context
            ->orderByRaw("CASE WHEN status = 'published' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc')
            ->get();

        // Determine which schedule to show
        $selectedScheduleId = $request->input('schedule_id');
        $selectedSchedule = null;

        if ($selectedScheduleId) {
            $selectedSchedule = $schedules->firstWhere('id', $selectedScheduleId);
        } else {
            $selectedSchedule = $schedules->first();
        }

        // If a schedule is selected, load its details filtered for this faculty
        $entries = [];
        if ($selectedSchedule) {
            // Load necessary relationships for display
            $entries = ScheduleEntry::where('schedule_id', $selectedSchedule->id)
                ->where('user_id', $user->id)
                ->with([
                    'academicSetupSubject.subject',
                    'academicSetupSubject.yearLevel',
                    'academicSetupSubject.courses', // Load merged courses
                    'academicSetupSubject.course.department', // Keep single course context as fallback
                    'room',
                    'timeSlot'
                ])
                ->get();
        }

        // Get all time slots for the grid rows
        $timeSlots = TimeSlot::where('is_active', true)
            ->orderBy('start_time')
            ->get();

        // Get pending requests for visualization
        $pendingRequests = \App\Models\ScheduleChangeRequest::where('user_id', Auth::id())
            ->where('status', 'pending')
            ->with([
                'scheduleEntry.academicSetupSubject.subject',
                'scheduleEntry.academicSetupSubject.yearLevel',
                'scheduleEntry.academicSetupSubject.courses' // Determine course context
            ])
            ->get();

        // Get request history (approved/rejected/cancelled)
        $requestHistory = \App\Models\ScheduleChangeRequest::where('user_id', Auth::id())
            ->whereIn('status', ['approved', 'rejected', 'cancelled'])
            ->with(['scheduleEntry.academicSetupSubject.subject', 'targetRoom', 'targetTimeSlot'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        $rooms = Room::orderBy('name')->get();

        return Inertia::render('faculty/schedule', [
            'schedules' => $schedules->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'status' => $s->status,
                    'department' => $s->academicSetup?->department?->name,
                    'academic_year' => $s->academicSetup?->academic_year,
                    'semester' => $s->academicSetup?->semester,
                    'created_at' => $s->created_at,
                ];
            }),
            'selectedSchedule' => $selectedSchedule,
            'entries' => $entries,
            'timeSlots' => $timeSlots,
            'rooms' => $rooms,
            'pendingRequests' => $pendingRequests,
            'requestHistory' => $requestHistory,
        ]);
    }

    /**
     * Display the faculty teaching load page.
     */
    public function teachingLoad(Request $request): Response
    {
        $user = Auth::user();

        // Find all schedules where this faculty has assignments
        $schedules = Schedule::whereHas('entries', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(['academicSetup.department', 'academicSetup.course'])
            ->orderByRaw("CASE WHEN status = 'published' THEN 1 ELSE 2 END")
            ->orderBy('created_at', 'desc')
            ->get();

        // Determine which schedule to show
        $selectedScheduleId = $request->input('schedule_id');
        $selectedSchedule = null;

        if ($selectedScheduleId) {
            $selectedSchedule = $schedules->firstWhere('id', $selectedScheduleId);
        } else {
            $selectedSchedule = $schedules->first();
        }

        // Get time slots
        $timeSlots = TimeSlot::where('is_active', true)
            ->orderBy('start_time')
            ->get();

        // Build teaching load data for the selected schedule
        $entries = [];
        $totalUnits = 0;

        if ($selectedSchedule) {
            $scheduleEntries = ScheduleEntry::where('schedule_id', $selectedSchedule->id)
                ->where('user_id', $user->id)
                ->with([
                    'academicSetupSubject.subject',
                    'academicSetupSubject.yearLevel',
                    'academicSetupSubject.courses',
                    'room',
                    'timeSlot'
                ])
                ->orderBy('day')
                ->get();

            // Format time for display
            $formatTime = function ($timeString) {
                if (!$timeString) return '';
                try {
                    // Try parsing with seconds first, then without
                    $time = \Carbon\Carbon::parse($timeString);
                    return $time->format('g:i A');
                } catch (\Exception $e) {
                    return $timeString; // Return original if parsing fails
                }
            };

            foreach ($scheduleEntries as $entry) {
                $setupSubject = $entry->academicSetupSubject;
                $subject = $setupSubject?->subject;
                $timeSlot = $entry->timeSlot;

                // Calculate display time
                $startTime = $entry->custom_start_time ?? $timeSlot?->start_time;
                $endTime = $entry->custom_end_time ?? $timeSlot?->end_time;
                $displayTime = $formatTime($startTime) . ' - ' . $formatTime($endTime);

                // Get parallel display code
                $parallelCode = $setupSubject?->parallel_display_code;

                $entries[] = [
                    'id' => $entry->id,
                    'subject_code' => $subject?->code ?? 'N/A',
                    'display_code' => $setupSubject?->display_code,
                    'parallel_display_code' => $parallelCode,
                    'block_number' => $setupSubject?->block_number ?? 1,
                    'subject_name' => $subject?->name ?? 'Unknown Subject',
                    'units' => $subject?->units ?? 0,
                    'room' => $entry->room?->name ?? 'TBA',
                    'time' => $timeSlot?->name ?? 'N/A',
                    'display_time' => $displayTime,
                    'custom_start_time' => $entry->custom_start_time,
                    'custom_end_time' => $entry->custom_end_time,
                    'day' => $entry->day,
                    'day_group' => $timeSlot?->day_group ?? 'OTHER',
                    'is_lab' => $entry->is_lab_session,
                    'year_level' => $setupSubject?->yearLevel?->year_level ?? 'N/A',
                    'session_group_id' => $entry->session_group_id,
                    'time_slot_id' => $entry->time_slot_id,
                ];
            }

            // Calculate total units (divide by 2 for paired schedules)
            $totalUnitsRaw = $scheduleEntries->sum(fn($e) => $e->academicSetupSubject?->subject?->units ?? 0);
            $totalUnits = (int) round($totalUnitsRaw / 2);
        }

        return Inertia::render('faculty/teaching-load', [
            'schedules' => $schedules->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'status' => $s->status,
                    'department' => $s->academicSetup?->department?->name,
                    'academic_year' => $s->academicSetup?->academic_year,
                    'semester' => $s->academicSetup?->semester,
                    'curriculum_name' => $s->academicSetup?->curriculum_name,
                    'created_at' => $s->created_at,
                ];
            }),
            'selectedSchedule' => $selectedSchedule ? [
                'id' => $selectedSchedule->id,
                'name' => $selectedSchedule->name,
                'status' => $selectedSchedule->status,
                'department' => $selectedSchedule->academicSetup?->department?->name,
                'academic_year' => $selectedSchedule->academicSetup?->academic_year,
                'semester' => $selectedSchedule->academicSetup?->semester,
                'curriculum_name' => $selectedSchedule->academicSetup?->curriculum_name,
            ] : null,
            'entries' => $entries,
            'totalUnits' => $totalUnits,
            'timeSlots' => $timeSlots,
        ]);
    }
}
