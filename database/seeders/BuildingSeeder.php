<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\Room;
use Illuminate\Database\Seeder;

class BuildingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create common buildings
        $buildings = [
            [
                'code' => 'HTF',
                'name' => 'HTF Building',
                'description' => 'High Technology Facility - Main CCS Building',
                'is_active' => true,
            ],
            [
                'code' => 'LIB',
                'name' => 'Library Building',
                'description' => 'Library Building with additional classrooms',
                'is_active' => true,
            ],
            [
                'code' => 'MAIN',
                'name' => 'Main Building',
                'description' => 'Main Academic Building',
                'is_active' => true,
            ],
            [
                'code' => 'SCI',
                'name' => 'Science Building',
                'description' => 'Science and Laboratory Building',
                'is_active' => true,
            ],
        ];

        foreach ($buildings as $building) {
            Building::updateOrCreate(
                ['code' => $building['code']],
                $building
            );
        }

        // Update existing rooms without building_id to belong to HTF building
        $htfBuilding = Building::where('code', 'HTF')->first();
        if ($htfBuilding) {
            // Update rooms that have HTF or HF in their name, or have no building assigned
            Room::where(function ($query) {
                $query->where('name', 'like', 'HTF%')
                    ->orWhere('name', 'like', 'HF%')
                    ->orWhere('name', 'like', 'CALC%');
            })->whereNull('building_id')
              ->update(['building_id' => $htfBuilding->id]);
        }

        $this->command->info('Buildings seeded successfully!');
    }
}
