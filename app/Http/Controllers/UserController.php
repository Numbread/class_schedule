<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $query = User::with('department');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('fname', 'like', "%{$search}%")
                    ->orWhere('lname', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('user_type') && $request->user_type) {
            $query->where('user_type', $request->user_type);
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->has('approval_status') && $request->approval_status) {
            $query->where('approval_status', $request->approval_status);
        }

        if ($request->has('department_id') && $request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        $users = $query->orderBy('lname')
            ->orderBy('fname')
            ->paginate(15)
            ->withQueryString();

        $departments = Department::active()->orderBy('code')->get();
        $specializations = User::getSpecializationOptions();

        return Inertia::render('users/index', [
            'users' => $users,
            'departments' => $departments,
            'specializations' => $specializations,
            'filters' => $request->only(['search', 'user_type', 'status', 'approval_status', 'department_id']),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fname' => ['required', 'string', 'max:255'],
            'mname' => ['nullable', 'string', 'max:255'],
            'lname' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'user_type' => ['required', Rule::in(['admin', 'scheduler', 'faculty'])],
            'department_id' => ['nullable', 'exists:departments,id'],
            'specialization' => ['nullable', 'string', Rule::in(array_keys(User::getSpecializationOptions()))],
        ]);

        User::create([
            'fname' => $validated['fname'],
            'mname' => $validated['mname'],
            'lname' => $validated['lname'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'user_type' => $validated['user_type'],
            'department_id' => $validated['department_id'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'approval_status' => 'approved', // Admin-created users are auto-approved
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->route('users.index')
            ->with('success', 'User created successfully.');
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'fname' => ['required', 'string', 'max:255'],
            'mname' => ['nullable', 'string', 'max:255'],
            'lname' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'user_type' => ['required', Rule::in(['admin', 'scheduler', 'faculty'])],
            'department_id' => ['nullable', 'exists:departments,id'],
            'specialization' => ['nullable', 'string', Rule::in(array_keys(User::getSpecializationOptions()))],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $updateData = [
            'fname' => $validated['fname'],
            'mname' => $validated['mname'],
            'lname' => $validated['lname'],
            'email' => $validated['email'],
            'user_type' => $validated['user_type'],
            'department_id' => $validated['department_id'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Approve a pending user registration.
     */
    public function approve(User $user)
    {
        if ($user->approval_status !== 'pending') {
            return redirect()->back()
                ->with('error', 'This user has already been processed.');
        }

        $user->approve(Auth::user());

        return redirect()->back()
            ->with('success', "User {$user->full_name} has been approved.");
    }

    /**
     * Reject a pending user registration.
     */
    public function reject(Request $request, User $user)
    {
        if ($user->approval_status !== 'pending') {
            return redirect()->back()
                ->with('error', 'This user has already been processed.');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $user->reject(Auth::user(), $validated['reason']);

        return redirect()->back()
            ->with('success', "User {$user->full_name} has been rejected.");
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent self-deletion
        if ($user->id === Auth::id()) {
            return redirect()->back()
                ->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully.');
    }

    /**
     * Toggle user active status (deactivate/activate).
     */
    public function toggleStatus(User $user)
    {
        // Prevent self-deactivation
        if ($user->id === Auth::id()) {
            return redirect()->back()
                ->with('error', 'You cannot deactivate your own account.');
        }

        if ($user->is_active) {
            $user->deactivate();
            $message = 'User account deactivated successfully.';
        } else {
            $user->activate();
            $message = 'User account activated successfully.';
        }

        return redirect()->back()->with('success', $message);
    }
}
