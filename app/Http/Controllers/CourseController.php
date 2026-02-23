<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseMajor;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * Display a listing of courses.
     */
    public function index(Request $request): Response
    {
        $query = Course::with(['department', 'majors']);

        // User-based scoping
        $user = $request->user();
        if ($user && $user->isScheduler() && $user->department_id) {
            $query->where('department_id', $user->department_id);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Department filter (only if not restricted by role, or matches restricted role)
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $courses = $query->withCount(['subjects', 'majors'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $departmentsQuery = Department::where('is_active', true)
            ->orderBy('name');

        if ($user && $user->isScheduler() && $user->department_id) {
            $departmentsQuery->where('id', $user->department_id);
        }

        $departments = $departmentsQuery->get(['id', 'code', 'name']);

        return Inertia::render('courses/index', [
            'courses' => $courses,
            'departments' => $departments,
            'filters' => $request->only(['search', 'department_id', 'status']),
        ]);
    }

    /**
     * Store a newly created course.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'code' => ['required', 'string', 'max:20', 'unique:courses,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'years' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
            'majors' => ['nullable', 'array'],
            'majors.*.code' => ['nullable', 'string', 'max:20'],
            'majors.*.name' => ['required', 'string', 'max:255'],
            'majors.*.description' => ['nullable', 'string', 'max:1000'],
        ]);

        $majors = $validated['majors'] ?? [];
        unset($validated['majors']);

        $course = Course::create($validated);

        // Create majors if provided
        foreach ($majors as $majorData) {
            $course->majors()->create($majorData);
        }

        return back()->with('success', 'Course created successfully.');
    }

    /**
     * Update the specified course.
     */
    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'code' => ['required', 'string', 'max:20', 'unique:courses,code,' . $course->id],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'years' => ['required', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
            'majors' => ['nullable', 'array'],
            'majors.*.id' => ['nullable', 'integer'],
            'majors.*.code' => ['nullable', 'string', 'max:20'],
            'majors.*.name' => ['required', 'string', 'max:255'],
            'majors.*.description' => ['nullable', 'string', 'max:1000'],
            'majors.*.is_active' => ['boolean'],
        ]);

        $majorsData = $validated['majors'] ?? [];
        unset($validated['majors']);

        $course->update($validated);

        // Sync majors
        $existingMajorIds = [];
        foreach ($majorsData as $majorData) {
            if (isset($majorData['id'])) {
                // Update existing major
                CourseMajor::where('id', $majorData['id'])
                    ->where('course_id', $course->id)
                    ->update([
                        'name' => $majorData['name'],
                        'description' => $majorData['description'] ?? null,
                        'is_active' => $majorData['is_active'] ?? true,
                        // 'code' if it exists in data
                    ]);
                $existingMajorIds[] = $majorData['id'];
            } else {
                // Create new major
                $major = $course->majors()->create($majorData);
                $existingMajorIds[] = $major->id;
            }
        }

        // Delete removed majors (only if they don't have subjects)
        $course->majors()
            ->whereNotIn('id', $existingMajorIds)
            ->whereDoesntHave('subjects')
            ->delete();

        return back()->with('success', 'Course updated successfully.');
    }

    /**
     * Toggle course active status.
     */
    public function toggleStatus(Course $course)
    {
        $course->update(['is_active' => !$course->is_active]);

        $status = $course->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "Course {$status} successfully.");
    }

    /**
     * Remove the specified course.
     */
    public function destroy(Course $course)
    {
        // Check if course has subjects
        if ($course->subjects()->count() > 0) {
            return back()->with('error', 'Cannot delete course with existing subjects. Please remove or reassign subjects first.');
        }

        $course->delete();

        return back()->with('success', 'Course deleted successfully.');
    }

    /**
     * Get majors for a specific course (API endpoint).
     */
    public function getMajors(Course $course)
    {
        return response()->json([
            'majors' => $course->majors()->where('is_active', true)->get(['id', 'code', 'name']),
        ]);
    }
}
