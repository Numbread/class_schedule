<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Department;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    /**
     * Display a listing of subjects.
     */
    public function index(Request $request): Response
    {
        $query = Subject::with(['course.department', 'courses.department', 'major', 'prerequisites']);

        // User-based scoping
        $user = $request->user();
        if ($user && $user->isScheduler() && $user->department_id) {
            $departmentId = $user->department_id;
            $query->where(function ($q) use ($departmentId) {
                // Check legacy course_id
                $q->whereHas('course', function ($subQ) use ($departmentId) {
                    $subQ->where('department_id', $departmentId);
                })
                    // Check many-to-many courses
                    ->orWhereHas('courses', function ($subQ) use ($departmentId) {
                        $subQ->where('department_id', $departmentId);
                    });
            });
        }

        // Handle multiple search terms (can be string or array)
        // Uses OR logic - subject matches if it contains ANY of the search terms
        if ($request->has('search') && $request->search) {
            $searchTerms = is_array($request->search) ? $request->search : [$request->search];

            $query->where(function ($q) use ($searchTerms) {
                foreach ($searchTerms as $search) {
                    // Use orWhere for OR logic between terms
                    $q->orWhere(function ($subQ) use ($search) {
                        $subQ->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
                }
            });
        }

        // Filter by department (subjects that belong to courses in this department)
        if ($request->has('department_id') && $request->department_id) {
            $departmentId = $request->department_id;
            $query->where(function ($q) use ($departmentId) {
                $q->whereHas('course', function ($subQ) use ($departmentId) {
                    $subQ->where('department_id', $departmentId);
                })->orWhereHas('courses', function ($subQ) use ($departmentId) {
                    $subQ->where('department_id', $departmentId);
                });
            });
        }

        // Filter by course (check both legacy course_id and new many-to-many relationship)
        if ($request->has('course_id') && $request->course_id) {
            $courseId = $request->course_id;
            $query->where(function ($q) use ($courseId) {
                $q->where('course_id', $courseId)
                    ->orWhereHas('courses', function ($subQ) use ($courseId) {
                        $subQ->where('courses.id', $courseId);
                    });
            });
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $subjects = $query->orderBy('code')->paginate(15)->withQueryString();

        // Get departments with their courses for grouping
        $departmentsQuery = Department::with(['courses' => function ($q) {
            $q->where('is_active', true)->with('majors')->orderBy('code');
        }])
            ->where('is_active', true)
            ->orderBy('name');

        if ($user && $user->isScheduler() && $user->department_id) {
            $departmentsQuery->where('id', $user->department_id);
        }

        $departments = $departmentsQuery->get();

        // Get all courses (flat list for backwards compatibility)
        $coursesQuery = Course::with(['department', 'majors'])
            ->where('is_active', true)
            ->orderBy('code');

        if ($user && $user->isScheduler() && $user->department_id) {
            $coursesQuery->where('department_id', $user->department_id);
        }

        $courses = $coursesQuery->get();

        // Get all active subjects for prerequisite selection with their course/department info
        $allSubjects = Subject::with('courses.department')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return Inertia::render('subjects/index', [
            'subjects' => $subjects,
            'departments' => $departments,
            'courses' => $courses,
            'allSubjects' => $allSubjects,
            'filters' => $request->only(['search', 'department_id', 'course_id', 'status']),
        ]);
    }

    /**
     * Store a newly created subject.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
            'major_id' => ['nullable', 'exists:course_majors,id'],
            'code' => ['required', 'string', 'max:20', 'unique:subjects,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'units' => ['required', 'integer', 'min:1', 'max:12'],
            'lecture_hours' => ['required', 'integer', 'min:0', 'max:12'],
            'lab_hours' => ['required', 'integer', 'min:0', 'max:12'],
            'category' => ['nullable', 'string', 'in:,CISCO,BSCS_PURE,LICT,LIS'],
            'prerequisite_ids' => ['nullable', 'array'],
            'prerequisite_ids.*' => ['exists:subjects,id'],
        ]);

        $subject = Subject::create([
            'course_id' => null, // Legacy field, kept for backwards compatibility
            'major_id' => $validated['major_id'] ?? null,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'units' => $validated['units'],
            'lecture_hours' => $validated['lecture_hours'],
            'lab_hours' => $validated['lab_hours'],
            'category' => $validated['category'] ?? null,
        ]);

        // Attach courses (many-to-many)
        if (!empty($validated['course_ids'])) {
            $subject->courses()->attach($validated['course_ids']);
        }

        // Attach prerequisites
        if (!empty($validated['prerequisite_ids'])) {
            $prerequisites = collect($validated['prerequisite_ids'])->mapWithKeys(function ($id) {
                return [$id => ['requirement_type' => 'required']];
            })->all();
            $subject->prerequisites()->attach($prerequisites);
        }

        return redirect()->route('subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    /**
     * Update the specified subject.
     */
    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
            'major_id' => ['nullable', 'exists:course_majors,id'],
            'code' => ['required', 'string', 'max:20', Rule::unique('subjects', 'code')->ignore($subject->id)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'units' => ['required', 'integer', 'min:1', 'max:12'],
            'lecture_hours' => ['required', 'integer', 'min:0', 'max:12'],
            'lab_hours' => ['required', 'integer', 'min:0', 'max:12'],
            'category' => ['nullable', 'string', 'in:,CISCO,BSCS_PURE,LICT,LIS'],
            'is_active' => ['boolean'],
            'prerequisite_ids' => ['nullable', 'array'],
            'prerequisite_ids.*' => ['exists:subjects,id'],
        ]);

        $subject->update([
            'course_id' => null, // Legacy field, kept for backwards compatibility
            'major_id' => $validated['major_id'] ?? null,
            'code' => $validated['code'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'units' => $validated['units'],
            'lecture_hours' => $validated['lecture_hours'],
            'lab_hours' => $validated['lab_hours'],
            'category' => $validated['category'] ?? null,
            'is_active' => $validated['is_active'] ?? $subject->is_active,
        ]);

        // Sync courses (many-to-many)
        $subject->courses()->sync($validated['course_ids'] ?? []);

        // Sync prerequisites (replace existing with new ones)
        $prerequisiteIds = $validated['prerequisite_ids'] ?? [];
        $prerequisites = collect($prerequisiteIds)->mapWithKeys(function ($id) {
            return [$id => ['requirement_type' => 'required']];
        })->all();
        $subject->prerequisites()->sync($prerequisites);

        return redirect()->route('subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    /**
     * Remove the specified subject.
     */
    public function destroy(Subject $subject)
    {
        $subject->delete();

        return redirect()->route('subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }

    /**
     * Toggle subject active status.
     */
    public function toggleStatus(Subject $subject)
    {
        $subject->update(['is_active' => !$subject->is_active]);

        return redirect()->back()
            ->with('success', 'Subject status updated successfully.');
    }

    /**
     * Export subjects to CSV.
     */
    public function exportCsv(Request $request)
    {
        $query = Subject::with(['courses.department', 'courses' => function ($q) {
            $q->orderBy('code');
        }, 'prerequisites']);

        // Filter by department if requested
        if ($request->has('department_id') && $request->department_id && $request->department_id !== 'all') {
            $departmentId = $request->department_id;
            $query->where(function ($q) use ($departmentId) {
                $q->whereHas('course', function ($subQ) use ($departmentId) {
                    $subQ->where('department_id', $departmentId);
                })->orWhereHas('courses', function ($subQ) use ($departmentId) {
                    $subQ->where('department_id', $departmentId);
                });
            });
        }

        // Get all subjects
        $subjects = $query->get()
            ->sortBy([
                // Sort by first department code, then subject code
                function ($subject) {
                    return $subject->courses->first()?->department?->code ?? 'ZZZ'; // ZZZ to put GE/No dept at end
                },
                'code'
            ]);

        $fileName = 'subjects-export-' . now()->format('Y-m-d') . '.csv';

        // Add department code to filename if filtering by specific department
        if ($request->has('department_id') && $request->department_id && $request->department_id !== 'all') {
            $dept = \App\Models\Department::find($request->department_id);
            if ($dept) {
                $fileName = 'subjects-export-' . $dept->code . '-' . now()->format('Y-m-d') . '.csv';
            }
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($subjects) {
            $output = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 compatibility
            fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header row
            fputcsv($output, [
                'Code',
                'Name',
                'Description',
                'Units',
                'Lecture Hours',
                'Lab Hours',
                'Department',
                'Courses',
                'Prerequisites',
                'Status',
            ]);

            // Data rows
            foreach ($subjects as $subject) {
                $courseCodes = $subject->courses->pluck('code')->implode(', ') ?: 'GE';
                $departments = $subject->courses->pluck('department.code')->unique()->filter()->implode(', ') ?: 'GE';
                $prerequisiteCodes = $subject->prerequisites->pluck('code')->implode(', ');

                fputcsv($output, [
                    $subject->code,
                    $subject->name,
                    $subject->description ?? '',
                    $subject->units,
                    $subject->lecture_hours,
                    $subject->lab_hours,
                    $departments,
                    $courseCodes,
                    $prerequisiteCodes,
                    $subject->is_active ? 'Active' : 'Inactive',
                ]);
            }

            fclose($output);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Download a template CSV for importing subjects.
     */
    public function exportTemplate()
    {
        $fileName = 'subjects-import-template.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () {
            $output = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 compatibility
            fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header row
            fputcsv($output, [
                'Code',
                'Name',
                'Description',
                'Units',
                'Lecture Hours',
                'Lab Hours',
                'Department',
                'Courses',
                'Prerequisites',
            ]);

            // Example rows
            fputcsv($output, [
                'CS 101',
                'Introduction to Computer Science',
                'Basic concepts of computer science',
                '3',
                '3',
                '0',
                'CCIS',
                'BSCS, BSIT',
                '',
            ]);

            fputcsv($output, [
                'CS 102',
                'Data Structures',
                'Fundamental data structures and algorithms',
                '3',
                '2',
                '3',
                'CCIS',
                'BSCS',
                'CS 101',
            ]);

            fputcsv($output, [
                'GE 101',
                'English Communication',
                'General education subject',
                '3',
                '3',
                '0',
                'GE',
                '',
            ]);

            fclose($output);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Validate CSV import and return preview.
     */
    public function validateImport(Request $request)
    {
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
        $data = $this->parseCsvFile($path);

        if (empty($data)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid data found in the CSV file.',
            ], 400);
        }

        // Validate each row
        $validRows = [];
        $invalidRows = [];
        $existingCodes = Subject::pluck('code')->toArray();
        $courseCodes = Course::pluck('code', 'id')->toArray();
        $courseIdsByCode = Course::pluck('id', 'code')->toArray();

        foreach ($data as $index => $row) {
            $errors = [];

            // Check required fields
            if (empty($row['code'])) {
                $errors[] = 'Code is required';
            } elseif (in_array(strtoupper($row['code']), array_map('strtoupper', $existingCodes))) {
                $errors[] = 'Code already exists';
            }

            if (empty($row['name'])) {
                $errors[] = 'Name is required';
            }

            if (!is_numeric($row['units']) || $row['units'] < 1 || $row['units'] > 12) {
                $errors[] = 'Units must be 1-12';
            }

            if (!is_numeric($row['lecture_hours']) || $row['lecture_hours'] < 0 || $row['lecture_hours'] > 12) {
                $errors[] = 'Lecture hours must be 0-12';
            }

            if (!is_numeric($row['lab_hours']) || $row['lab_hours'] < 0 || $row['lab_hours'] > 12) {
                $errors[] = 'Lab hours must be 0-12';
            }

            // Validate course codes
            $courseWarning = '';
            if (!empty($row['courses']) && strtoupper($row['courses']) !== 'GE') {
                $rowCourseCodes = array_map('trim', explode(',', $row['courses']));
                foreach ($rowCourseCodes as $courseCode) {
                    if (!isset($courseIdsByCode[strtoupper($courseCode)])) {
                        $courseWarning = "Course '{$courseCode}' not found";
                        break;
                    }
                }
            }

            if (count($errors) > 0) {
                $invalidRows[] = [
                    'row' => $index + 2,
                    'code' => $row['code'] ?? '',
                    'name' => $row['name'] ?? '',
                    'errors' => $errors,
                ];
            } else {
                $validRows[] = [
                    'row' => $index + 2,
                    'code' => $row['code'],
                    'name' => $row['name'],
                    'units' => $row['units'],
                    'courses' => $row['courses'] ?: 'GE',
                    'warning' => $courseWarning,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'summary' => [
                'total' => count($data),
                'valid' => count($validRows),
                'invalid' => count($invalidRows),
            ],
            'validRows' => array_slice($validRows, 0, 10),
            'invalidRows' => $invalidRows,
        ]);
    }

    /**
     * Import subjects from CSV.
     */
    public function importCsv(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $request->file('file');
        if (!$file) {
            return redirect()->back()->with('error', 'No file was uploaded.');
        }

        $path = $file->getRealPath();
        $data = $this->parseCsvFile($path);

        if (empty($data)) {
            return redirect()->back()->with('error', 'No valid data found in the CSV file.');
        }

        $existingCodes = Subject::pluck('code')->map(fn($c) => strtoupper($c))->toArray();
        $courseIdsByCode = Course::pluck('id', 'code')->mapWithKeys(fn($id, $code) => [strtoupper($code) => $id])->toArray();
        $subjectIdsByCode = Subject::pluck('id', 'code')->mapWithKeys(fn($id, $code) => [strtoupper($code) => $id])->toArray();

        $imported = 0;
        $skipped = 0;

        foreach ($data as $row) {
            // Skip rows with missing required data
            if (empty($row['code']) || empty($row['name'])) {
                $skipped++;
                continue;
            }

            // Skip if code already exists
            if (in_array(strtoupper($row['code']), $existingCodes)) {
                $skipped++;
                continue;
            }

            // Create the subject
            $subject = Subject::create([
                'code' => strtoupper($row['code']),
                'name' => $row['name'],
                'description' => $row['description'] ?? null,
                'units' => (int) ($row['units'] ?? 3),
                'lecture_hours' => (int) ($row['lecture_hours'] ?? 3),
                'lab_hours' => (int) ($row['lab_hours'] ?? 0),
                'is_active' => true,
            ]);

            // Attach courses
            if (!empty($row['courses']) && strtoupper($row['courses']) !== 'GE') {
                $rowCourseCodes = array_map('trim', explode(',', $row['courses']));
                $courseIds = [];
                foreach ($rowCourseCodes as $courseCode) {
                    $code = strtoupper($courseCode);
                    if (isset($courseIdsByCode[$code])) {
                        $courseIds[] = $courseIdsByCode[$code];
                    }
                }
                if (!empty($courseIds)) {
                    $subject->courses()->attach($courseIds);
                }
            }

            // Attach prerequisites
            if (!empty($row['prerequisites'])) {
                $prereqCodes = array_map('trim', explode(',', $row['prerequisites']));
                $prereqIds = [];
                foreach ($prereqCodes as $prereqCode) {
                    $code = strtoupper($prereqCode);
                    if (isset($subjectIdsByCode[$code])) {
                        $prereqIds[$subjectIdsByCode[$code]] = ['requirement_type' => 'required'];
                    }
                }
                if (!empty($prereqIds)) {
                    $subject->prerequisites()->attach($prereqIds);
                }
            }

            // Add to existing codes so duplicates within the file are skipped
            $existingCodes[] = strtoupper($row['code']);
            $subjectIdsByCode[strtoupper($row['code'])] = $subject->id;
            $imported++;
        }

        $message = "Imported {$imported} subject" . ($imported !== 1 ? 's' : '') . ".";
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} (duplicates or invalid).";
        }

        return redirect()->route('subjects.index')->with('success', $message);
    }

    /**
     * Parse CSV file into array of rows.
     */
    private function parseCsvFile(string $path): array
    {
        $data = [];
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return $data;
        }

        // Skip BOM if present
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        // Read header row
        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);
            return $data;
        }

        // Normalize header names
        $headerMap = [];
        foreach ($header as $index => $col) {
            $normalized = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '_', $col)));
            $headerMap[$normalized] = $index;
        }

        // Read data rows
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 2) continue;
            if (empty(trim($row[0] ?? ''))) continue;

            $data[] = [
                'code' => $row[$headerMap['code'] ?? 0] ?? '',
                'name' => $row[$headerMap['name'] ?? 1] ?? '',
                'description' => $row[$headerMap['description'] ?? 2] ?? '',
                'units' => $row[$headerMap['units'] ?? 3] ?? 3,
                'lecture_hours' => $row[$headerMap['lecture_hours'] ?? 4] ?? 3,
                'lab_hours' => $row[$headerMap['lab_hours'] ?? 5] ?? 0,
                'courses' => $row[$headerMap['courses'] ?? 6] ?? '',
                'prerequisites' => $row[$headerMap['prerequisites'] ?? 7] ?? '',
            ];
        }

        fclose($handle);
        return $data;
    }
}
