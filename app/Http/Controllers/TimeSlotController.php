<?php

namespace App\Http\Controllers;

use App\Models\TimeSlot;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimeSlotController extends Controller
{
    /**
     * Display a listing of time slots.
     */
    public function index(Request $request): Response
    {
        $query = TimeSlot::query();

        // Custom sort order for day groups: MW, TTH, FRI, SAT, SUN
        $query->orderByRaw("
            CASE 
                WHEN day_group = 'MW' THEN 1
                WHEN day_group = 'TTH' THEN 2
                WHEN day_group = 'FRI' THEN 3
                WHEN day_group = 'SAT' THEN 4
                WHEN day_group = 'SUN' THEN 5
                ELSE 6
            END
        ")->orderBy('priority');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('day_group', 'like', "%{$search}%");
            });
        }

        if ($request->has('day_group') && $request->day_group !== 'all') {
            $query->where('day_group', $request->day_group);
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        return Inertia::render('time-slots/index', [
            'timeSlots' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'day_group', 'status']),
            'dayGroups' => ['MW', 'TTH', 'FRI', 'SAT', 'SUN'],
        ]);
    }

    /**
     * Store a newly created time slot in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'day_group' => ['required', 'string', 'in:MW,TTH,FRI,SAT,SUN'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'priority' => ['required', 'integer', 'min:1'],
            'name' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $start = Carbon::parse($request->start_time);
        $end = Carbon::parse($request->end_time);
        $duration = $end->diffInMinutes($start);

        // Generate name if not provided
        $name = $request->name;
        if (empty($name)) {
            $name = $start->format('H:i') . ' - ' . $end->format('H:i');
        }

        TimeSlot::create([
            'day_group' => $request->day_group,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'priority' => $request->priority,
            'duration_minutes' => $duration,
            'name' => $name,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Time slot created successfully.');
    }

    /**
     * Update the specified time slot in storage.
     */
    public function update(Request $request, TimeSlot $timeSlot)
    {
        $request->validate([
            'day_group' => ['required', 'string', 'in:MW,TTH,FRI,SAT,SUN'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'priority' => ['required', 'integer', 'min:1'],
            'name' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $start = Carbon::parse($request->start_time);
        $end = Carbon::parse($request->end_time);
        $duration = $end->diffInMinutes($start);

        // Generate name if not provided
        $name = $request->name;
        if (empty($name)) {
            $name = $start->format('H:i') . ' - ' . $end->format('H:i');
        }

        $timeSlot->update([
            'day_group' => $request->day_group,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'priority' => $request->priority,
            'duration_minutes' => $duration,
            'name' => $name,
            'is_active' => $request->boolean('is_active'),
        ]);

        return redirect()->back()->with('success', 'Time slot updated successfully.');
    }

    /**
     * Remove the specified time slot from storage.
     */
    public function destroy(TimeSlot $timeSlot)
    {
        $timeSlot->delete();

        return redirect()->back()->with('success', 'Time slot deleted successfully.');
    }

    /**
     * Toggle the status of the specified time slot.
     */
    public function toggleStatus(TimeSlot $timeSlot)
    {
        $timeSlot->update([
            'is_active' => !$timeSlot->is_active,
        ]);

        return redirect()->back()->with('success', 'Time slot status updated.');
    }
}
