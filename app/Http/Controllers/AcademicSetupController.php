<?php

namespace App\Http\Controllers;

use App\Models\AcademicSetup;
use App\Models\AcademicSetupFaculty;
use App\Models\AcademicSetupSubject;
use App\Models\AcademicSetupYearLevel;
use App\Models\Building;
use App\Models\Course;
use App\Models\CurriculumProspectus;
use App\Models\Department;
use App\Models\Room;
use App\Models\Subject;
use App\Models\SubjectFacultyAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AcademicSetupController extends Controller
{
    /**
     * Display a listing of academic setups.
     */
    public function index(Request $request): Response
    {
        $query = AcademicSetup::with(['department', 'course', 'courses', 'creator', 'yearLevels'])
            ->withCount(['faculty']);

        // User-based scoping
        $user = $request->user();
        if ($user && $user->isScheduler() && $user->department_id) {
            $query->where('department_id', $user->department_id);
        }

        if ($request->has('academic_year') && $request->academic_year) {
            $query->where('academic_year', $request->academic_year);
        }

        if ($request->has('semester') && $request->semester) {
            $query->where('semester', $request->semester);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $setups = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        // Add progress information to each setup
        $setups->through(function ($setup) {
            $setup->configured_years = $setup->configuredYears;
            $setup->progress_percentage = $setup->progressPercentage;
            return $setup;
        });

        // Get unique academic years for filtering
        $academicYears = AcademicSetup::distinct()->pluck('academic_year')->sort()->values();

        return Inertia::render('academic-setup/index', [
            'setups' => $setups,
            'academicYears' => $academicYears,
            'filters' => $request->only(['academic_year', 'semester', 'status']),
        ]);
    }

    /**
     * Show the wizard for creating a new academic setup.
     */
    public function create(Request $request): Response
    {
        $departmentsQuery = Department::where('is_active', true)->orderBy('name');
        $coursesQuery = Course::with('department')
            ->where('is_active', true)
            ->orderBy('code');

        $user = $request->user();
        if ($user && $user->isScheduler() && $user->department_id) {
            $departmentsQuery->where('id', $user->department_id);
            $coursesQuery->where('department_id', $user->department_id);
        }

        $departments = $departmentsQuery->get();
        $courses = $coursesQuery->get();

        return Inertia::render('academic-setup/create', [
            'departments' => $departments,
            'courses' => $courses,
        ]);
    }

    /**
     * Store a new academic setup.
     * Now supports multiple courses per department.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'course_ids' => ['required', 'array', 'min:1'],
            'course_ids.*' => ['exists:courses,id'],
            'curriculum_name' => ['required', 'string', 'max:255'],
            'academic_year' => ['required', 'string', 'max:20'],
            'semester' => ['required', Rule::in(['1st', '2nd', 'summer'])],
            'year_levels' => ['required', 'array', 'min:1'],
            'year_levels.*' => ['string', Rule::in(['1st', '2nd', '3rd', '4th', '5th'])],
        ]);

        // Check if setup already exists for this department, semester, and year
        $existing = AcademicSetup::where('department_id', $validated['department_id'])
            ->where('academic_year', $validated['academic_year'])
            ->where('semester', $validated['semester'])
            ->first();

        if ($existing) {
            return redirect()->back()->with('error', 'An academic setup for this department, semester, and academic year already exists.');
        }

        // Create the setup (department-based)
        $setup = AcademicSetup::create([
            'department_id' => $validated['department_id'],
            'course_id' => $validated['course_ids'][0], // Keep first course for backwards compatibility
            'curriculum_name' => $validated['curriculum_name'],
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'status' => 'configuring',
            'current_config_year' => 1,
            'created_by' => Auth::id(),
        ]);

        // Attach all selected courses
        $setup->courses()->attach($validated['course_ids']);

        // Create year level records
        foreach ($validated['year_levels'] as $yearLevel) {
            $setup->yearLevels()->create([
                'year_level' => $yearLevel,
                'section_count' => 1,
                'expected_students' => 40,
                'is_configured' => false,
            ]);
        }

        return redirect()->route('academic-setup.configure', [$setup, 'year' => $setup->yearLevels()->first()->year_level])
            ->with('success', 'Academic setup created. Now configure each year level.');
    }

    /**
     * Show the configuration page for a specific year level.
     */
    public function configure(AcademicSetup $setup, Request $request): Response|\Symfony\Component\HttpFoundation\Response
    {
        $yearLevelName = $request->query('year', '1st');

        $setup->load([
            'department',
            'course',
            'courses', // Load all courses in this setup
            'yearLevels.subjects.subject.courses', // Load subject's courses for detecting shared subjects
            'yearLevels.subjects.course', // Load the single course (backwards compat)
            'yearLevels.subjects.courses', // Load fused courses for this block
            'yearLevels.subjects.facultyAssignments.user',
            'yearLevels.subjects.preferredLectureRoom', // Load preferred lecture room
            'yearLevels.subjects.preferredLabRoom', // Load preferred lab room
            'faculty.user',
            'buildings', // Load selected buildings
            'selectedRooms', // Load selected rooms
        ]);

        // Get the current year level being configured
        $currentYearLevel = $setup->yearLevels->firstWhere('year_level', $yearLevelName);

        if (!$currentYearLevel) {
            // Redirect to the first available year level or index
            $firstYearLevel = $setup->yearLevels->first();
            if ($firstYearLevel) {
                return redirect()->route('academic-setup.configure', [$setup, 'year' => $firstYearLevel->year_level]);
            }
            return redirect()->route('academic-setup.index')->with('error', 'No year levels found.');
        }

        // Get course IDs from the setup (use new multi-course relationship, fallback to single course)
        $courseIds = $setup->courses->isNotEmpty()
            ? $setup->courses->pluck('id')->toArray()
            : ($setup->course_id ? [$setup->course_id] : []);

        // Get subjects for all courses in this setup (course-specific + general education + shared subjects)
        $subjects = Subject::with(['prerequisites', 'course', 'courses'])
            ->where('is_active', true)
            ->where(function ($query) use ($courseIds) {
                // Include course-specific subjects
                $query->whereIn('course_id', $courseIds)
                    // Include GE subjects (no course_id)
                    ->orWhereNull('course_id')
                    // Include subjects shared with these courses (via many-to-many)
                    ->orWhereHas('courses', function ($q) use ($courseIds) {
                        $q->whereIn('courses.id', $courseIds);
                    });
            })
            ->orderBy('code')
            ->get();

        // Get faculty users
        $faculty = User::where('is_active', true)
            ->whereIn('user_type', ['faculty', 'admin'])
            ->orderBy('lname')
            ->get();

        // Get subjects already assigned to OTHER year levels (not the current one)
        $subjectsInOtherYears = [];
        foreach ($setup->yearLevels as $yearLevel) {
            if ($yearLevel->id !== $currentYearLevel->id) {
                foreach ($yearLevel->subjects as $setupSubject) {
                    $subjectsInOtherYears[$setupSubject->subject_id] = $yearLevel->year_level;
                }
            }
        }

        // Get buildings with their rooms for facility selection
        $buildings = Building::active()
            ->with(['rooms' => function ($q) {
                $q->where('is_active', true)->orderBy('name');
            }])
            ->orderBy('code')
            ->get();

        // Get rooms already selected for this setup
        // Get all active rooms for preferred room selection
        $rooms = Room::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'room_type', 'capacity', 'building_id']);

        // Get prospectuses for the courses in this setup
        // This enables prospectus-based subject selection
        $prospectuses = CurriculumProspectus::with(['subjects', 'course'])
            ->whereIn('course_id', $courseIds)
            ->where('is_active', true)
            ->orderBy('academic_year', 'desc')
            ->get()
            ->map(function ($prospectus) {
                return [
                    'id' => $prospectus->id,
                    'name' => $prospectus->name,
                    'academic_year' => $prospectus->academic_year,
                    'course_id' => $prospectus->course_id,
                    'course_code' => $prospectus->course?->code,
                    'subjects' => $prospectus->subjects->map(function ($subject) {
                        return [
                            'id' => $subject->id,
                            'code' => $subject->code,
                            'name' => $subject->name,
                            'units' => $subject->units,
                            'lecture_hours' => $subject->lecture_hours,
                            'lab_hours' => $subject->lab_hours,
                            'year_level' => $subject->pivot->year_level,
                            'semester' => $subject->pivot->semester,
                            'sort_order' => $subject->pivot->sort_order,
                        ];
                    }),
                ];
            });

        // Get unique academic years from prospectuses
        $prospectusYears = $prospectuses->pluck('academic_year')->unique()->values();

        return Inertia::render('academic-setup/configure', [
            'setup' => $setup,
            'currentYearLevel' => $currentYearLevel,
            'subjects' => $subjects,
            'faculty' => $faculty,
            'subjectsInOtherYears' => $subjectsInOtherYears,
            'buildings' => $buildings,
            'rooms' => $rooms,
            'prospectuses' => $prospectuses,
            'prospectusYears' => $prospectusYears,
        ]);
    }

    /**
     * Save subjects for a specific year level.
     * Now supports blocks - same subject can be added multiple times with different block numbers.
     * Also supports course_ids (array) for fusing multiple courses in the same block.
     */
    public function saveYearLevelSubjects(AcademicSetup $setup, AcademicSetupYearLevel $yearLevel, Request $request)
    {
        $validated = $request->validate([
            'section_count' => ['required', 'integer', 'min:1', 'max:20'],
            'subjects' => ['nullable', 'array'],
            'subjects.*.subject_id' => ['required', 'exists:subjects,id'],
            'subjects.*.course_ids' => ['nullable', 'array'], // Multiple courses can be fused
            'subjects.*.course_ids.*' => ['exists:courses,id'],
            'subjects.*.block_number' => ['nullable', 'integer', 'min:1', 'max:20'],
            'subjects.*.expected_students' => ['nullable', 'integer', 'min:1'],
            'subjects.*.needs_lab' => ['nullable', 'boolean'],
            'subjects.*.preferred_lecture_room_id' => ['nullable', 'exists:rooms,id'],
            'subjects.*.preferred_lab_room_id' => ['nullable', 'exists:rooms,id'],
            'subjects.*.parallel_subject_ids' => ['nullable', 'array'], // IDs of parallel subjects (different codes, same content)
            'subjects.*.parallel_subject_ids.*' => ['exists:subjects,id'],
        ]);

        // Update year level section count
        $yearLevel->update(['section_count' => $validated['section_count']]);

        // Get existing subjects for comparison
        $existingSubjects = $yearLevel->subjects()->with('courses')->get();

        // Build a lookup key for existing subjects: subject_id + sorted course_ids + block_number
        $existingLookup = [];
        foreach ($existingSubjects as $existing) {
            $courseIds = $existing->courses->pluck('id')->sort()->values()->toArray();
            $key = $existing->subject_id . '-' . implode(',', $courseIds) . '-' . $existing->block_number;
            $existingLookup[$key] = $existing;
        }

        $processedKeys = [];
        $blockCount = 0;
        $updatedCount = 0;
        $createdCount = 0;

        if (!empty($validated['subjects'])) {
            foreach ($validated['subjects'] as $subjectData) {
                $courseIds = $subjectData['course_ids'] ?? [];
                sort($courseIds);
                $blockNumber = $subjectData['block_number'] ?? 1;
                $parallelSubjectIds = $subjectData['parallel_subject_ids'] ?? null;
                $key = $subjectData['subject_id'] . '-' . implode(',', $courseIds) . '-' . $blockNumber;

                $processedKeys[] = $key;

                if (isset($existingLookup[$key])) {
                    // Update existing subject - preserves schedule entry references
                    $existing = $existingLookup[$key];
                    $existing->update([
                        'expected_students' => $subjectData['expected_students'] ?? $yearLevel->expected_students,
                        'needs_lab' => $subjectData['needs_lab'] ?? false,
                        'preferred_lecture_room_id' => $subjectData['preferred_lecture_room_id'] ?? null,
                        'preferred_lab_room_id' => $subjectData['preferred_lab_room_id'] ?? null,
                        'parallel_subject_ids' => $parallelSubjectIds,
                    ]);
                    $updatedCount++;
                } else {
                    // Create new subject
                    $setupSubject = AcademicSetupSubject::create([
                        'academic_setup_id' => $setup->id,
                        'year_level_id' => $yearLevel->id,
                        'subject_id' => $subjectData['subject_id'],
                        // Keep first course_id for backwards compatibility
                        'course_id' => !empty($courseIds) ? $courseIds[0] : null,
                        'block_number' => $blockNumber,
                        'expected_students' => $subjectData['expected_students'] ?? $yearLevel->expected_students,
                        'needs_lab' => $subjectData['needs_lab'] ?? false,
                        'preferred_lecture_room_id' => $subjectData['preferred_lecture_room_id'] ?? null,
                        'preferred_lab_room_id' => $subjectData['preferred_lab_room_id'] ?? null,
                        'parallel_subject_ids' => $parallelSubjectIds,
                    ]);

                    // Attach all courses to the pivot table (for fused course support)
                    if (!empty($courseIds)) {
                        $setupSubject->courses()->attach($courseIds);
                    }
                    $createdCount++;
                }

                $blockCount++;
            }
        }

        // Only delete subjects that are no longer in the list
        // This preserves schedule entries for subjects that still exist
        $deletedCount = 0;
        foreach ($existingLookup as $key => $existing) {
            if (!in_array($key, $processedKeys)) {
                // Check if this subject has schedule entries - warn but still delete
                $hasScheduleEntries = $existing->scheduleEntries()->exists();
                if ($hasScheduleEntries) {
                    // Log this for debugging
                    Log::warning("Deleting AcademicSetupSubject {$existing->id} with schedule entries", [
                        'subject_id' => $existing->subject_id,
                        'block_number' => $existing->block_number,
                    ]);
                }
                $existing->delete();
                $deletedCount++;
            }
        }

        $subjectCount = count(array_unique(array_column($validated['subjects'] ?? [], 'subject_id')));
        $message = "Saved {$subjectCount} subjects with {$blockCount} total blocks.";
        if ($updatedCount > 0) {
            $message .= " ({$updatedCount} updated, {$createdCount} new)";
        }
        if ($deletedCount > 0) {
            $message .= " {$deletedCount} removed.";
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Save faculty for the academic setup (applies to all year levels).
     */
    public function saveFaculty(AcademicSetup $setup, Request $request)
    {
        $validated = $request->validate([
            'faculty' => ['nullable', 'array'],
            'faculty.*.user_id' => ['required', 'exists:users,id'],
            'faculty.*.max_units' => ['nullable', 'integer', 'min:1', 'max:60'],
            'faculty.*.preferred_day_off' => ['nullable', Rule::in(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])],
            'faculty.*.preferred_time_period' => ['nullable', Rule::in(['morning', 'afternoon'])],
        ], [
            'faculty.*.max_units.min' => 'Max units must be at least 1.',
            'faculty.*.max_units.max' => 'Max units cannot exceed 60.',
            'faculty.*.max_units.integer' => 'Max units must be a whole number.',
        ]);

        // Remove existing faculty
        $setup->faculty()->delete();

        // Add new faculty
        if (!empty($validated['faculty'])) {
            foreach ($validated['faculty'] as $facultyData) {
                AcademicSetupFaculty::create([
                    'academic_setup_id' => $setup->id,
                    'user_id' => $facultyData['user_id'],
                    'max_units' => $facultyData['max_units'] ?? 24,
                    'preferred_day_off' => $facultyData['preferred_day_off'] ?? null,
                    'preferred_time_period' => $facultyData['preferred_time_period'] ?? null,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Faculty saved successfully.');
    }

    /**
     * Save buildings and rooms for the academic setup.
     */
    public function saveFacilities(AcademicSetup $setup, Request $request)
    {
        $validated = $request->validate([
            'building_ids' => ['nullable', 'array'],
            'building_ids.*' => ['exists:buildings,id'],
            'room_ids' => ['nullable', 'array'],
            'room_ids.*' => ['exists:rooms,id'],
        ]);

        // Sync buildings
        $setup->buildings()->sync($validated['building_ids'] ?? []);

        // Sync specific rooms (optional - if empty, all rooms from buildings will be used)
        $setup->selectedRooms()->sync($validated['room_ids'] ?? []);

        return redirect()->back()->with('success', 'Facilities saved successfully.');
    }

    /**
     * Save subject-faculty assignments for a year level.
     */
    public function saveAssignments(AcademicSetup $setup, AcademicSetupYearLevel $yearLevel, Request $request)
    {
        $validated = $request->validate([
            'assignments' => ['nullable', 'array'],
            'assignments.*.academic_setup_subject_id' => ['required', 'exists:academic_setup_subjects,id'],
            'assignments.*.user_id' => ['nullable', 'exists:users,id'],
        ]);

        // Remove existing assignments for this year level's subjects
        $subjectIds = $yearLevel->subjects()->pluck('id');
        SubjectFacultyAssignment::whereIn('academic_setup_subject_id', $subjectIds)->delete();

        // Add new assignments (only if user_id is provided)
        $assignedCount = 0;
        $unassignedCount = 0;

        if (!empty($validated['assignments'])) {
            foreach ($validated['assignments'] as $assignment) {
                if (!empty($assignment['user_id'])) {
                    SubjectFacultyAssignment::create([
                        'academic_setup_id' => $setup->id,
                        'academic_setup_subject_id' => $assignment['academic_setup_subject_id'],
                        'user_id' => $assignment['user_id'],
                    ]);
                    $assignedCount++;
                } else {
                    $unassignedCount++;
                }
            }
        }

        $message = "Faculty assignments saved.";
        if ($assignedCount > 0) {
            $message .= " {$assignedCount} assigned.";
        }
        if ($unassignedCount > 0) {
            $message .= " {$unassignedCount} subjects have no faculty (TBA).";
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Mark a year level as configured and move to the next.
     */
    public function completeYearLevel(AcademicSetup $setup, AcademicSetupYearLevel $yearLevel)
    {
        // Mark as configured
        $yearLevel->update(['is_configured' => true]);

        // Find next unconfigured year level
        $nextYearLevel = $setup->yearLevels()
            ->where('is_configured', false)
            ->orderByRaw("FIELD(year_level, '1st', '2nd', '3rd', '4th', '5th')")
            ->first();

        if ($nextYearLevel) {
            return redirect()->route('academic-setup.configure', [$setup, 'year' => $nextYearLevel->year_level])
                ->with('success', "{$yearLevel->year_level} Year configuration completed. Now configure {$nextYearLevel->year_level} Year.");
        }

        // All year levels configured
        $setup->update(['status' => 'active']);

        return redirect()->route('academic-setup.index')
            ->with('success', 'Academic setup completed for all year levels!');
    }

    /**
     * Activate the setup for scheduling (even if not all years are configured).
     */
    public function activate(AcademicSetup $setup)
    {
        // Check if at least one year level is configured
        if ($setup->yearLevels()->where('is_configured', true)->count() === 0) {
            return redirect()->back()->with('error', 'At least one year level must be configured before activating.');
        }

        $setup->update(['status' => 'active']);

        return redirect()->route('academic-setup.index')
            ->with('success', 'Academic setup activated and ready for scheduling.');
    }

    /**
     * Delete an academic setup.
     */
    public function destroy(AcademicSetup $setup)
    {
        $setup->delete();

        return redirect()->route('academic-setup.index')
            ->with('success', 'Academic setup deleted successfully.');
    }

    /**
     * Export academic setup configuration to CSV.
     * This exports all year levels, subjects, faculty, and assignments.
     */
    public function exportCsv(AcademicSetup $setup)
    {
        $setup->load([
            'department',
            'courses',
            'yearLevels.subjects.subject',
            'yearLevels.subjects.courses',
            'yearLevels.subjects.facultyAssignments.user',
            'yearLevels.subjects.preferredLectureRoom',
            'yearLevels.subjects.preferredLabRoom',
            'faculty.user',
        ]);

        $fileName = sprintf(
            'academic-setup_%s_%s_%s.csv',
            str_replace([' ', ','], ['_', '-'], $setup->courses->pluck('code')->implode('-')),
            $setup->semester,
            str_replace(['/', '-'], '_', $setup->academic_year)
        );

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($setup) {
            $output = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 compatibility
            fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Section 1: Setup Info (for reference when importing)
            fputcsv($output, ['# ACADEMIC SETUP CONFIGURATION EXPORT']);
            fputcsv($output, ['# Generated on: ' . now()->format('Y-m-d H:i:s')]);
            fputcsv($output, []);
            fputcsv($output, ['[SETUP INFO]']);
            fputcsv($output, ['Department', $setup->department?->name ?? 'N/A']);
            fputcsv($output, ['Courses', $setup->courses->pluck('code')->implode(', ')]);
            fputcsv($output, ['Curriculum', $setup->curriculum_name]);
            fputcsv($output, ['Academic Year', $setup->academic_year]);
            fputcsv($output, ['Semester', $setup->semester]);
            fputcsv($output, []);

            // Section 2: Year Levels with Subjects
            fputcsv($output, ['[SUBJECTS BY YEAR LEVEL]']);
            fputcsv($output, [
                'Year Level',
                'Subject Code',
                'Subject Name',
                'Block Number',
                'Course Codes',
                'Expected Students',
                'Needs Lab',
                'Preferred Lec Room',
                'Preferred Lab Room',
                'Assigned Faculty Email',
                'Assigned Faculty Name',
                'Parallel Subject Codes', // Codes of parallel subjects (same content, different codes)
            ]);

            foreach ($setup->yearLevels as $yearLevel) {
                foreach ($yearLevel->subjects as $subject) {
                    $facultyAssignment = $subject->facultyAssignments->first();
                    $courseCodes = $subject->courses->pluck('code')->implode('+') ?: 'GE';

                    // Get parallel subject codes (if any)
                    $parallelSubjectCodes = '';
                    if (!empty($subject->parallel_subject_ids)) {
                        $parallelSubjects = Subject::whereIn('id', $subject->parallel_subject_ids)->pluck('code');
                        $parallelSubjectCodes = $parallelSubjects->implode('+');
                    }

                    fputcsv($output, [
                        $yearLevel->year_level,
                        $subject->subject?->code ?? 'UNKNOWN',
                        $subject->subject?->name ?? 'Unknown Subject',
                        $subject->block_number ?? 1,
                        $courseCodes,
                        $subject->expected_students,
                        $subject->needs_lab ? 'Yes' : 'No',
                        $subject->preferredLectureRoom?->name ?? '',
                        $subject->preferredLabRoom?->name ?? '',
                        $facultyAssignment?->user?->email ?? '',
                        $facultyAssignment?->user ? ($facultyAssignment->user->lname . ', ' . $facultyAssignment->user->fname) : 'TBA',
                        $parallelSubjectCodes,
                    ]);
                }
            }
            fputcsv($output, []);

            // Section 3: Faculty Pool
            fputcsv($output, ['[FACULTY POOL]']);
            fputcsv($output, [
                'Faculty Email',
                'Faculty Name',
                'Max Units',
                'Preferred Day Off',
                'Preferred Time Period',
            ]);

            foreach ($setup->faculty as $faculty) {
                fputcsv($output, [
                    $faculty->user?->email ?? 'UNKNOWN',
                    $faculty->user ? ($faculty->user->lname . ', ' . $faculty->user->fname) : 'Unknown',
                    $faculty->max_units,
                    ucfirst($faculty->preferred_day_off ?? 'None'),
                    ucfirst($faculty->preferred_time_period ?? 'None'),
                ]);
            }

            fclose($output);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export multiple academic setups to a ZIP file containing CSV files.
     */
    public function exportBulkCsv(Request $request)
    {
        $request->validate([
            'setup_ids' => ['required', 'array', 'min:1'],
            'setup_ids.*' => ['exists:academic_setups,id'],
        ]);

        $setups = AcademicSetup::with([
            'department',
            'courses',
            'yearLevels.subjects.subject',
            'yearLevels.subjects.courses',
            'yearLevels.subjects.facultyAssignments.user',
            'yearLevels.subjects.preferredLectureRoom',
            'yearLevels.subjects.preferredLabRoom',
            'faculty.user',
        ])->whereIn('id', $request->setup_ids)->get();

        if ($setups->isEmpty()) {
            return back()->with('error', 'No setups found to export.');
        }

        // If only one setup, just return the single CSV
        if ($setups->count() === 1) {
            return $this->exportCsv($setups->first());
        }

        // Create a ZIP file with multiple CSVs
        $zipFileName = 'academic-setups-export-' . now()->format('Y-m-d-His') . '.zip';
        $tempZipPath = storage_path('app/temp/' . $zipFileName);

        // Ensure temp directory exists
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($tempZipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return back()->with('error', 'Failed to create export file.');
        }

        foreach ($setups as $setup) {
            $csvContent = $this->generateCsvContent($setup);
            $csvFileName = sprintf(
                'academic-setup_%s_%s_%s.csv',
                str_replace([' ', ','], ['_', '-'], $setup->courses->pluck('code')->implode('-')),
                $setup->semester,
                str_replace(['/', '-'], '_', $setup->academic_year)
            );
            $zip->addFromString($csvFileName, $csvContent);
        }

        $zip->close();

        return response()->download($tempZipPath, $zipFileName, [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Generate CSV content for a setup (helper for bulk export).
     */
    private function generateCsvContent(AcademicSetup $setup): string
    {
        $output = fopen('php://temp', 'r+');

        // Add BOM for Excel UTF-8 compatibility
        fwrite($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // Section 1: Setup Info
        fputcsv($output, ['# ACADEMIC SETUP CONFIGURATION EXPORT']);
        fputcsv($output, ['# Generated on: ' . now()->format('Y-m-d H:i:s')]);
        fputcsv($output, []);
        fputcsv($output, ['[SETUP INFO]']);
        fputcsv($output, ['Department', $setup->department?->name ?? 'N/A']);
        fputcsv($output, ['Courses', $setup->courses->pluck('code')->implode(', ')]);
        fputcsv($output, ['Curriculum', $setup->curriculum_name]);
        fputcsv($output, ['Academic Year', $setup->academic_year]);
        fputcsv($output, ['Semester', $setup->semester]);
        fputcsv($output, []);

        // Section 2: Year Levels with Subjects
        fputcsv($output, ['[SUBJECTS BY YEAR LEVEL]']);
        fputcsv($output, [
            'Year Level',
            'Subject Code',
            'Subject Name',
            'Block Number',
            'Course Codes',
            'Expected Students',
            'Needs Lab',
            'Preferred Lec Room',
            'Preferred Lab Room',
            'Assigned Faculty Email',
            'Assigned Faculty Name',
        ]);

        foreach ($setup->yearLevels as $yearLevel) {
            foreach ($yearLevel->subjects as $subject) {
                $facultyAssignment = $subject->facultyAssignments->first();
                $courseCodes = $subject->courses->pluck('code')->implode('+') ?: 'GE';

                fputcsv($output, [
                    $yearLevel->year_level,
                    $subject->subject?->code ?? 'UNKNOWN',
                    $subject->subject?->name ?? 'Unknown Subject',
                    $subject->block_number ?? 1,
                    $courseCodes,
                    $subject->expected_students,
                    $subject->needs_lab ? 'Yes' : 'No',
                    $subject->preferredLectureRoom?->name ?? '',
                    $subject->preferredLabRoom?->name ?? '',
                    $facultyAssignment?->user?->email ?? '',
                    $facultyAssignment?->user ? ($facultyAssignment->user->lname . ', ' . $facultyAssignment->user->fname) : 'TBA',
                ]);
            }
        }
        fputcsv($output, []);

        // Section 3: Faculty Pool
        fputcsv($output, ['[FACULTY POOL]']);
        fputcsv($output, [
            'Faculty Email',
            'Faculty Name',
            'Max Units',
            'Preferred Day Off',
            'Preferred Time Period',
        ]);

        foreach ($setup->faculty as $faculty) {
            fputcsv($output, [
                $faculty->user?->email ?? 'UNKNOWN',
                $faculty->user ? ($faculty->user->lname . ', ' . $faculty->user->fname) : 'Unknown',
                $faculty->max_units,
                ucfirst($faculty->preferred_day_off ?? 'None'),
                ucfirst($faculty->preferred_time_period ?? 'None'),
            ]);
        }

        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);

        return $content;
    }

    /**
     * Validate and preview CSV import data.
     * Returns warnings for any subjects or faculty that don't exist in the database.
     */
    public function validateImport(AcademicSetup $setup, Request $request)
    {
        try {
            $request->validate([
                'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            ]);

            $file = $request->file('file');
            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file was uploaded.',
                ], 400);
            }

            $path = $file->getRealPath();

            // Parse the CSV file
            $data = $this->parseCsvFile($path);

            // Get course IDs from the setup
            $courseIds = $setup->courses->pluck('id')->toArray();

            // Validate subjects
            $subjectWarnings = [];
            $subjectsToImport = [];
            $existingSubjectCodes = Subject::where('is_active', true)
                ->where(function ($query) use ($courseIds) {
                    $query->whereIn('course_id', $courseIds)
                        ->orWhereNull('course_id')
                        ->orWhereHas('courses', function ($q) use ($courseIds) {
                            $q->whereIn('courses.id', $courseIds);
                        });
                })
                ->pluck('code')
                ->toArray();

            $parallelSubjectWarnings = [];
            foreach ($data['subjects'] as $row) {
                if (!in_array($row['subject_code'], $existingSubjectCodes)) {
                    $subjectWarnings[] = [
                        'code' => $row['subject_code'],
                        'name' => $row['subject_name'],
                        'year_level' => $row['year_level'],
                        'reason' => 'Subject not found in database or not available for this course',
                    ];
                } else {
                    // Validate parallel subject codes if present
                    if (!empty($row['parallel_subject_codes'])) {
                        $parallelCodes = array_filter(array_map('trim', explode('+', $row['parallel_subject_codes'])));
                        $missingParallel = [];
                        foreach ($parallelCodes as $pCode) {
                            if (!in_array($pCode, $existingSubjectCodes)) {
                                $missingParallel[] = $pCode;
                            }
                        }
                        if (!empty($missingParallel)) {
                            $parallelSubjectWarnings[] = [
                                'subject_code' => $row['subject_code'],
                                'parallel_codes' => implode(', ', $missingParallel),
                                'year_level' => $row['year_level'],
                                'reason' => 'Some parallel subject codes not found - will be skipped',
                            ];
                        }
                        // Add parallel info to subject row
                        $row['has_parallel'] = true;
                        $row['parallel_codes_display'] = $row['parallel_subject_codes'];
                    }
                    $subjectsToImport[] = $row;
                }
            }

            // Validate faculty
            $facultyWarnings = [];
            $facultyToImport = [];
            $existingFacultyEmails = User::where('is_active', true)
                ->whereIn('user_type', ['faculty', 'admin'])
                ->pluck('email')
                ->toArray();

            foreach ($data['faculty'] as $row) {
                if (!empty($row['email']) && !in_array($row['email'], $existingFacultyEmails)) {
                    $facultyWarnings[] = [
                        'email' => $row['email'],
                        'name' => $row['name'],
                        'reason' => 'Faculty not found in database or is not active',
                    ];
                } else {
                    $facultyToImport[] = $row;
                }
            }

            // Check for faculty assignments in subjects that reference missing faculty
            $assignmentWarnings = [];
            foreach ($data['subjects'] as $row) {
                if (!empty($row['faculty_email']) && !in_array($row['faculty_email'], $existingFacultyEmails)) {
                    $assignmentWarnings[] = [
                        'subject_code' => $row['subject_code'],
                        'faculty_email' => $row['faculty_email'],
                        'faculty_name' => $row['faculty_name'],
                        'year_level' => $row['year_level'],
                        'reason' => 'Assigned faculty not found - will be set to TBA',
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'summary' => [
                    'total_subjects' => count($data['subjects']),
                    'valid_subjects' => count($subjectsToImport),
                    'invalid_subjects' => count($subjectWarnings),
                    'total_faculty' => count($data['faculty']),
                    'valid_faculty' => count($facultyToImport),
                    'invalid_faculty' => count($facultyWarnings),
                    'assignment_warnings' => count($assignmentWarnings),
                    'parallel_warnings' => count($parallelSubjectWarnings),
                ],
                'warnings' => [
                    'subjects' => $subjectWarnings,
                    'faculty' => $facultyWarnings,
                    'assignments' => $assignmentWarnings,
                    'parallel_subjects' => $parallelSubjectWarnings,
                ],
                'preview' => [
                    'subjects' => array_slice($subjectsToImport, 0, 10),
                    'faculty' => array_slice($facultyToImport, 0, 10),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error validating file: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import academic setup configuration from CSV.
     */
    public function importCsv(AcademicSetup $setup, Request $request)
    {
        try {
            $request->validate([
                'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
                'skip_invalid' => ['nullable', 'in:true,false,1,0,yes,no'],
            ]);

            $file = $request->file('file');
            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file was uploaded.',
                ], 400);
            }

            $path = $file->getRealPath();
            $skipInvalid = $request->boolean('skip_invalid', true);

            // Parse the CSV file
            $data = $this->parseCsvFile($path);

            // Get course IDs from the setup
            $courseIds = $setup->courses->pluck('id')->toArray();
            $courseCodeToId = Course::whereIn('id', $courseIds)->pluck('id', 'code')->toArray();

            // Get existing subjects and faculty
            $existingSubjects = Subject::where('is_active', true)
                ->where(function ($query) use ($courseIds) {
                    $query->whereIn('course_id', $courseIds)
                        ->orWhereNull('course_id')
                        ->orWhereHas('courses', function ($q) use ($courseIds) {
                            $q->whereIn('courses.id', $courseIds);
                        });
                })
                ->get()
                ->keyBy('code');

            $existingFaculty = User::where('is_active', true)
                ->whereIn('user_type', ['faculty', 'admin'])
                ->get()
                ->keyBy('email');

            // Get rooms for preferred room lookup by name
            $roomsByName = Room::where('is_active', true)
                ->get()
                ->keyBy('name');

            $importedSubjects = 0;
            $importedFaculty = 0;
            $skippedSubjects = [];
            $skippedFaculty = [];
            $assignmentsToCreate = [];

            // Import faculty pool first
            foreach ($data['faculty'] as $row) {
                if (empty($row['email'])) continue;

                $user = $existingFaculty->get($row['email']);
                if (!$user) {
                    if (!$skipInvalid) {
                        return redirect()->back()->with('error', "Faculty not found: {$row['email']}. Import cancelled.");
                    }
                    $skippedFaculty[] = $row['email'];
                    continue;
                }

                // Check if already in the faculty pool
                $exists = $setup->faculty()->where('user_id', $user->id)->exists();
                if (!$exists) {
                    AcademicSetupFaculty::create([
                        'academic_setup_id' => $setup->id,
                        'user_id' => $user->id,
                        'max_units' => $row['max_units'] ?? 24,
                        'preferred_day_off' => strtolower($row['day_off']) !== 'none' ? strtolower($row['day_off']) : null,
                        'preferred_time_period' => strtolower($row['time_period']) !== 'none' ? strtolower($row['time_period']) : null,
                    ]);
                    $importedFaculty++;
                }
            }

            // Import subjects by year level
            $yearLevelMap = $setup->yearLevels->keyBy('year_level');

            foreach ($data['subjects'] as $row) {
                $subject = $existingSubjects->get($row['subject_code']);
                if (!$subject) {
                    if (!$skipInvalid) {
                        return redirect()->back()->with('error', "Subject not found: {$row['subject_code']}. Import cancelled.");
                    }
                    $skippedSubjects[] = $row['subject_code'];
                    continue;
                }

                $yearLevel = $yearLevelMap->get($row['year_level']);
                if (!$yearLevel) {
                    $skippedSubjects[] = "{$row['subject_code']} (year level {$row['year_level']} not in setup)";
                    continue;
                }

                // Parse course codes and convert to IDs
                $courseCodesArray = array_filter(array_map('trim', explode('+', $row['course_codes'])));
                $blockCourseIds = [];
                foreach ($courseCodesArray as $code) {
                    if ($code !== 'GE' && isset($courseCodeToId[$code])) {
                        $blockCourseIds[] = $courseCodeToId[$code];
                    }
                }

                // Check if this subject-block-course combination already exists
                $exists = AcademicSetupSubject::where('year_level_id', $yearLevel->id)
                    ->where('subject_id', $subject->id)
                    ->where('block_number', $row['block_number'])
                    ->exists();

                if (!$exists) {
                    // Look up preferred room IDs by name
                    $preferredLecRoomId = null;
                    $preferredLabRoomId = null;

                    if (!empty($row['preferred_lec_room'])) {
                        $lecRoom = $roomsByName->get($row['preferred_lec_room']);
                        if ($lecRoom) {
                            $preferredLecRoomId = $lecRoom->id;
                        }
                    }

                    if (!empty($row['preferred_lab_room'])) {
                        $labRoom = $roomsByName->get($row['preferred_lab_room']);
                        if ($labRoom) {
                            $preferredLabRoomId = $labRoom->id;
                        }
                    }

                    // Parse parallel subject codes and convert to IDs
                    $parallelSubjectIds = [];
                    if (!empty($row['parallel_subject_codes'])) {
                        $parallelCodes = array_filter(array_map('trim', explode('+', $row['parallel_subject_codes'])));
                        foreach ($parallelCodes as $pCode) {
                            $parallelSubject = $existingSubjects->get($pCode);
                            if ($parallelSubject) {
                                $parallelSubjectIds[] = $parallelSubject->id;
                            }
                        }
                    }

                    $setupSubject = AcademicSetupSubject::create([
                        'academic_setup_id' => $setup->id,
                        'year_level_id' => $yearLevel->id,
                        'subject_id' => $subject->id,
                        'course_id' => !empty($blockCourseIds) ? $blockCourseIds[0] : null,
                        'block_number' => $row['block_number'] ?? 1,
                        'expected_students' => $row['expected_students'] ?? $yearLevel->expected_students,
                        'needs_lab' => strtolower($row['needs_lab'] ?? 'no') === 'yes',
                        'preferred_lecture_room_id' => $preferredLecRoomId,
                        'preferred_lab_room_id' => $preferredLabRoomId,
                        'parallel_subject_ids' => !empty($parallelSubjectIds) ? $parallelSubjectIds : null,
                    ]);

                    // Attach courses
                    if (!empty($blockCourseIds)) {
                        $setupSubject->courses()->attach($blockCourseIds);
                    }

                    $importedSubjects++;

                    // Queue assignment if faculty is specified and exists
                    if (!empty($row['faculty_email'])) {
                        $facultyUser = $existingFaculty->get($row['faculty_email']);
                        if ($facultyUser) {
                            $assignmentsToCreate[] = [
                                'academic_setup_id' => $setup->id,
                                'academic_setup_subject_id' => $setupSubject->id,
                                'user_id' => $facultyUser->id,
                            ];
                        }
                    }
                }
            }

            // Create assignments
            foreach ($assignmentsToCreate as $assignment) {
                SubjectFacultyAssignment::create($assignment);
            }

            $message = "Import completed. {$importedSubjects} subjects and {$importedFaculty} faculty imported.";
            if (!empty($skippedSubjects)) {
                $message .= " Skipped " . count($skippedSubjects) . " subjects.";
            }
            if (!empty($skippedFaculty)) {
                $message .= " Skipped " . count($skippedFaculty) . " faculty.";
            }

            // Return JSON for AJAX requests, redirect otherwise
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'imported' => [
                        'subjects' => $importedSubjects,
                        'faculty' => $importedFaculty,
                    ],
                    'skipped' => [
                        'subjects' => $skippedSubjects,
                        'faculty' => $skippedFaculty,
                    ],
                ]);
            }

            // Redirect to the configure page with the first year level
            $firstYearLevel = $setup->yearLevels()->first();
            $yearLevelParam = $firstYearLevel ? $firstYearLevel->year_level : '1st';

            return redirect()->route('academic-setup.configure', ['setup' => $setup->id, 'year' => $yearLevelParam])
                ->with('success', $message);
        } catch (\Exception $e) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error importing: ' . $e->getMessage(),
                ], 500);
            }
            return redirect()->back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Parse a CSV file and extract subjects and faculty data.
     */
    private function parseCsvFile(string $path): array
    {
        $subjects = [];
        $faculty = [];
        $currentSection = null;
        $headers = [];

        if (($handle = fopen($path, 'r')) !== false) {
            // Skip BOM if present
            $bom = fread($handle, 3);
            if ($bom !== chr(0xEF) . chr(0xBB) . chr(0xBF)) {
                rewind($handle);
            }

            while (($row = fgetcsv($handle)) !== false) {
                // Skip empty rows
                if (empty($row) || (count($row) === 1 && empty($row[0]))) {
                    continue;
                }

                $firstCell = trim($row[0] ?? '');

                // Skip comment lines
                if (str_starts_with($firstCell, '#')) {
                    continue;
                }

                // Detect section headers
                if ($firstCell === '[SUBJECTS BY YEAR LEVEL]') {
                    $currentSection = 'subjects';
                    $headers = [];
                    continue;
                }
                if ($firstCell === '[FACULTY POOL]') {
                    $currentSection = 'faculty';
                    $headers = [];
                    continue;
                }
                if ($firstCell === '[SETUP INFO]') {
                    $currentSection = 'info';
                    continue;
                }

                // Skip if no section yet
                if ($currentSection === null || $currentSection === 'info') {
                    continue;
                }

                // Handle headers
                if (empty($headers)) {
                    $headers = array_map('trim', $row);
                    continue;
                }

                // Parse data rows
                if ($currentSection === 'subjects') {
                    $subjects[] = [
                        'year_level' => trim($row[0] ?? ''),
                        'subject_code' => trim($row[1] ?? ''),
                        'subject_name' => trim($row[2] ?? ''),
                        'block_number' => (int) ($row[3] ?? 1),
                        'course_codes' => trim($row[4] ?? 'GE'),
                        'expected_students' => (int) ($row[5] ?? 40),
                        'needs_lab' => trim($row[6] ?? 'No'),
                        'preferred_lec_room' => trim($row[7] ?? ''),
                        'preferred_lab_room' => trim($row[8] ?? ''),
                        'faculty_email' => trim($row[9] ?? ''),
                        'faculty_name' => trim($row[10] ?? ''),
                        'parallel_subject_codes' => trim($row[11] ?? ''), // Parallel subject codes (e.g., "ITP3+CSC1")
                    ];
                } elseif ($currentSection === 'faculty') {
                    $faculty[] = [
                        'email' => trim($row[0] ?? ''),
                        'name' => trim($row[1] ?? ''),
                        'max_units' => (int) ($row[2] ?? 24),
                        'day_off' => trim($row[3] ?? 'None'),
                        'time_period' => trim($row[4] ?? 'None'),
                    ];
                }
            }
            fclose($handle);
        }

        return [
            'subjects' => $subjects,
            'faculty' => $faculty,
        ];
    }

    /**
     * Parse setup info from CSV file.
     */
    private function parseSetupInfo(string $path): array
    {
        $info = [
            'department' => '',
            'courses' => '',
            'curriculum' => '',
            'academic_year' => '',
            'semester' => '',
        ];

        if (($handle = fopen($path, 'r')) !== false) {
            // Skip BOM if present
            $bom = fread($handle, 3);
            if ($bom !== chr(0xEF) . chr(0xBB) . chr(0xBF)) {
                rewind($handle);
            }

            $inInfoSection = false;

            while (($row = fgetcsv($handle)) !== false) {
                $firstCell = trim($row[0] ?? '');

                if ($firstCell === '[SETUP INFO]') {
                    $inInfoSection = true;
                    continue;
                }

                if (str_starts_with($firstCell, '[') && $firstCell !== '[SETUP INFO]') {
                    $inInfoSection = false;
                }

                if ($inInfoSection && count($row) >= 2) {
                    $key = strtolower(trim($row[0]));
                    $value = trim($row[1] ?? '');

                    if ($key === 'department') $info['department'] = $value;
                    if ($key === 'courses') $info['courses'] = $value;
                    if ($key === 'curriculum') $info['curriculum'] = $value;
                    if ($key === 'academic year') $info['academic_year'] = $value;
                    if ($key === 'semester') $info['semester'] = $value;
                }
            }
            fclose($handle);
        }

        return $info;
    }

    /**
     * Validate CSV for creating a new academic setup.
     */
    public function validateNewImport(Request $request)
    {
        try {
            $request->validate([
                'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            ]);

            $file = $request->file('file');
            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file was uploaded.',
                ], 400);
            }

            $path = $file->getRealPath();

            // Parse setup info and data
            $setupInfo = $this->parseSetupInfo($path);
            $data = $this->parseCsvFile($path);

            // Validate subjects - check if they exist in the database
            $subjectWarnings = [];
            $subjectsToImport = [];
            $parallelSubjectWarnings = [];
            $existingSubjectCodes = Subject::where('is_active', true)->pluck('code')->toArray();

            foreach ($data['subjects'] as $row) {
                if (!in_array($row['subject_code'], $existingSubjectCodes)) {
                    $subjectWarnings[] = [
                        'code' => $row['subject_code'],
                        'name' => $row['subject_name'],
                        'year_level' => $row['year_level'],
                        'reason' => 'Subject not found in database',
                    ];
                } else {
                    // Validate parallel subject codes if present
                    if (!empty($row['parallel_subject_codes'])) {
                        $parallelCodes = array_filter(array_map('trim', explode('+', $row['parallel_subject_codes'])));
                        $missingParallel = [];
                        foreach ($parallelCodes as $pCode) {
                            if (!in_array($pCode, $existingSubjectCodes)) {
                                $missingParallel[] = $pCode;
                            }
                        }
                        if (!empty($missingParallel)) {
                            $parallelSubjectWarnings[] = [
                                'subject_code' => $row['subject_code'],
                                'parallel_codes' => implode(', ', $missingParallel),
                                'year_level' => $row['year_level'],
                                'reason' => 'Some parallel subject codes not found - will be skipped',
                            ];
                        }
                        $row['has_parallel'] = true;
                        $row['parallel_codes_display'] = $row['parallel_subject_codes'];
                    }
                    $subjectsToImport[] = $row;
                }
            }

            // Validate faculty
            $facultyWarnings = [];
            $facultyToImport = [];
            $existingFacultyEmails = User::where('is_active', true)
                ->whereIn('user_type', ['faculty', 'admin'])
                ->pluck('email')
                ->toArray();

            foreach ($data['faculty'] as $row) {
                if (!empty($row['email']) && !in_array($row['email'], $existingFacultyEmails)) {
                    $facultyWarnings[] = [
                        'email' => $row['email'],
                        'name' => $row['name'],
                        'reason' => 'Faculty not found in database or is not active',
                    ];
                } else {
                    $facultyToImport[] = $row;
                }
            }

            // Check for faculty assignments in subjects that reference missing faculty
            $assignmentWarnings = [];
            foreach ($data['subjects'] as $row) {
                if (!empty($row['faculty_email']) && !in_array($row['faculty_email'], $existingFacultyEmails)) {
                    $assignmentWarnings[] = [
                        'subject_code' => $row['subject_code'],
                        'faculty_email' => $row['faculty_email'],
                        'faculty_name' => $row['faculty_name'],
                        'year_level' => $row['year_level'],
                        'reason' => 'Assigned faculty not found - will be set to TBA',
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'parsed_info' => [
                    'department' => $setupInfo['department'],
                    'courses' => $setupInfo['courses'],
                    'curriculum' => $setupInfo['curriculum'],
                    'academic_year' => $setupInfo['academic_year'],
                    'semester' => $setupInfo['semester'],
                    'subjects_count' => count($data['subjects']),
                    'faculty_count' => count($data['faculty']),
                ],
                'summary' => [
                    'total_subjects' => count($data['subjects']),
                    'valid_subjects' => count($subjectsToImport),
                    'invalid_subjects' => count($subjectWarnings),
                    'total_faculty' => count($data['faculty']),
                    'valid_faculty' => count($facultyToImport),
                    'invalid_faculty' => count($facultyWarnings),
                    'assignment_warnings' => count($assignmentWarnings),
                    'parallel_warnings' => count($parallelSubjectWarnings),
                ],
                'warnings' => [
                    'subjects' => $subjectWarnings,
                    'faculty' => $facultyWarnings,
                    'assignments' => $assignmentWarnings,
                    'parallel_subjects' => $parallelSubjectWarnings,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error validating file: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import CSV and create a new academic setup.
     */
    public function importNew(Request $request)
    {
        try {
            $request->validate([
                'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
                'skip_invalid' => ['nullable', 'in:true,false,1,0,yes,no'],
            ]);

            $file = $request->file('file');
            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file was uploaded.',
                ], 400);
            }

            $path = $file->getRealPath();
            $skipInvalid = $request->boolean('skip_invalid', true);

            // Parse setup info and data
            $setupInfo = $this->parseSetupInfo($path);
            $data = $this->parseCsvFile($path);

            // Get courses from the CSV
            $courseCodes = array_filter(array_map('trim', explode(',', $setupInfo['courses'])));
            $courses = Course::whereIn('code', $courseCodes)->get();

            if ($courses->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No matching courses found for: ' . $setupInfo['courses'],
                ], 422);
            }

            // Get department from first course
            $department = $courses->first()->department;

            // Get unique year levels from subjects
            $yearLevels = collect($data['subjects'])
                ->pluck('year_level')
                ->unique()
                ->values()
                ->toArray();

            if (empty($yearLevels)) {
                $yearLevels = ['1st', '2nd', '3rd', '4th'];
            }

            // Create the academic setup
            $setup = AcademicSetup::create([
                'department_id' => $department?->id,
                'curriculum_name' => $setupInfo['curriculum'] ?: 'Imported Curriculum',
                'academic_year' => $setupInfo['academic_year'] ?: now()->year . '-' . (now()->year + 1),
                'semester' => $setupInfo['semester'] ?: '1st',
                'status' => 'configuring',
                'created_by' => Auth::id(),
            ]);

            // Attach courses
            $setup->courses()->attach($courses->pluck('id'));

            // Create year levels
            foreach ($yearLevels as $index => $yearLevel) {
                AcademicSetupYearLevel::create([
                    'academic_setup_id' => $setup->id,
                    'year_level' => $yearLevel,
                    'section_count' => 1,
                    'expected_students' => 40,
                    'is_configured' => false,
                ]);
            }

            // Re-fetch year levels
            $yearLevelMap = $setup->yearLevels()->get()->keyBy('year_level');

            // Get existing subjects and faculty
            $existingSubjects = Subject::all()->keyBy('code');
            $existingFaculty = User::where('is_active', true)
                ->whereIn('user_type', ['faculty', 'admin'])
                ->get()
                ->keyBy('email');

            $courseCodeToId = $courses->pluck('id', 'code')->toArray();

            $importedSubjects = 0;
            $importedFaculty = 0;
            $skippedSubjects = [];
            $skippedFaculty = [];
            $assignmentsToCreate = [];

            // Import faculty pool first
            foreach ($data['faculty'] as $row) {
                if (empty($row['email'])) continue;

                $user = $existingFaculty->get($row['email']);
                if (!$user) {
                    if ($request->boolean('create_missing_faculty')) {
                        // Create missing faculty account
                        $nameParts = explode(',', $row['name']);
                        $lname = trim($nameParts[0]);
                        $fname = isset($nameParts[1]) ? trim($nameParts[1]) : '.';

                        $user = User::create([
                            'fname' => $fname,
                            'lname' => $lname,
                            'email' => $row['email'],
                            'password' => Hash::make('password'), // Default password
                            'user_type' => 'faculty',
                            'is_active' => true,
                            'approval_status' => 'approved',
                            'approved_at' => now(),
                            'department_id' => $setup->department_id,
                        ]);

                        // Add to lookup to handle subsequent references
                        $existingFaculty->put($user->email, $user);
                    } elseif (!$skipInvalid) {
                        $setup->delete();
                        return response()->json([
                            'success' => false,
                            'message' => "Faculty not found: {$row['email']}. Import cancelled.",
                        ], 422);
                    } else {
                        $skippedFaculty[] = $row['email'];
                        continue;
                    }
                }

                AcademicSetupFaculty::create([
                    'academic_setup_id' => $setup->id,
                    'user_id' => $user->id,
                    'max_units' => $row['max_units'] ?? 24,
                    'preferred_day_off' => strtolower($row['day_off']) !== 'none' ? strtolower($row['day_off']) : null,
                    'preferred_time_period' => strtolower($row['time_period']) !== 'none' ? strtolower($row['time_period']) : null,
                ]);
                $importedFaculty++;
            }

            // Import subjects by year level
            foreach ($data['subjects'] as $row) {
                $subject = $existingSubjects->get($row['subject_code']);
                if (!$subject) {
                    if ($request->boolean('create_missing_subjects')) {
                        // Create missing subject with defaults
                        $subject = Subject::create([
                            'code' => $row['subject_code'],
                            'name' => $row['subject_name'],
                            'units' => 3,
                            'lecture_hours' => 3,
                            'lab_hours' => 0,
                            'is_active' => true,
                        ]);
                        $existingSubjects->put($subject->code, $subject);
                    } elseif (!$skipInvalid) {
                        $setup->delete();
                        return response()->json([
                            'success' => false,
                            'message' => "Subject not found: {$row['subject_code']}. Import cancelled.",
                        ], 422);
                    } else {
                        $skippedSubjects[] = $row['subject_code'];
                        continue;
                    }
                } else {
                    // Subject exists, ensure it is active
                    if (!$subject->is_active) {
                        $subject->update(['is_active' => true]);
                    }
                }

                $yearLevel = $yearLevelMap->get($row['year_level']);
                if (!$yearLevel) {
                    // Create year level if it doesn't exist
                    $yearLevel = AcademicSetupYearLevel::create([
                        'academic_setup_id' => $setup->id,
                        'year_level' => $row['year_level'],
                        'section_count' => 1,
                        'expected_students' => 40,
                        'is_configured' => false,
                    ]);
                    $yearLevelMap->put($row['year_level'], $yearLevel);
                }

                // Parse course codes and convert to IDs
                $courseCodesArray = array_filter(array_map('trim', explode('+', $row['course_codes'])));
                $blockCourseIds = [];
                foreach ($courseCodesArray as $code) {
                    if ($code !== 'GE' && isset($courseCodeToId[$code])) {
                        $blockCourseIds[] = $courseCodeToId[$code];
                    }
                }

                // Parse parallel subject codes and convert to IDs
                $parallelSubjectIds = [];
                if (!empty($row['parallel_subject_codes'])) {
                    $parallelCodes = array_filter(array_map('trim', explode('+', $row['parallel_subject_codes'])));
                    foreach ($parallelCodes as $pCode) {
                        $parallelSubject = $existingSubjects->get($pCode);
                        if ($parallelSubject) {
                            $parallelSubjectIds[] = $parallelSubject->id;
                        }
                    }
                }

                $setupSubject = AcademicSetupSubject::create([
                    'academic_setup_id' => $setup->id,
                    'year_level_id' => $yearLevel->id,
                    'subject_id' => $subject->id,
                    'course_id' => !empty($blockCourseIds) ? $blockCourseIds[0] : null,
                    'block_number' => $row['block_number'] ?? 1,
                    'expected_students' => $row['expected_students'] ?? $yearLevel->expected_students,
                    'needs_lab' => strtolower($row['needs_lab'] ?? 'no') === 'yes',
                    'parallel_subject_ids' => !empty($parallelSubjectIds) ? $parallelSubjectIds : null,
                ]);

                // Attach courses
                if (!empty($blockCourseIds)) {
                    $setupSubject->courses()->attach($blockCourseIds);
                }

                $importedSubjects++;

                // Queue assignment if faculty is specified and exists
                if (!empty($row['faculty_email'])) {
                    $facultyUser = $existingFaculty->get($row['faculty_email']);
                    if ($facultyUser) {
                        $assignmentsToCreate[] = [
                            'academic_setup_id' => $setup->id,
                            'academic_setup_subject_id' => $setupSubject->id,
                            'user_id' => $facultyUser->id,
                        ];
                    }
                }
            }

            // Create assignments
            foreach ($assignmentsToCreate as $assignment) {
                SubjectFacultyAssignment::create($assignment);
            }

            $message = "Import completed. Created new setup with {$importedSubjects} subjects and {$importedFaculty} faculty.";
            if (!empty($skippedSubjects)) {
                $message .= " Skipped " . count($skippedSubjects) . " subjects.";
            }
            if (!empty($skippedFaculty)) {
                $message .= " Skipped " . count($skippedFaculty) . " faculty.";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'setup_id' => $setup->id,
                'imported' => [
                    'subjects' => $importedSubjects,
                    'faculty' => $importedFaculty,
                ],
                'skipped' => [
                    'subjects' => $skippedSubjects,
                    'faculty' => $skippedFaculty,
                ],
            ]);
        } catch (\Exception $e) {
            // Clean up the setup if it was created
            if (isset($setup)) {
                $setup->delete();
            }
            return response()->json([
                'success' => false,
                'message' => 'Error importing: ' . $e->getMessage(),
            ], 500);
        }
    }
}
