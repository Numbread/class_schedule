<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateScheduleJob;
use App\Models\AcademicSetup;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\ScheduleEntry;
use App\Models\TimeSlot;
use App\Services\Export\ScheduleExcelExportService;
use App\Services\Scheduling\ConflictAnalysisService;
use App\Services\Scheduling\GeneticAlgorithmService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SchedulingController extends Controller
{
    /**
     * Display scheduling dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get academic setups ready for scheduling (at least one year level configured)
        $academicSetupsQuery = AcademicSetup::with(['department', 'course', 'courses', 'yearLevels'])
            ->readyForScheduling()
            ->orderBy('created_at', 'desc');

        if ($user && $user->isScheduler() && $user->department_id) {
            $academicSetupsQuery->where('department_id', $user->department_id);
        }

        $academicSetups = $academicSetupsQuery->get();

        // Get existing schedules
        $schedulesQuery = Schedule::with(['academicSetup.department', 'academicSetup.course', 'academicSetup.courses', 'creator'])
            ->withCount('entries')
            ->orderBy('created_at', 'desc');

        if ($user && $user->isScheduler() && $user->department_id) {
            $schedulesQuery->whereHas('academicSetup', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        }

        $schedules = $schedulesQuery->paginate(10)->withQueryString();

        // Get rooms for display
        $rooms = Room::where('is_active', true)
            ->orderBy('priority')
            ->get();

        // Get time slots
        $timeSlots = TimeSlot::active()
            ->orderByPriority()
            ->get();

        return Inertia::render('scheduling/index', [
            'academicSetups' => $academicSetups,
            'schedules' => $schedules,
            'rooms' => $rooms,
            'timeSlots' => $timeSlots,
        ]);
    }

    /**
     * Start schedule generation (returns job key for progress tracking).
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'academic_setup_id' => ['required', 'exists:academic_setups,id'],
            'population_size' => ['nullable', 'integer', 'min:10', 'max:200'],
            'max_generations' => ['nullable', 'integer', 'min:10', 'max:500'],
            'mutation_rate' => ['nullable', 'numeric', 'min:0.01', 'max:0.5'],
            'included_days' => ['nullable', 'array'],
            'included_days.*' => ['string', 'in:MW,TTH,FRI,SAT,SUN'],
            'target_fitness_min' => ['nullable', 'integer'],
            'target_fitness_max' => ['nullable', 'integer'],
        ]);

        // Additional validation: max must be >= min if both are provided
        if (isset($validated['target_fitness_min']) && isset($validated['target_fitness_max'])) {
            if ($validated['target_fitness_max'] < $validated['target_fitness_min']) {
                return response()->json(['error' => 'Maximum fitness score must be greater than or equal to minimum fitness score.'], 422);
            }
        }

        $academicSetup = AcademicSetup::findOrFail($validated['academic_setup_id']);

        // Check if setup is ready for scheduling
        if (!$academicSetup->isReadyForScheduling()) {
            return response()->json(['error' => 'Academic setup is not ready for scheduling. At least one year level must be configured.'], 422);
        }

        // Check if there are subjects and rooms
        if ($academicSetup->subjects()->count() === 0) {
            return response()->json(['error' => 'No subjects in the academic setup.'], 422);
        }

        $roomCount = Room::where('is_active', true)->where('is_available', true)->count();
        if ($roomCount === 0) {
            return response()->json(['error' => 'No available rooms for scheduling.'], 422);
        }

        // Check if at least one day is selected
        $includedDays = $validated['included_days'] ?? ['MW', 'TTH', 'FRI'];
        if (empty($includedDays)) {
            return response()->json(['error' => 'Please select at least one day group.'], 422);
        }

        // Generate unique job key
        $jobKey = 'schedule_generation_' . Str::uuid();

        // Initialize progress in cache
        Cache::put($jobKey, [
            'progress' => 0,
            'message' => 'Queued for processing...',
            'status' => 'pending',
            'schedule_id' => null,
            'updated_at' => now()->toISOString(),
        ], 600);

        // Check if we should use async (queue worker running) or sync mode
        $useAsync = config('queue.default') !== 'sync';

        if ($useAsync) {
            // Dispatch the job to queue
            GenerateScheduleJob::dispatch(
                $academicSetup->id,
                [
                    'population_size' => $validated['population_size'] ?? 50,
                    'max_generations' => $validated['max_generations'] ?? 100,
                    'mutation_rate' => $validated['mutation_rate'] ?? 0.1,
                    'included_days' => $includedDays,
                    'target_fitness_min' => $validated['target_fitness_min'] ?? null,
                    'target_fitness_max' => $validated['target_fitness_max'] ?? null,
                ],
                Auth::id(),
                $jobKey
            );
        } else {
            // Run synchronously for development without queue worker
            GenerateScheduleJob::dispatchSync(
                $academicSetup->id,
                [
                    'population_size' => $validated['population_size'] ?? 50,
                    'max_generations' => $validated['max_generations'] ?? 100,
                    'mutation_rate' => $validated['mutation_rate'] ?? 0.1,
                    'included_days' => $includedDays,
                    'target_fitness_min' => $validated['target_fitness_min'] ?? null,
                    'target_fitness_max' => $validated['target_fitness_max'] ?? null,
                ],
                Auth::id(),
                $jobKey
            );
        }

        return response()->json(['job_key' => $jobKey]);
    }

    /**
     * Check schedule generation progress.
     */
    public function progress(Request $request)
    {
        $jobKey = $request->input('job_key');

        if (!$jobKey) {
            return response()->json(['error' => 'Job key is required.'], 422);
        }

        $progress = Cache::get($jobKey);

        if (!$progress) {
            return response()->json([
                'progress' => 0,
                'message' => 'Job not found or expired.',
                'status' => 'not_found',
            ]);
        }

        return response()->json($progress);
    }

    /**
     * Generate schedule synchronously (fallback for sync queue driver).
     */
    public function generateSync(Request $request)
    {
        $validated = $request->validate([
            'academic_setup_id' => ['required', 'exists:academic_setups,id'],
            'population_size' => ['nullable', 'integer', 'min:10', 'max:200'],
            'max_generations' => ['nullable', 'integer', 'min:10', 'max:500'],
            'mutation_rate' => ['nullable', 'numeric', 'min:0.01', 'max:0.5'],
            'included_days' => ['nullable', 'array'],
            'included_days.*' => ['string', 'in:MW,TTH,FRI,SAT,SUN'],
        ]);

        $academicSetup = AcademicSetup::with([
            'subjects.subject',
            'faculty.user',
            'subjectFacultyAssignments',
        ])->findOrFail($validated['academic_setup_id']);

        // Check if setup is complete
        if (!$academicSetup->isComplete() && $academicSetup->status !== 'active') {
            return redirect()->back()->with('error', 'Academic setup is not complete.');
        }

        // Check if there are subjects and rooms
        if ($academicSetup->subjects->isEmpty()) {
            return redirect()->back()->with('error', 'No subjects in the academic setup.');
        }

        $roomCount = Room::where('is_active', true)->where('is_available', true)->count();
        if ($roomCount === 0) {
            return redirect()->back()->with('error', 'No available rooms for scheduling.');
        }

        // Check if at least one day is selected
        $includedDays = $validated['included_days'] ?? ['MW', 'TTH', 'FRI'];
        if (empty($includedDays)) {
            return redirect()->back()->with('error', 'Please select at least one day group.');
        }

        // Create GA service and set parameters
        $gaService = new GeneticAlgorithmService();
        $gaService->setIncludedDays($includedDays);

        if (isset($validated['population_size'])) {
            $gaService->setParameters(['population_size' => $validated['population_size']]);
        }
        if (isset($validated['max_generations'])) {
            $gaService->setParameters(['max_generations' => $validated['max_generations']]);
        }
        if (isset($validated['mutation_rate'])) {
            $gaService->setParameters(['mutation_rate' => $validated['mutation_rate']]);
        }
        if (isset($validated['target_fitness_min']) || isset($validated['target_fitness_max'])) {
            $gaService->setParameters([
                'target_fitness_min' => $validated['target_fitness_min'] ?? null,
                'target_fitness_max' => $validated['target_fitness_max'] ?? null,
            ]);
        }

        // Generate schedule
        $schedule = $gaService->generate($academicSetup, Auth::id());

        return redirect()->route('scheduling.show', $schedule)
            ->with('success', "Schedule generated! Fitness score: {$schedule->fitness_score}");
    }

    /**
     * Display a specific schedule.
     */
    public function show(Schedule $schedule, ConflictAnalysisService $conflictService): Response
    {
        $schedule->load([
            'academicSetup.course',
            'academicSetup.courses',
            'academicSetup.department',
            'entries.room',
            'entries.timeSlot',
            'entries.academicSetupSubject.subject',
            'entries.academicSetupSubject.yearLevel', // Needed for display_code accessor
            'entries.faculty',
            'creator',
        ]);

        // Analyze conflicts
        $conflicts = $conflictService->analyzeBroadConflicts($schedule->entries);

        // Attach conflict detection info to each entry
        foreach ($schedule->entries as $entry) {
            if (isset($conflicts[$entry->id])) {
                $entry->setAttribute('has_conflict', true);
                $entry->setAttribute('conflict_reason', implode('; ', $conflicts[$entry->id]));
            } else {
                $entry->setAttribute('has_conflict', false);
            }
        }

        // Organize entries by day for display
        $entriesByDay = $schedule->entries
            ->groupBy('day')
            ->map(function ($entries) {
                return $entries->groupBy('time_slot_id');
            });

        // Get rooms for column headers
        $rooms = Room::where('is_active', true)
            ->orderBy('priority')
            ->get();

        // Get time slots for row headers
        $timeSlots = TimeSlot::active()
            ->orderByPriority()
            ->get();

        return Inertia::render('scheduling/show', [
            'schedule' => $schedule,
            'entriesByDay' => $entriesByDay,
            'rooms' => $rooms,
            'timeSlots' => $timeSlots,
        ]);
    }

    /**
     * Update faculty assignments in an existing schedule.
     * This refreshes faculty from current subject-faculty assignments without regenerating the schedule.
     * Also detects if faculty members were removed from the setup and sets their entries to TBA.
     */
    public function updateFacultyAssignments(Schedule $schedule)
    {
        $schedule->load([
            'academicSetup.faculty',
            'entries.academicSetupSubject.facultyAssignments',
        ]);

        // Get list of valid faculty IDs from the setup (faculty still in the configuration)
        $validFacultyIds = $schedule->academicSetup->faculty->pluck('user_id')->toArray();

        $updatedCount = 0;
        $removedCount = 0;

        foreach ($schedule->entries as $entry) {
            $setupSubject = $entry->academicSetupSubject;

            if (!$setupSubject) {
                continue;
            }

            // Check if the current faculty is still in the setup's faculty list
            $currentFacultyId = $entry->user_id;
            $isFacultyRemoved = $currentFacultyId && !in_array($currentFacultyId, $validFacultyIds);

            // Get current faculty assignment for this subject
            $currentAssignment = $setupSubject->facultyAssignments->first();
            $newFacultyId = $currentAssignment?->user_id;

            // If faculty was removed from setup, set to TBA
            if ($isFacultyRemoved) {
                $entry->update(['user_id' => null]);
                $removedCount++;
                continue;
            }

            // Update if different from subject assignment
            if ($entry->user_id !== $newFacultyId) {
                $entry->update(['user_id' => $newFacultyId]);

                if ($newFacultyId) {
                    $updatedCount++;
                } else {
                    $removedCount++;
                }
            }
        }

        $message = "Schedule updated.";
        if ($updatedCount > 0 || $removedCount > 0) {
            $message = "Schedule updated: {$updatedCount} faculty assigned";
            if ($removedCount > 0) {
                $message .= ", {$removedCount} set to TBA";
            }
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Publish a schedule.
     */
    public function publish(Schedule $schedule)
    {
        $schedule->publish();

        return redirect()->back()->with('success', 'Schedule published successfully.');
    }

    /**
     * Delete a schedule.
     */
    public function destroy(Schedule $schedule)
    {
        $schedule->delete();

        return redirect()->route('scheduling.index')
            ->with('success', 'Schedule deleted.');
    }

    /**
     * Export schedule as printable view.
     */
    public function export(Schedule $schedule): Response
    {
        $schedule->load([
            'academicSetup.department',
            'academicSetup.course',
            'academicSetup.courses',
            'entries.room',
            'entries.timeSlot',
            'entries.academicSetupSubject.subject',
            'entries.academicSetupSubject.yearLevel',
            'entries.faculty',
        ]);

        $timeSlots = TimeSlot::active()->orderByPriority()->get();
        $rooms = Room::where('is_active', true)->orderBy('priority')->get();

        return Inertia::render('scheduling/export', [
            'schedule' => $schedule,
            'timeSlots' => $timeSlots,
            'rooms' => $rooms,
        ]);
    }

    /**
     * Display Teaching Load view (organized by faculty).
     */
    public function teachingLoad(Schedule $schedule): Response
    {
        $schedule->load([
            'academicSetup.course',
            'academicSetup.courses',
            'academicSetup.department',
            'academicSetup.yearLevels',
            'entries.room',
            'entries.timeSlot',
            'entries.academicSetupSubject.subject',
            'entries.academicSetupSubject.yearLevel',
            'entries.faculty',
        ]);

        // Group entries by faculty
        $entriesByFaculty = $schedule->entries
            ->groupBy(function ($entry) {
                return $entry->user_id ?? 'unassigned';
            })
            ->map(function ($entries, $facultyId) {
                $faculty = $entries->first()->faculty;
                return [
                    'faculty_id' => $facultyId === 'unassigned' ? null : $facultyId,
                    'faculty_name' => $faculty
                        ? strtoupper($faculty->lname)
                        : 'UNASSIGNED',
                    'faculty_full_name' => $faculty
                        ? "{$faculty->fname}" . ($faculty->mname ? " {$faculty->mname[0]}." : "") . " {$faculty->lname}"
                        : 'To Be Assigned',
                    'entries' => $entries->map(function ($entry) {
                        // Get parallel_display_code for parallel subjects (e.g., "ITP301/CSC101")
                        $parallelDisplayCode = $entry->academicSetupSubject?->parallel_display_code;

                        return [
                            'id' => $entry->id,
                            'subject_code' => $entry->academicSetupSubject?->subject?->code,
                            'display_code' => $entry->academicSetupSubject?->display_code,
                            'parallel_display_code' => !empty($parallelDisplayCode) ? $parallelDisplayCode : null,
                            'block_number' => $entry->academicSetupSubject?->block_number ?? 1,
                            'subject_name' => $entry->academicSetupSubject?->subject?->name,
                            'units' => $entry->academicSetupSubject?->subject?->units,
                            'room' => $entry->room?->name,
                            'time' => $entry->timeSlot?->name,
                            'display_time' => $entry->display_time,
                            'custom_start_time' => $entry->custom_start_time?->format('H:i'),
                            'custom_end_time' => $entry->custom_end_time?->format('H:i'),
                            'day' => $entry->day,
                            'day_group' => $entry->timeSlot?->day_group,
                            'is_lab' => $entry->is_lab_session,
                            'year_level' => $entry->academicSetupSubject?->yearLevel?->year_level,
                            'session_group_id' => $entry->session_group_id,
                        ];
                    })->sortBy([
                        ['day_group', 'asc'],
                        ['time', 'asc'],
                    ])->values(),
                    'total_units' => $entries->sum(function ($entry) {
                        return $entry->academicSetupSubject?->subject?->units ?? 0;
                    }) / 2, // Divide by 2 since each subject has 2 entries (MW or TTH)
                ];
            })
            ->sortBy('faculty_name')
            ->values();

        // Get time slots for reference
        $timeSlots = TimeSlot::active()->orderByPriority()->get();

        return Inertia::render('scheduling/teaching-load', [
            'schedule' => $schedule,
            'entriesByFaculty' => $entriesByFaculty,
            'timeSlots' => $timeSlots,
        ]);
    }

    /**
     * Display Registrar Template view (organized by section/subject).
     */
    public function registrarTemplate(Schedule $schedule): Response
    {
        $schedule->load([
            'academicSetup.course',
            'academicSetup.courses',
            'academicSetup.department',
            'academicSetup.yearLevels',
            'entries.room',
            'entries.timeSlot',
            'entries.academicSetupSubject.subject',
            'entries.academicSetupSubject.yearLevel',
            'entries.faculty',
        ]);

        // Group entries by year level and block (section)
        $entriesBySection = $schedule->entries
            ->groupBy(function ($entry) {
                $yearLevel = $entry->academicSetupSubject?->yearLevel?->year_level ?? 'Unknown';
                $blockNumber = $entry->academicSetupSubject?->block_number ?? 1;
                return "{$yearLevel}|{$blockNumber}";
            })
            ->map(function ($entries, $sectionKey) use ($schedule) {
                [$yearLevel, $blockNumber] = explode('|', $sectionKey);
                $blockNumber = (int) $blockNumber;

                // Group by subject to consolidate MW/TTH entries
                $subjectEntries = $entries->groupBy(function ($entry) {
                    return $entry->academic_setup_subject_id;
                })->map(function ($subjectSchedules) {
                    $first = $subjectSchedules->first();
                    $subject = $first->academicSetupSubject?->subject;
                    $faculty = $first->faculty;

                    // Collect all times and days for this subject
                    // Group by session_group_id to consolidate paired entries
                    $scheduleDetails = $subjectSchedules->map(function ($entry) {
                        return [
                            'time' => $entry->timeSlot?->name,
                            'custom_start_time' => $entry->custom_start_time?->format('H:i'),
                            'custom_end_time' => $entry->custom_end_time?->format('H:i'),
                            'display_time' => $entry->display_time,
                            'day' => $entry->day,
                            'day_group' => $entry->timeSlot?->day_group,
                            'room' => $entry->room?->name,
                            'is_lab' => $entry->is_lab_session,
                            'session_group_id' => $entry->session_group_id,
                        ];
                    })->values();

                    // Get parallel_display_code for parallel subjects (e.g., "ITP301/CSC101")
                    $parallelDisplayCode = $first->academicSetupSubject?->parallel_display_code;

                    return [
                        'subject_code' => $subject?->code,
                        'display_code' => $first->academicSetupSubject?->display_code,
                        'parallel_display_code' => !empty($parallelDisplayCode) ? $parallelDisplayCode : null,
                        'block_number' => $first->academicSetupSubject?->block_number ?? 1,
                        'subject_name' => $subject?->name,
                        'units' => $subject?->units,
                        'lecture_hours' => $subject?->lecture_hours,
                        'lab_hours' => $subject?->lab_hours,
                        'faculty_name' => $faculty
                            ? "{$faculty->lname}, {$faculty->fname}" . ($faculty->mname ? " {$faculty->mname[0]}." : "")
                            : 'TBA',
                        'schedules' => $scheduleDetails,
                    ];
                })->sortBy('subject_code')->values();

                // Build section code: BSIT101 = BSIT + 1st year (1) + Block 01
                $yearNumber = match ($yearLevel) {
                    '1st' => '1',
                    '2nd' => '2',
                    '3rd' => '3',
                    '4th' => '4',
                    '5th' => '5',
                    default => '0',
                };
                $sectionCode = $schedule->academicSetup?->course?->code . $yearNumber . str_pad($blockNumber, 2, '0', STR_PAD_LEFT);

                return [
                    'section_code' => $sectionCode, // e.g., "BSIT101" for 1st year Block 1
                    'year_level' => $yearLevel,
                    'block_number' => $blockNumber,
                    'subjects' => $subjectEntries,
                    'total_units' => $subjectEntries->sum('units'),
                ];
            })
            ->sortBy(function ($section) {
                // Sort by year level then block number
                $order = ['1st' => 1, '2nd' => 2, '3rd' => 3, '4th' => 4, '5th' => 5];
                $yearOrder = $order[$section['year_level']] ?? 99;
                return $yearOrder * 100 + ($section['block_number'] ?? 1);
            })
            ->values();

        return Inertia::render('scheduling/registrar-template', [
            'schedule' => $schedule,
            'entriesBySection' => $entriesBySection,
        ]);
    }

    /**
     * Export Teaching Load to Excel.
     */
    public function exportTeachingLoadExcel(Schedule $schedule): StreamedResponse
    {
        $exportService = new ScheduleExcelExportService($schedule);
        return $exportService->exportTeachingLoad();
    }

    /**
     * Export Room Allocation to Excel.
     */
    public function exportRoomAllocationExcel(Schedule $schedule): StreamedResponse
    {
        $exportService = new ScheduleExcelExportService($schedule);
        return $exportService->exportRoomAllocation();
    }

    /**
     * Export Registrar Template to Excel.
     */
    public function exportRegistrarTemplateExcel(Schedule $schedule): StreamedResponse
    {
        $exportService = new ScheduleExcelExportService($schedule);
        return $exportService->exportRegistrarTemplate();
    }

    /**
     * Update a single schedule entry (Drag and Drop).
     */
    public function updateEntry(Request $request, Schedule $schedule, ScheduleEntry $entry)
    {
        $validated = $request->validate([
            'day' => 'required|string',
            'time_slot_id' => 'required|exists:time_slots,id',
            'room_id' => 'required|exists:rooms,id',
        ]);

        DB::transaction(function () use ($entry, $validated) {
            $targetDay = $validated['day'];
            $targetTimeSlotId = $validated['time_slot_id'];
            $targetRoomId = $validated['room_id'];
            $targetTimeSlot = TimeSlot::find($targetTimeSlotId);

            // Determine day groups
            $originalDayGroup = $this->getDayGroup($entry->day);
            $targetDayGroup = $this->getDayGroup($targetDay);

            // Get the paired day for MW/TTH
            $pairedDay = $this->getPairedDay($targetDay);

            // Check if we're changing day groups
            $changingDayGroups = $originalDayGroup !== $targetDayGroup;

            if ($changingDayGroups) {
                // Moving FROM Fri/Sat/Sun TO MW/TTH: Split (Halve Duration, Create Pair)
                if (in_array($originalDayGroup, ['FRI', 'SAT', 'SUN']) && in_array($targetDayGroup, ['MW', 'TTH'])) {
                    $originalDurationMinutes = $this->calculateDurationMinutes($entry);
                    $newDurationMinutes = (int) ($originalDurationMinutes / 2);

                    $newStartTime = $targetTimeSlot->start_time;
                    $newEndTime = $this->addMinutesToTime($newStartTime, $newDurationMinutes);

                    // Update Original
                    $entry->day = $targetDay;
                    $entry->time_slot_id = $targetTimeSlotId;
                    $entry->room_id = $targetRoomId;
                    $entry->custom_start_time = Carbon::parse($newStartTime);
                    $entry->custom_end_time = Carbon::parse($newEndTime);
                    $entry->save();

                    // Create Pair
                    if ($pairedDay) {
                        ScheduleEntry::create([
                            'schedule_id' => $entry->schedule_id,
                            'academic_setup_subject_id' => $entry->academic_setup_subject_id,
                            'room_id' => $targetRoomId,
                            'time_slot_id' => $targetTimeSlotId,
                            'user_id' => $entry->user_id,
                            'day' => $pairedDay,
                            'is_lab_session' => $entry->is_lab_session,
                            'custom_start_time' => Carbon::parse($newStartTime),
                            'custom_end_time' => Carbon::parse($newEndTime),
                            'session_group_id' => $entry->session_group_id,
                            'slots_span' => $entry->slots_span,
                        ]);
                    }
                }
                // Moving FROM MW/TTH TO Fri/Sat/Sun: Combine (Double Duration, Delete Pair)
                elseif (in_array($originalDayGroup, ['MW', 'TTH']) && in_array($targetDayGroup, ['FRI', 'SAT', 'SUN'])) {
                    // Find and delete pair
                    $originalPairedDay = $this->getPairedDay($entry->day);
                    if ($originalPairedDay) {
                        ScheduleEntry::where('schedule_id', $entry->schedule_id)
                            ->where('academic_setup_subject_id', $entry->academic_setup_subject_id)
                            ->where('session_group_id', $entry->session_group_id)
                            ->where('day', $originalPairedDay)
                            ->delete();
                    }

                    $originalDurationMinutes = $this->calculateDurationMinutes($entry);
                    $newDurationMinutes = $originalDurationMinutes * 2;

                    $newStartTime = $targetTimeSlot->start_time;
                    $newEndTime = $this->addMinutesToTime($newStartTime, $newDurationMinutes);

                    $entry->day = $targetDay;
                    $entry->time_slot_id = $targetTimeSlotId;
                    $entry->room_id = $targetRoomId;
                    $entry->custom_start_time = Carbon::parse($newStartTime);
                    $entry->custom_end_time = Carbon::parse($newEndTime);
                    $entry->save();
                }
                // Moving between MW and TTH (e.g. MW -> TTH): Move Both
                elseif (in_array($originalDayGroup, ['MW', 'TTH']) && in_array($targetDayGroup, ['MW', 'TTH'])) {
                    // Find pair
                    $originalPairedDay = $this->getPairedDay($entry->day);
                    $pair = null;
                    if ($originalPairedDay) {
                        $pair = ScheduleEntry::where('schedule_id', $entry->schedule_id)
                            ->where('academic_setup_subject_id', $entry->academic_setup_subject_id)
                            ->where('session_group_id', $entry->session_group_id)
                            ->where('day', $originalPairedDay)
                            ->first();
                    }

                    // Calculate new times (keep duration same)
                    $originalDurationMinutes = $this->calculateDurationMinutes($entry);
                    $newStartTime = $targetTimeSlot->start_time;
                    $newEndTime = $this->addMinutesToTime($newStartTime, $originalDurationMinutes);

                    // Update Original
                    $entry->day = $targetDay;
                    $entry->time_slot_id = $targetTimeSlotId;
                    $entry->room_id = $targetRoomId;
                    $entry->custom_start_time = Carbon::parse($newStartTime);
                    $entry->custom_end_time = Carbon::parse($newEndTime);
                    $entry->save();

                    // Update Pair
                    if ($pair && $pairedDay) {
                        $pair->day = $pairedDay;
                        $pair->time_slot_id = $targetTimeSlotId;
                        $pair->room_id = $targetRoomId;
                        $pair->custom_start_time = Carbon::parse($newStartTime);
                        $pair->custom_end_time = Carbon::parse($newEndTime);
                        $pair->save();
                    }
                }
            } else {
                // Same Day Group (e.g. MW -> MW): Update Time/Room for Both
                $originalPairedDay = $this->getPairedDay($entry->day);
                $pair = null;
                if ($originalPairedDay) {
                    $pair = ScheduleEntry::where('schedule_id', $entry->schedule_id)
                        ->where('academic_setup_subject_id', $entry->academic_setup_subject_id)
                        ->where('session_group_id', $entry->session_group_id)
                        ->where('day', $originalPairedDay)
                        ->first();
                }

                // Calculate times
                $originalDurationMinutes = $this->calculateDurationMinutes($entry);
                $newStartTime = $targetTimeSlot->start_time;
                $newEndTime = $this->addMinutesToTime($newStartTime, $originalDurationMinutes);

                // Update Original
                $entry->day = $targetDay;
                $entry->time_slot_id = $targetTimeSlotId;
                $entry->room_id = $targetRoomId;
                $entry->custom_start_time = Carbon::parse($newStartTime);
                $entry->custom_end_time = Carbon::parse($newEndTime);
                $entry->save();

                // Update Pair (Keep same day, update time/room)
                if ($pair) {
                    $pair->time_slot_id = $targetTimeSlotId;
                    $pair->room_id = $targetRoomId;
                    $pair->custom_start_time = $newStartTime;
                    $pair->custom_end_time = $newEndTime;
                    $pair->save();
                }
            }
        });

        return redirect()->back()->with('success', 'Schedule entry updated.');
    }

    private function getDayGroup(string $day): string
    {
        $dayLower = strtolower($day);
        if (in_array($dayLower, ['monday', 'wednesday'])) return 'MW';
        if (in_array($dayLower, ['tuesday', 'thursday'])) return 'TTH';
        if ($dayLower === 'friday') return 'FRI';
        if ($dayLower === 'saturday') return 'SAT';
        return 'SUN';
    }

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

    private function calculateDurationMinutes(ScheduleEntry $entry): int
    {
        if ($entry->custom_start_time && $entry->custom_end_time) {
            // Already Carbon instances due to casts
            return $entry->custom_start_time->diffInMinutes($entry->custom_end_time);
        }

        $slot = $entry->timeSlot;
        if ($slot && $slot->start_time && $slot->end_time) {
            return $slot->start_time->diffInMinutes($slot->end_time);
        }

        return 60; // Default
    }

    private function addMinutesToTime(string $time, int $minutes): string
    {
        return \Carbon\Carbon::parse($time)->addMinutes($minutes)->format('H:i:s');
    }
}
