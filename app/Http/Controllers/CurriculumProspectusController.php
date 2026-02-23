<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CurriculumProspectus;
use App\Models\Department;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CurriculumProspectusController extends Controller
{
    /**
     * Display a listing of curriculum prospectuses.
     */
    public function index(Request $request): Response
    {
        // We want to group by (department_id, academic_year).
        // First, get distinct combinations for pagination.
        $query = CurriculumProspectus::select('department_id', 'academic_year')
            ->distinct();

        // Apply filters to this distinct query
        $user = $request->user();
        if ($user && $user->isScheduler() && $user->department_id) {
            $query->where('department_id', $user->department_id);
        }

        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('academic_year') && $request->academic_year) {
            $query->where('academic_year', $request->academic_year);
        }

        // Note: filtering by course_id on the grouped level is tricky because a group might contain that course.
        // For simplicity, if filtering by course, we'll find groups that CONTAIN that course.
        if ($request->has('course_id') && $request->course_id) {
            $query->whereHas('course', function ($q) use ($request) {
                $q->where('id', $request->course_id);
            });
        }

        $groups = $query->orderBy('academic_year', 'desc')
            // We can't easily order by department name in a distinct query without joining.
            // For now, order by department_id is stable enough, or just simple sorting.
            ->orderBy('department_id')
            ->paginate(10)
            ->withQueryString();

        // Now populate the groups with actual data
        $groups->getCollection()->transform(function ($group) {
            $department = Department::find($group->department_id);

            $prospectuses = CurriculumProspectus::with(['course'])
                ->withCount('subjects')
                ->where('department_id', $group->department_id)
                ->where('academic_year', $group->academic_year)
                ->get();

            return [
                'department' => $department,
                'academic_year' => $group->academic_year,
                'prospectuses' => $prospectuses,
                'total_courses' => $prospectuses->count(),
                'total_subjects' => $prospectuses->sum('subjects_count'),
            ];
        });

        // Get filter options
        $departmentsQuery = Department::where('is_active', true)->orderBy('name');
        if ($user && $user->isScheduler() && $user->department_id) {
            $departmentsQuery->where('id', $user->department_id);
        }
        $departments = $departmentsQuery->get();

        $coursesQuery = Course::with('department')->where('is_active', true)->orderBy('code');
        if ($user && $user->isScheduler() && $user->department_id) {
            $coursesQuery->where('department_id', $user->department_id);
        }
        $courses = $coursesQuery->get();
        $academicYears = CurriculumProspectus::distinct()->pluck('academic_year')->sort()->values();

        return Inertia::render('prospectus/index', [
            'groupedProspectuses' => $groups,
            'departments' => $departments,
            'courses' => $courses,
            'academicYears' => $academicYears,
            'filters' => $request->only(['department_id', 'course_id', 'academic_year']),
        ]);
    }

    /**
     * Display a side-by-side view of a department's prospectus for a specific year.
     */
    public function departmentShow(string $departmentId, string $academicYear): Response
    {
        $department = Department::findOrFail($departmentId);

        $prospectuses = CurriculumProspectus::with(['course', 'subjects'])
            ->where('department_id', $departmentId)
            ->where('academic_year', $academicYear)
            ->get();

        // Organize data for the view
        // We need a union of all Year Levels and Semesters present across these prospectuses
        $maxYears = 0;
        foreach ($prospectuses as $p) {
            $years = $p->course->years ?? 4;
            if ($years > $maxYears) $maxYears = $years;
        }

        $structure = [];
        $yearLevels = ['1st', '2nd', '3rd', '4th', '5th'];
        $semesters = ['1st', '2nd', 'summer'];

        foreach ($yearLevels as $yIndex => $year) {
            if ($yIndex >= $maxYears) continue;

            foreach ($semesters as $sem) {
                // Check if any prospectus has subjects in this year/sem
                $hasContent = false;
                foreach ($prospectuses as $p) {
                    $count = $p->subjects()
                        ->wherePivot('year_level', $year)
                        ->wherePivot('semester', $sem)
                        ->count();
                    if ($count > 0) {
                        $hasContent = true;
                        break;
                    }
                }

                if ($hasContent) {
                    $structure[$year][$sem] = [];

                    // For each prospectus (column), get the subjects
                    foreach ($prospectuses as $p) {
                        $subjects = $p->subjects()
                            ->wherePivot('year_level', $year)
                            ->wherePivot('semester', $sem)
                            ->orderByPivot('sort_order')
                            ->get();

                        $structure[$year][$sem][$p->id] = [
                            'subjects' => $subjects,
                            'total_units' => $subjects->sum('units'),
                        ];
                    }
                }
            }
        }

        return Inertia::render('prospectus/department-show', [
            'department' => $department,
            'academicYear' => $academicYear,
            'prospectuses' => $prospectuses,
            'structure' => $structure,
        ]);
    }

    /**
     * Show the form for creating a new prospectus.
     */
    public function create(): Response
    {
        $departments = Department::where('is_active', true)->orderBy('name')->get();
        $courses = Course::with('department')->where('is_active', true)->orderBy('code')->get();

        return Inertia::render('prospectus/create', [
            'departments' => $departments,
            'courses' => $courses,
        ]);
    }

    /**
     * Store a newly created prospectus.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'course_id' => ['required', 'exists:courses,id'],
            'name' => ['required', 'string', 'max:255'],
            'academic_year' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
        ]);

        // Check for existing prospectus
        $existing = CurriculumProspectus::where('course_id', $validated['course_id'])
            ->where('academic_year', $validated['academic_year'])
            ->first();

        if ($existing) {
            return redirect()->back()->with('error', 'A prospectus for this course and academic year already exists.');
        }

        $prospectus = CurriculumProspectus::create($validated);

        return redirect()->route('prospectus.show', $prospectus)
            ->with('success', 'Prospectus created successfully. Now add subjects.');
    }

    /**
     * Display the specified prospectus with all subjects organized by year/semester.
     */
    public function show(CurriculumProspectus $prospectus): Response
    {
        $prospectus->load(['department', 'course', 'subjects']);

        // Organize subjects by year level and semester
        $organizedSubjects = [];
        $yearLevels = ['1st', '2nd', '3rd', '4th', '5th'];
        $semesters = ['1st', '2nd', 'summer'];

        // Get the course's number of years to determine which year levels to show
        $courseYears = $prospectus->course?->years ?? 4;

        foreach ($yearLevels as $index => $year) {
            // Skip year levels beyond course duration
            if ($index >= $courseYears) {
                continue;
            }

            $organizedSubjects[$year] = [];
            foreach ($semesters as $sem) {
                $subjects = $prospectus->subjects()
                    ->wherePivot('year_level', $year)
                    ->wherePivot('semester', $sem)
                    ->orderByPivot('sort_order')
                    ->get();

                $organizedSubjects[$year][$sem] = [
                    'subjects' => $subjects,
                    'total_units' => $subjects->sum('units'),
                    'total_lec_hours' => $subjects->sum('lecture_hours'),
                    'total_lab_hours' => $subjects->sum('lab_hours'),
                ];
            }
        }

        return Inertia::render('prospectus/show', [
            'prospectus' => $prospectus,
            'organizedSubjects' => $organizedSubjects,
            'courseYears' => $courseYears,
        ]);
    }

    /**
     * Show the form for editing the prospectus subjects.
     */
    public function edit(CurriculumProspectus $prospectus): Response
    {
        $prospectus->load(['department', 'course', 'subjects']);

        // Get course IDs to filter available subjects
        $courseId = $prospectus->course_id;

        // Get subjects available for this course
        $availableSubjects = Subject::with(['course', 'courses'])
            ->where('is_active', true)
            ->where(function ($query) use ($courseId) {
                // Include course-specific subjects
                $query->where('course_id', $courseId)
                    // Include GE subjects
                    ->orWhereNull('course_id')
                    // Include shared subjects
                    ->orWhereHas('courses', function ($q) use ($courseId) {
                        $q->where('courses.id', $courseId);
                    });
            })
            ->orderBy('code')
            ->get();

        // Get current subject assignments
        $currentSubjects = $prospectus->subjects()
            ->get()
            ->map(function ($subject) {
                return [
                    'subject_id' => $subject->id,
                    'year_level' => $subject->pivot->year_level,
                    'semester' => $subject->pivot->semester,
                    'sort_order' => $subject->pivot->sort_order,
                ];
            });

        $courseYears = $prospectus->course?->years ?? 4;

        return Inertia::render('prospectus/edit', [
            'prospectus' => $prospectus,
            'availableSubjects' => $availableSubjects,
            'currentSubjects' => $currentSubjects,
            'courseYears' => $courseYears,
        ]);
    }

    /**
     * Update the prospectus subjects.
     */
    public function update(CurriculumProspectus $prospectus, Request $request)
    {
        $validated = $request->validate([
            'subjects' => ['nullable', 'array'],
            'subjects.*.subject_id' => ['required', 'exists:subjects,id'],
            'subjects.*.year_level' => ['required', Rule::in(['1st', '2nd', '3rd', '4th', '5th'])],
            'subjects.*.semester' => ['required', Rule::in(['1st', '2nd', 'summer'])],
            'subjects.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        // Sync subjects with pivot data
        $syncData = [];
        if (!empty($validated['subjects'])) {
            foreach ($validated['subjects'] as $item) {
                $syncData[$item['subject_id']] = [
                    'year_level' => $item['year_level'],
                    'semester' => $item['semester'],
                    'sort_order' => $item['sort_order'] ?? 0,
                ];
            }
        }

        $prospectus->subjects()->sync($syncData);

        return redirect()->route('prospectus.show', $prospectus)
            ->with('success', 'Prospectus subjects updated successfully.');
    }

    /**
     * Update prospectus metadata.
     */
    public function updateInfo(CurriculumProspectus $prospectus, Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $prospectus->update($validated);

        return redirect()->back()->with('success', 'Prospectus information updated.');
    }

    /**
     * Delete a prospectus.
     */
    public function destroy(CurriculumProspectus $prospectus)
    {
        $prospectus->delete();

        return redirect()->route('prospectus.index')
            ->with('success', 'Prospectus deleted successfully.');
    }

    /**
     * Export prospectus subjects to CSV.
     */
    public function exportCsv(CurriculumProspectus $prospectus)
    {
        $filename = "prospectus_{$prospectus->course->code}_{$prospectus->academic_year}.csv";
        $subjects = $prospectus->subjects()
            ->orderByPivot('year_level')
            ->orderByPivot('semester')
            ->orderByPivot('sort_order')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function () use ($subjects) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Subject Code', 'Description', 'Units', 'Lec Hours', 'Lab Hours', 'Year Level', 'Semester', 'Sort Order']);

            foreach ($subjects as $subject) {
                fputcsv($file, [
                    $subject->code,
                    $subject->name,
                    $subject->units,
                    $subject->lecture_hours,
                    $subject->lab_hours,
                    $subject->pivot->year_level,
                    $subject->pivot->semester,
                    $subject->pivot->sort_order,
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Validate prospective CSV import.
     */
    public function validateImport(Request $request, CurriculumProspectus $prospectus)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('file');

        // Read file contents
        $content = file_get_contents($file->getRealPath());

        // Split into lines
        $lines = explode(PHP_EOL, $content);
        $data = array_map('str_getcsv', $lines);

        // Remove empty lines
        $data = array_filter($data, function ($row) {
            return $row && count($row) > 1 && implode('', $row) !== '';
        });

        if (empty($data)) {
            return response()->json(['valid' => false, 'message' => 'File is empty'], 422);
        }

        $header = array_shift($data);

        // Normalize headers
        $headerMap = [];
        foreach ($header as $index => $col) {
            $normalized = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $col)));
            $headerMap[$normalized] = $index;
        }

        // Check required columns
        $required = ['subjectcode', 'yearlevel', 'semester'];
        foreach ($required as $req) {
            if (!array_key_exists($req, $headerMap) && !array_key_exists('code', $headerMap)) {
                // Allow 'code' as alias for 'subjectcode'
                if ($req === 'subjectcode' && array_key_exists('code', $headerMap)) continue;

                return response()->json([
                    'valid' => false,
                    'message' => "Missing required column: " . ucfirst($req)
                ], 422);
            }
        }

        $missingSubjects = [];
        $rowsToProcess = [];
        $codeIdx = $headerMap['subjectcode'] ?? $headerMap['code'] ?? null;
        $descIdx = $headerMap['description'] ?? $headerMap['name'] ?? null;
        $unitsIdx = $headerMap['units'] ?? null;
        $lecIdx = $headerMap['lechours'] ?? $headerMap['lecturehours'] ?? null;
        $labIdx = $headerMap['labhours'] ?? $headerMap['laboratoryhours'] ?? null;

        foreach ($data as $row) {
            if (count($row) < count($headerMap)) continue;

            $code = trim($row[$codeIdx]);
            if (empty($code)) continue;

            $subject = Subject::where('code', $code)->first();

            if (!$subject) {
                // Extract possible data for creation
                $name = $descIdx !== null ? ($row[$descIdx] ?? $code) : $code;
                $units = $unitsIdx !== null ? (int)($row[$unitsIdx] ?? 0) : 0;
                $lec = $lecIdx !== null ? (int)($row[$lecIdx] ?? 0) : 0;
                $lab = $labIdx !== null ? (int)($row[$labIdx] ?? 0) : 0;

                // Key by code to avoid duplicates
                $missingSubjects[$code] = [
                    'code' => $code,
                    'name' => $name,
                    'units' => $units,
                    'lecture_hours' => $lec,
                    'lab_hours' => $lab,
                ];
            }

            $rowsToProcess[] = $code;
        }

        return response()->json([
            'valid' => true,
            'missing_subjects' => array_values($missingSubjects),
            'total_rows' => count($rowsToProcess)
        ]);
    }

    /**
     * Import subjects from CSV.
     */
    public function importCsv(Request $request, CurriculumProspectus $prospectus)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
            'create_missing' => 'boolean',
            'missing_subjects_data' => 'nullable|array'
        ]);

        $createMissing = $request->boolean('create_missing');
        $missingData = $request->input('missing_subjects_data', []);

        $file = $request->file('file');

        // Read file (re-read to process)
        $content = file_get_contents($file->getRealPath());
        $lines = explode(PHP_EOL, $content);
        $data = array_map('str_getcsv', $lines);
        $data = array_filter($data, function ($row) {
            return $row && count($row) > 1 && implode('', $row) !== '';
        });

        $header = array_shift($data);
        $headerMap = [];
        foreach ($header as $index => $col) {
            $normalized = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $col)));
            $headerMap[$normalized] = $index;
        }

        $codeIdx = $headerMap['subjectcode'] ?? $headerMap['code'] ?? null;
        $yearIdx = $headerMap['yearlevel'] ?? null;
        $semIdx = $headerMap['semester'] ?? null;
        $orderIdx = $headerMap['sortorder'] ?? null;

        \Illuminate\Support\Facades\DB::transaction(function () use ($data, $headerMap, $codeIdx, $yearIdx, $semIdx, $orderIdx, $createMissing, $missingData, $prospectus) {
            // Create missing subjects if requested
            if ($createMissing && !empty($missingData)) {
                foreach ($missingData as $subjectData) {
                    Subject::firstOrCreate(
                        ['code' => $subjectData['code']],
                        [
                            'name' => $subjectData['name'],
                            'units' => $subjectData['units'],
                            'lecture_hours' => $subjectData['lecture_hours'],
                            'lab_hours' => $subjectData['lab_hours'],
                            'is_active' => true,
                            // Only assign course_id if we knew it, but here we'll leave it generic (null) or could verify
                        ]
                    );
                }
            }

            // Process rows
            $syncData = [];
            foreach ($data as $row) {
                if (count($row) < count($headerMap)) continue;

                $code = trim($row[$codeIdx]);
                if (empty($code)) continue;

                $subject = Subject::where('code', $code)->first();
                if (!$subject) continue; // Skip if still not found

                $yearLevel = trim($row[$yearIdx]);
                $semester = trim($row[$semIdx]);
                $sortOrder = $orderIdx !== null ? (int)($row[$orderIdx] ?? 0) : 0;

                // Normalize Year Level (1, 1st, First => 1st)
                // Assuming formatted input but basic normalization:
                $yearLevel = str_replace(['Year', 'year', ' '], '', $yearLevel);
                if (is_numeric($yearLevel)) {
                    $suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
                    $val = (int)$yearLevel;
                    if ($val >= 1 && $val <= 5) $yearLevel = $val . $suffixes[$val % 10];
                }

                // Normalize Semester
                $semester = strtolower($semester);
                if (str_contains($semester, '1')) $semester = '1st';
                if (str_contains($semester, '2')) $semester = '2nd';
                if (str_contains($semester, 'sum')) $semester = 'summer';

                $validYears = ['1st', '2nd', '3rd', '4th', '5th'];
                $validSems = ['1st', '2nd', 'summer'];

                if (!in_array($yearLevel, $validYears) || !in_array($semester, $validSems)) continue;

                // Use the subject ID as key to prevent duplicates, overwrite with latest
                $syncData[$subject->id] = [
                    'year_level' => $yearLevel,
                    'semester' => $semester,
                    'sort_order' => $sortOrder
                ];
            }

            if (!empty($syncData)) {
                // Append/Update: use syncWithoutDetaching or sync?
                // User likely wants to ADD these. But if they re-upload, they might want to update.
                // syncWithoutDetaching will ignore if exists.
                // We want to update if exists.
                // $prospectus->subjects()->syncWithoutDetaching($syncData); // This doesn't update pivots

                // We'll iterate and attach/update
                $prospectus->subjects()->syncWithoutDetaching(array_keys($syncData));
                foreach ($syncData as $id => $pivot) {
                    $prospectus->subjects()->updateExistingPivot($id, $pivot);
                }
            }
        });

        return response()->json(['success' => true, 'message' => 'Import completed successfully.']);
    }
}
