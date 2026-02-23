<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomsSeeder extends Seeder
{
    /**
     * Seed the rooms table.
     */
    public function run(): void
    {
        // Get building IDs
        $htfBuilding = Building::where('code', 'HTF')->first();
        $libBuilding = Building::where('code', 'LIB')->first();
        $mainBuilding = Building::where('code', 'MAIN')->first();
        $sciBuilding = Building::where('code', 'SCI')->first();

        $htfBuildingId = $htfBuilding?->id;
        $libBuildingId = $libBuilding?->id;
        $mainBuildingId = $mainBuilding?->id;
        $sciBuildingId = $sciBuilding?->id;

        $rooms = [
            // HTF Building - 2nd Floor - Labs
            [
                'name' => 'HTF201',
                'building_id' => $htfBuildingId,
                'floor' => '2nd Floor',
                'room_type' => 'laboratory',
                'capacity' => 48,
                'priority' => 1,
                'is_available' => true,
                'is_active' => true,
            ],
            [
                'name' => 'HTF202',
                'building_id' => $htfBuildingId,
                'floor' => '2nd Floor',
                'room_type' => 'laboratory',
                'capacity' => 38,
                'priority' => 2,
                'is_available' => true,
                'is_active' => true,
            ],
            [
                'name' => 'HTF203',
                'building_id' => $htfBuildingId,
                'floor' => '2nd Floor',
                'room_type' => 'laboratory',
                'capacity' => 36,
                'priority' => 3,
                'is_available' => true,
                'is_active' => true,
            ],
            [
                'name' => 'HTF204',
                'building_id' => $htfBuildingId,
                'floor' => '2nd Floor',
                'room_type' => 'laboratory',
                'capacity' => 48,
                'priority' => 1,
                'is_available' => true,
                'is_active' => true,
            ],

            // HTF Building - 3rd Floor - Mixed
            [
                'name' => 'HF301',
                'building_id' => $htfBuildingId,
                'floor' => '3rd Floor',
                'room_type' => 'lecture',
                'capacity' => 40,
                'priority' => 2,
                'is_available' => true,
                'is_active' => true,
            ],
            [
                'name' => 'HF304',
                'building_id' => $htfBuildingId,
                'floor' => '3rd Floor',
                'room_type' => 'laboratory',
                'capacity' => 48,
                'priority' => 1,
                'is_available' => true,
                'is_active' => true,
            ],
            [
                'name' => 'CALC Technical Room',
                'building_id' => $htfBuildingId,
                'floor' => '3rd Floor',
                'room_type' => 'lecture',
                'capacity' => 45,
                'priority' => 1,
                'is_available' => true,
                'is_active' => true,
            ],
            [
                'name' => 'HF305',
                'building_id' => $htfBuildingId,
                'floor' => '3rd Floor',
                'room_type' => 'lecture',
                'capacity' => 45,
                'priority' => 2,
                'is_available' => true,
                'is_active' => true,
            ],
            [
                'name' => 'HF306',
                'building_id' => $htfBuildingId,
                'floor' => '3rd Floor',
                'room_type' => 'lecture',
                'capacity' => 45,
                'priority' => 2,
                'is_available' => true,
                'is_active' => true,
            ],
            [
                'name' => 'HF307',
                'building_id' => $htfBuildingId,
                'floor' => '3rd Floor',
                'room_type' => 'lecture',
                'capacity' => 45,
                'priority' => 2,
                'is_available' => true,
                'is_active' => true,
            ],

            // Library Building - D-RM2
            [
                'name' => 'D-RM2',
                'building_id' => $libBuildingId,
                'floor' => 'Ground Floor',
                'room_type' => 'lecture',
                'capacity' => 40,
                'priority' => 3,
                'is_available' => true,
                'is_active' => true,
            ],
        ];

        foreach ($rooms as $roomData) {
            Room::updateOrCreate(
                ['name' => $roomData['name']],
                $roomData
            );
        }

        $this->command->info('Rooms seeded successfully with building assignments!');
    }
}

