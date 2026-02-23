<?php

use App\Http\Controllers\AcademicSetupController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CurriculumProspectusController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SchedulingController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\UserController;
use App\Models\AcademicSetup;
use App\Models\Course;
use App\Models\Department;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified', 'approved'])->group(function () {
    Route::get('dashboard', function () {
        $user = Auth::user();
        $data = [
            'stats' => [
                'totalDepartments' => Department::where('is_active', true)->count(),
                'totalCourses' => Course::where('is_active', true)->count(),
                'totalSubjects' => Subject::where('is_active', true)->count(),
                'totalRooms' => Room::where('is_active', true)->count(),
                'totalUsers' => User::where('is_active', true)->count(),
                'activeSetups' => AcademicSetup::whereIn('status', ['completed', 'active'])->count(),
                'activeSchedules' => Schedule::where('status', 'published')->count(),
            ],
        ];

        // Add faculty schedule data if user is faculty
        if ($user->user_type === 'faculty') {
            // Get all schedules where the user has entries
            $availableSchedules = Schedule::whereHas('entries', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
                ->with(['academicSetup.department', 'academicSetup.course'])
                ->orderBy('created_at', 'desc')
                ->get();

            $scheduleId = request('schedule_id');

            // Determine which schedule to show
            if ($scheduleId) {
                $schedule = $availableSchedules->find($scheduleId);
            } else {
                // Default to latest published, or just latest if none published
                $schedule = $availableSchedules->where('status', 'published')->first()
                    ?? $availableSchedules->first();
            }

            // Map available schedules for the dropdown
            $data['schedules'] = $availableSchedules->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'status' => $s->status,
                    'academic_year' => $s->academicSetup?->academic_year,
                    'semester' => $s->academicSetup?->semester,
                    'department' => $s->academicSetup?->department?->name,
                    'created_at' => $s->created_at->toIso8601String(),
                ];
            });

            if ($schedule) {
                $entries = \App\Models\ScheduleEntry::where('schedule_id', $schedule->id)
                    ->where('user_id', $user->id)
                    ->with([
                        'academicSetupSubject.subject',
                        'academicSetupSubject.yearLevel',
                        'academicSetupSubject.courses',
                        'room',
                        'timeSlot'
                    ])
                    ->get();

                $timeSlots = \App\Models\TimeSlot::where('is_active', true)
                    ->orderBy('start_time')
                    ->get();

                // Format entries for display
                $formatTime = function ($timeString) {
                    if (!$timeString) return '';
                    try {
                        return \Carbon\Carbon::parse($timeString)->format('g:i A');
                    } catch (\Exception $e) {
                        return $timeString;
                    }
                };

                $formattedEntries = $entries->map(function ($entry) use ($formatTime) {
                    $setupSubject = $entry->academicSetupSubject;
                    $subject = $setupSubject?->subject;
                    $timeSlot = $entry->timeSlot;

                    $startTime = $entry->custom_start_time ?? $timeSlot?->start_time;
                    $endTime = $entry->custom_end_time ?? $timeSlot?->end_time;

                    return [
                        'id' => $entry->id,
                        'subject_code' => $subject?->code ?? 'N/A',
                        'display_code' => $setupSubject?->display_code,
                        'parallel_display_code' => $setupSubject?->parallel_display_code,
                        'subject_name' => $subject?->name ?? 'Unknown',
                        'units' => $subject?->units ?? 0,
                        'room' => $entry->room?->name ?? 'TBA',
                        'time_slot_name' => $timeSlot?->name ?? 'N/A',
                        'display_time' => $formatTime($startTime) . ' - ' . $formatTime($endTime),
                        'day' => $entry->day,
                        'day_group' => $timeSlot?->day_group ?? 'OTHER',
                        'is_lab' => $entry->is_lab_session,
                        'year_level' => $setupSubject?->yearLevel?->year_level ?? 'N/A',
                        'block_number' => $setupSubject?->block_number ?? 1,
                        'time_slot_id' => $entry->time_slot_id,
                    ];
                });

                $data['facultySchedule'] = [
                    'schedule' => [
                        'id' => $schedule->id,
                        'name' => $schedule->name,
                        'status' => $schedule->status,
                        'academic_year' => $schedule->academicSetup?->academic_year,
                        'semester' => $schedule->academicSetup?->semester,
                        'department' => $schedule->academicSetup?->department?->name,
                    ],
                    'entries' => $formattedEntries,
                    'timeSlots' => $timeSlots,
                ];

                // Calculate stats for faculty
                $totalUnitsRaw = $entries->sum(fn($e) => $e->academicSetupSubject?->subject?->units ?? 0);
                $data['stats']['totalUnits'] = (int) round($totalUnitsRaw / 2);
                $data['stats']['totalSubjectsAssigned'] = $entries->unique('academic_setup_subject_id')->count();
                $data['stats']['totalEntries'] = $entries->count();
            }
        }

        return Inertia::render('dashboard', $data);
    })->name('dashboard');

    // Department Management Routes
    Route::get('departments', [DepartmentController::class, 'index'])->name('departments.index');
    Route::post('departments', [DepartmentController::class, 'store'])->name('departments.store');
    Route::patch('departments/{department}', [DepartmentController::class, 'update'])->name('departments.update');
    Route::delete('departments/{department}', [DepartmentController::class, 'destroy'])->name('departments.destroy');
    Route::patch('departments/{department}/toggle-status', [DepartmentController::class, 'toggleStatus'])
        ->name('departments.toggle-status');

    // Course Management Routes
    Route::get('courses', [CourseController::class, 'index'])->name('courses.index');
    Route::post('courses', [CourseController::class, 'store'])->name('courses.store');
    Route::patch('courses/{course}', [CourseController::class, 'update'])->name('courses.update');
    Route::delete('courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');
    Route::patch('courses/{course}/toggle-status', [CourseController::class, 'toggleStatus'])
        ->name('courses.toggle-status');
    Route::get('courses/{course}/majors', [CourseController::class, 'getMajors'])->name('courses.majors');

    // Subject Management Routes
    Route::get('subjects', [SubjectController::class, 'index'])->name('subjects.index');
    Route::post('subjects', [SubjectController::class, 'store'])->name('subjects.store');
    Route::patch('subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
    Route::delete('subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');
    Route::patch('subjects/{subject}/toggle-status', [SubjectController::class, 'toggleStatus'])
        ->name('subjects.toggle-status');
    Route::get('subjects/export', [SubjectController::class, 'exportCsv'])->name('subjects.export');
    Route::get('subjects/template', [SubjectController::class, 'exportTemplate'])->name('subjects.template');
    Route::post('subjects/validate-import', [SubjectController::class, 'validateImport'])->name('subjects.validate-import');
    Route::post('subjects/import', [SubjectController::class, 'importCsv'])->name('subjects.import');

    // Room Management Routes
    Route::get('rooms', [RoomController::class, 'index'])->name('rooms.index');
    Route::post('rooms', [RoomController::class, 'store'])->name('rooms.store');
    Route::patch('rooms/{room}', [RoomController::class, 'update'])->name('rooms.update');
    Route::delete('rooms/{room}', [RoomController::class, 'destroy'])->name('rooms.destroy');
    Route::patch('rooms/{room}/toggle-availability', [RoomController::class, 'toggleAvailability'])
        ->name('rooms.toggle-availability');
    Route::patch('rooms/{room}/toggle-status', [RoomController::class, 'toggleStatus'])
        ->name('rooms.toggle-status');

    // Building Management Routes
    Route::resource('buildings', BuildingController::class);
    Route::get('buildings/{building}/rooms', [BuildingController::class, 'rooms'])->name('buildings.rooms');
    Route::post('buildings/{building}/assign-rooms', [BuildingController::class, 'assignRooms'])->name('buildings.assign-rooms');
    Route::delete('buildings/{building}/rooms/{room}', [BuildingController::class, 'unassignRoom'])->name('buildings.unassign-room');
    Route::get('api/buildings', [BuildingController::class, 'apiIndex'])->name('api.buildings');

    // Schedule Export
    Route::get('schedules/{schedule}/export', [\App\Http\Controllers\SchedulingController::class, 'export'])->name('schedules.export');
    Route::get('schedules/export-template', [\App\Http\Controllers\SchedulingController::class, 'exportTemplate'])->name('schedules.export-template');

    // Schedule Change Requests Management (Scheduler/Admin)
    Route::get('schedule-requests', [\App\Http\Controllers\ScheduleChangeRequestController::class, 'index'])->name('schedule-requests.index');
    Route::post('schedule-requests/{id}/approve', [\App\Http\Controllers\ScheduleChangeRequestController::class, 'approve'])->name('schedule-requests.approve');
    Route::post('schedule-requests/{id}/reject', [\App\Http\Controllers\ScheduleChangeRequestController::class, 'reject'])->name('schedule-requests.reject');

    // Time Slot Management Routes
    Route::get('time-slots', [\App\Http\Controllers\TimeSlotController::class, 'index'])->name('time-slots.index');
    Route::post('time-slots', [\App\Http\Controllers\TimeSlotController::class, 'store'])->name('time-slots.store');
    Route::patch('time-slots/{timeSlot}', [\App\Http\Controllers\TimeSlotController::class, 'update'])->name('time-slots.update');
    Route::delete('time-slots/{timeSlot}', [\App\Http\Controllers\TimeSlotController::class, 'destroy'])->name('time-slots.destroy');
    Route::patch('time-slots/{timeSlot}/toggle-status', [\App\Http\Controllers\TimeSlotController::class, 'toggleStatus'])
        ->name('time-slots.toggle-status');

    // User Management Routes (Admin only - middleware can be added later)
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])
        ->name('users.toggle-status');
    Route::post('users/{user}/approve', [UserController::class, 'approve'])->name('users.approve');
    Route::post('users/{user}/reject', [UserController::class, 'reject'])->name('users.reject');

    // User Manual Page
    Route::get('user-manual', function () {
        return Inertia::render('user-manual');
    })->name('user-manual');

    // Curriculum Prospectus Routes
    Route::prefix('prospectus')->name('prospectus.')->group(function () {
        Route::get('/', [CurriculumProspectusController::class, 'index'])->name('index');
        Route::get('/create', [CurriculumProspectusController::class, 'create'])->name('create');
        Route::post('/', [CurriculumProspectusController::class, 'store'])->name('store');
        Route::get('/department/{department}/year/{academic_year}', [CurriculumProspectusController::class, 'departmentShow'])->name('department-show');
        Route::get('/{prospectus}', [CurriculumProspectusController::class, 'show'])->name('show');
        Route::get('/{prospectus}/edit', [CurriculumProspectusController::class, 'edit'])->name('edit');
        Route::get('/{prospectus}/export', [CurriculumProspectusController::class, 'exportCsv'])->name('export');
        Route::post('/{prospectus}/validate-import', [CurriculumProspectusController::class, 'validateImport'])->name('validate-import');
        Route::post('/{prospectus}/import', [CurriculumProspectusController::class, 'importCsv'])->name('import');
        Route::patch('/{prospectus}', [CurriculumProspectusController::class, 'update'])->name('update');
        Route::patch('/{prospectus}/info', [CurriculumProspectusController::class, 'updateInfo'])->name('update-info');
        Route::delete('/{prospectus}', [CurriculumProspectusController::class, 'destroy'])->name('destroy');
    });

    // Academic Setup Routes (Multi-Year Configuration)
    Route::prefix('academic-setup')->name('academic-setup.')->group(function () {
        // Non-parameterized routes MUST come first
        Route::get('/', [AcademicSetupController::class, 'index'])->name('index');
        Route::get('/create', [AcademicSetupController::class, 'create'])->name('create');
        Route::post('/', [AcademicSetupController::class, 'store'])->name('store');

        // Bulk export/import routes (no {setup} parameter) - must be before {setup} routes
        Route::post('/export-bulk', [AcademicSetupController::class, 'exportBulkCsv'])->name('export-bulk');
        Route::post('/validate-new-import', [AcademicSetupController::class, 'validateNewImport'])->name('validate-new-import');
        Route::post('/import-new', [AcademicSetupController::class, 'importNew'])->name('import-new');

        // Routes with {setup} parameter
        Route::get('/{setup}/configure', [AcademicSetupController::class, 'configure'])->name('configure');
        Route::post('/{setup}/faculty', [AcademicSetupController::class, 'saveFaculty'])->name('save-faculty');
        Route::post('/{setup}/facilities', [AcademicSetupController::class, 'saveFacilities'])->name('save-facilities');
        Route::post('/{setup}/year-levels/{yearLevel}/subjects', [AcademicSetupController::class, 'saveYearLevelSubjects'])->name('save-year-level-subjects');
        Route::post('/{setup}/year-levels/{yearLevel}/assignments', [AcademicSetupController::class, 'saveAssignments'])->name('save-assignments');
        Route::post('/{setup}/year-levels/{yearLevel}/complete', [AcademicSetupController::class, 'completeYearLevel'])->name('complete-year-level');
        Route::patch('/{setup}/activate', [AcademicSetupController::class, 'activate'])->name('activate');
        Route::delete('/{setup}', [AcademicSetupController::class, 'destroy'])->name('destroy');

        // Per-setup export/import routes
        Route::get('/{setup}/export-csv', [AcademicSetupController::class, 'exportCsv'])->name('export-csv');
        Route::post('/{setup}/validate-import', [AcademicSetupController::class, 'validateImport'])->name('validate-import');
        Route::post('/{setup}/import-csv', [AcademicSetupController::class, 'importCsv'])->name('import-csv');
    });

    // Scheduling Routes
    Route::prefix('scheduling')->name('scheduling.')->group(function () {
        Route::get('/', [SchedulingController::class, 'index'])->name('index');
        Route::post('/generate', [SchedulingController::class, 'generate'])->name('generate');
        Route::post('/generate-sync', [SchedulingController::class, 'generateSync'])->name('generate-sync');
        Route::get('/progress', [SchedulingController::class, 'progress'])->name('progress');
        Route::get('/{schedule}', [SchedulingController::class, 'show'])->name('show');
        Route::patch('/{schedule}/publish', [SchedulingController::class, 'publish'])->name('publish');
        Route::patch('/{schedule}/update-faculty', [SchedulingController::class, 'updateFacultyAssignments'])->name('update-faculty');
        Route::delete('/{schedule}', [SchedulingController::class, 'destroy'])->name('destroy');
        Route::get('/{schedule}/export', [SchedulingController::class, 'export'])->name('export');
        Route::get('/{schedule}/teaching-load', [SchedulingController::class, 'teachingLoad'])->name('teaching-load');
        Route::get('/{schedule}/registrar-template', [SchedulingController::class, 'registrarTemplate'])->name('registrar-template');

        // Excel Export Routes
        Route::get('/{schedule}/export/teaching-load', [SchedulingController::class, 'exportTeachingLoadExcel'])->name('export.teaching-load');
        Route::get('/{schedule}/export/room-allocation', [SchedulingController::class, 'exportRoomAllocationExcel'])->name('export.room-allocation');
        Route::get('/{schedule}/export/registrar-template', [SchedulingController::class, 'exportRegistrarTemplateExcel'])->name('export.registrar-template');

        // Manual Entry Update
        Route::patch('/{schedule}/entries/{entry}', [SchedulingController::class, 'updateEntry'])->name('update-entry');
    });

    // Faculty Routes
    Route::get('/faculty/schedule', [\App\Http\Controllers\FacultyController::class, 'schedule'])->name('faculty.schedule');
    Route::get('/faculty/teaching-load', [\App\Http\Controllers\FacultyController::class, 'teachingLoad'])->name('faculty.teaching-load');
    Route::post('/faculty/schedule/change-request', [\App\Http\Controllers\ScheduleChangeRequestController::class, 'store'])->name('faculty.request-change');
    Route::delete('/faculty/schedule/change-request/{id}', [\App\Http\Controllers\ScheduleChangeRequestController::class, 'cancel'])->name('faculty.cancel-request');
    Route::post('/faculty/schedule/check-conflict', [\App\Http\Controllers\ScheduleChangeRequestController::class, 'check'])->name('faculty.check-conflict');
});

require __DIR__ . '/settings.php';
