<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoomController extends Controller
{
    /**
     * Display a listing of rooms.
     */
    public function index(Request $request): Response
    {
        $query = Room::with(['schedules', 'building']);

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('building', function ($bq) use ($search) {
                        $bq->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('room_type') && $request->room_type) {
            $query->where('room_type', $request->room_type);
        }

        if ($request->has('building_id') && $request->building_id) {
            $query->where('building_id', $request->building_id);
        } elseif ($request->has('building') && $request->building) {
            $query->where('building', $request->building);
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $rooms = $query->orderBy('priority', 'desc')
            ->orderBy('building_id')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        // Get both legacy building strings and new building records
        $legacyBuildings = Room::distinct()->pluck('building')->filter()->values();
        $buildingRecords = Building::active()->orderBy('code')->get();

        return Inertia::render('rooms/index', [
            'rooms' => $rooms,
            'buildings' => $legacyBuildings, // Legacy support
            'buildingRecords' => $buildingRecords,
            'filters' => $request->only(['search', 'room_type', 'building', 'building_id', 'status']),
        ]);
    }

    /**
     * Store a newly created room.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'building_id' => ['nullable', 'exists:buildings,id'],
            'building' => ['nullable', 'string', 'max:100'],
            'floor' => ['nullable', 'string', 'max:50'],
            'room_type' => ['required', Rule::in(['lecture', 'laboratory', 'hybrid'])],
            'capacity' => ['required', 'integer', 'min:1', 'max:500'],
            'priority' => ['required', 'integer', 'min:1', 'max:10'],
            'equipment' => ['nullable', 'array'],
            'class_settings' => ['nullable', 'array'],
            'class_settings.allow_consecutive' => ['nullable', 'boolean'],
            'class_settings.preferred_time_slots' => ['nullable', 'array'],
            'class_settings.max_daily_hours' => ['nullable', 'integer', 'min:1', 'max:12'],
        ]);

        // Check for unique name + building combination
        $buildingId = $validated['building_id'] ?? null;
        $exists = Room::where('name', $validated['name'])
            ->where('building_id', $buildingId)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'name' => 'A room with this name already exists in the selected building.',
            ]);
        }

        Room::create($validated);

        return redirect()->route('rooms.index')
            ->with('success', 'Room created successfully.');
    }

    /**
     * Update the specified room.
     */
    public function update(Request $request, Room $room)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'building_id' => ['nullable', 'exists:buildings,id'],
            'building' => ['nullable', 'string', 'max:100'],
            'floor' => ['nullable', 'string', 'max:50'],
            'room_type' => ['required', Rule::in(['lecture', 'laboratory', 'hybrid'])],
            'capacity' => ['required', 'integer', 'min:1', 'max:500'],
            'priority' => ['required', 'integer', 'min:1', 'max:10'],
            'equipment' => ['nullable', 'array'],
            'class_settings' => ['nullable', 'array'],
            'is_available' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        // Check for unique name + building combination (excluding current room)
        $buildingId = $validated['building_id'] ?? null;
        $exists = Room::where('name', $validated['name'])
            ->where('building_id', $buildingId)
            ->where('id', '!=', $room->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'name' => 'A room with this name already exists in the selected building.',
            ]);
        }

        $room->update($validated);

        return redirect()->route('rooms.index')
            ->with('success', 'Room updated successfully.');
    }

    /**
     * Remove the specified room.
     */
    public function destroy(Room $room)
    {
        $room->delete();

        return redirect()->route('rooms.index')
            ->with('success', 'Room deleted successfully.');
    }

    /**
     * Toggle room availability status.
     */
    public function toggleAvailability(Room $room)
    {
        $room->update(['is_available' => !$room->is_available]);

        return redirect()->back()
            ->with('success', 'Room availability updated successfully.');
    }

    /**
     * Toggle room active status.
     */
    public function toggleStatus(Room $room)
    {
        $room->update(['is_active' => !$room->is_active]);

        return redirect()->back()
            ->with('success', 'Room status updated successfully.');
    }
}
