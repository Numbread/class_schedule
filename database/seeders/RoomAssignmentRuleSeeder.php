<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\RoomAssignmentRule;
use Illuminate\Database\Seeder;

class RoomAssignmentRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Room Assignment Rules from CCS:
     * - CISCO subjects → HF202, CCAI faculty only
     * - BSCS pure subjects → CS/CPE faculty only
     * - LICT subjects → CS/IT faculty
     * - BSCS (smaller classes) → prioritize HF301, HF203
     * - LIS lecture/lab classes → same room priority
     */
    public function run(): void
    {
        // Get room IDs by name
        $hf202 = Room::where('name', 'HF202')->first();
        $hf301 = Room::where('name', 'HF301')->first();
        $hf203 = Room::where('name', 'HF203')->first();

        $rules = [
            [
                'name' => 'CISCO Subjects - HF202 Only',
                'subject_category' => 'CISCO',
                'faculty_specialization' => 'CCAI',
                'allowed_room_ids' => $hf202 ? [$hf202->id] : [],
                'priority_room_ids' => $hf202 ? [$hf202->id] : [],
                'priority' => 100,
                'is_active' => true,
                'description' => 'Cisco subjects (CCNA, CCNP, etc.) must be assigned to HF202 and handled by CCAI certified faculty only.',
            ],
            [
                'name' => 'BSCS Pure Subjects - CS/CPE Faculty',
                'subject_category' => 'BSCS_PURE',
                'faculty_specialization' => null, // Will check for CS or CPE
                'allowed_room_ids' => [], // All rooms allowed
                'priority_room_ids' => $hf301 && $hf203 ? [$hf301->id, $hf203->id] : [],
                'priority' => 80,
                'is_active' => true,
                'description' => 'BSCS pure subjects should be assigned to CS or CPE faculty. Smaller classes prioritized at HF301 and HF203.',
            ],
            [
                'name' => 'LICT Subjects - CS/IT Faculty',
                'subject_category' => 'LICT',
                'faculty_specialization' => null, // Will check for CS or IT
                'allowed_room_ids' => [],
                'priority_room_ids' => [],
                'priority' => 70,
                'is_active' => true,
                'description' => 'LICT subjects should be assigned to CS or IT faculty.',
            ],
            [
                'name' => 'LIS Classes - Priority Rooms',
                'subject_category' => 'LIS',
                'faculty_specialization' => 'LIS',
                'allowed_room_ids' => [],
                'priority_room_ids' => $hf301 && $hf203 ? [$hf301->id, $hf203->id] : [],
                'priority' => 60,
                'is_active' => true,
                'description' => 'LIS lecture and lab classes prioritized at HF301 and HF203.',
            ],
        ];

        foreach ($rules as $rule) {
            RoomAssignmentRule::updateOrCreate(
                ['name' => $rule['name']],
                $rule
            );
        }

        $this->command->info('Room assignment rules seeded successfully.');
    }
}
