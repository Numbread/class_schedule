<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments.
     */
    public function index(Request $request): Response
    {
        $query = Department::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $departments = $query->withCount('courses')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('departments/index', [
            'departments' => $departments,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:departments,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        Department::create($validated);

        return back()->with('success', 'Department created successfully.');
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:departments,code,' . $department->id],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $department->update($validated);

        return back()->with('success', 'Department updated successfully.');
    }

    /**
     * Toggle department active status.
     */
    public function toggleStatus(Department $department)
    {
        $department->update(['is_active' => !$department->is_active]);

        $status = $department->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "Department {$status} successfully.");
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Department $department)
    {
        // Check if department has courses
        if ($department->courses()->count() > 0) {
            return back()->with('error', 'Cannot delete department with existing courses. Please remove or reassign courses first.');
        }

        $department->delete();

        return back()->with('success', 'Department deleted successfully.');
    }
}

