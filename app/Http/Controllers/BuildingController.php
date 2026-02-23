<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BuildingController extends Controller
{
    /**
     * Display a listing of buildings.
     */
    public function index(): Response
    {
        $buildings = Building::withCount('rooms')
            ->orderBy('code')
            ->get();

        return Inertia::render('admin/buildings/index', [
            'buildings' => $buildings,
        ]);
    }

    /**
     * Show the form for creating a new building.
     */
    public function create(): Response
    {
        return Inertia::render('admin/buildings/create');
    }

    /**
     * Store a newly created building.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:buildings,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $building = Building::create($validated);

        return redirect()->route('buildings.index')
            ->with('success', "Building '{$building->name}' created successfully.");
    }

    /**
     * Display the specified building.
     */
    public function show(Building $building): Response
    {
        $building->load(['rooms' => function ($query) {
            $query->orderBy('name');
        }]);

        return Inertia::render('admin/buildings/show', [
            'building' => $building,
        ]);
    }

    /**
     * Show the form for editing the specified building.
     */
    public function edit(Building $building): Response
    {
        return Inertia::render('admin/buildings/edit', [
            'building' => $building,
        ]);
    }

    /**
     * Update the specified building.
     */
    public function update(Request $request, Building $building)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:buildings,code,' . $building->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $building->update($validated);

        return redirect()->route('buildings.index')
            ->with('success', "Building '{$building->name}' updated successfully.");
    }

    /**
     * Remove the specified building.
     */
    public function destroy(Building $building)
    {
        $roomCount = $building->rooms()->count();
        
        if ($roomCount > 0) {
            return back()->with('error', "Cannot delete building. It has {$roomCount} rooms assigned.");
        }

        $building->delete();

        return redirect()->route('buildings.index')
            ->with('success', 'Building deleted successfully.');
    }

    /**
     * Get buildings for API use.
     */
    public function apiIndex()
    {
        return Building::active()
            ->with(['rooms' => function ($query) {
                $query->where('is_active', true)->orderBy('name');
            }])
            ->orderBy('code')
            ->get();
    }

    /**
     * Get rooms for a specific building.
     */
    public function rooms(Building $building)
    {
        return $building->rooms()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Assign rooms to a building.
     */
    public function assignRooms(Request $request, Building $building)
    {
        $validated = $request->validate([
            'room_ids' => 'required|array',
            'room_ids.*' => 'exists:rooms,id',
        ]);

        Room::whereIn('id', $validated['room_ids'])
            ->update(['building_id' => $building->id]);

        return back()->with('success', 'Rooms assigned to building successfully.');
    }

    /**
     * Unassign room from a building.
     */
    public function unassignRoom(Building $building, Room $room)
    {
        if ($room->building_id === $building->id) {
            $room->update(['building_id' => null]);
            return back()->with('success', 'Room unassigned from building.');
        }

        return back()->with('error', 'Room does not belong to this building.');
    }
}
