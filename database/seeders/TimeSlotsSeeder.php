<?php

namespace Database\Seeders;

use App\Models\TimeSlot;
use Illuminate\Database\Seeder;

class TimeSlotsSeeder extends Seeder
{
    /**
     * Seed the time slots table with prioritized schedules.
     */
    public function run(): void
    {
        $timeSlots = [
            // MW (Monday-Wednesday) Schedule
            ['name' => '08:00 - 09:30', 'start_time' => '08:00', 'end_time' => '09:30', 'day_group' => 'MW', 'priority' => 1],
            ['name' => '09:35 - 11:05', 'start_time' => '09:35', 'end_time' => '11:05', 'day_group' => 'MW', 'priority' => 2],
            ['name' => '11:10 - 12:40', 'start_time' => '11:10', 'end_time' => '12:40', 'day_group' => 'MW', 'priority' => 5],
            ['name' => '01:00 - 02:30', 'start_time' => '13:00', 'end_time' => '14:30', 'day_group' => 'MW', 'priority' => 6],
            ['name' => '02:35 - 04:05', 'start_time' => '14:35', 'end_time' => '16:05', 'day_group' => 'MW', 'priority' => 9],
            ['name' => '04:10 - 05:40', 'start_time' => '16:10', 'end_time' => '17:40', 'day_group' => 'MW', 'priority' => 10],
            ['name' => '05:45 - 07:15', 'start_time' => '17:45', 'end_time' => '19:15', 'day_group' => 'MW', 'priority' => 13],

            // TTH (Tuesday-Thursday) Schedule
            ['name' => '08:00 - 09:30', 'start_time' => '08:00', 'end_time' => '09:30', 'day_group' => 'TTH', 'priority' => 3],
            ['name' => '09:35 - 11:05', 'start_time' => '09:35', 'end_time' => '11:05', 'day_group' => 'TTH', 'priority' => 4],
            ['name' => '11:10 - 12:40', 'start_time' => '11:10', 'end_time' => '12:40', 'day_group' => 'TTH', 'priority' => 7],
            ['name' => '01:00 - 02:30', 'start_time' => '13:00', 'end_time' => '14:30', 'day_group' => 'TTH', 'priority' => 8],
            ['name' => '02:35 - 04:05', 'start_time' => '14:35', 'end_time' => '16:05', 'day_group' => 'TTH', 'priority' => 11],
            ['name' => '04:10 - 05:40', 'start_time' => '16:10', 'end_time' => '17:40', 'day_group' => 'TTH', 'priority' => 12],
            ['name' => '05:45 - 07:15', 'start_time' => '17:45', 'end_time' => '19:15', 'day_group' => 'TTH', 'priority' => 14],

            // Friday Schedule
            ['name' => '08:00 - 09:30', 'start_time' => '08:00', 'end_time' => '09:30', 'day_group' => 'FRI', 'priority' => 15],
            ['name' => '09:35 - 11:05', 'start_time' => '09:35', 'end_time' => '11:05', 'day_group' => 'FRI', 'priority' => 16],
            ['name' => '11:10 - 12:40', 'start_time' => '11:10', 'end_time' => '12:40', 'day_group' => 'FRI', 'priority' => 17],
            ['name' => '01:00 - 02:30', 'start_time' => '13:00', 'end_time' => '14:30', 'day_group' => 'FRI', 'priority' => 18],
            ['name' => '02:35 - 04:05', 'start_time' => '14:35', 'end_time' => '16:05', 'day_group' => 'FRI', 'priority' => 19],
            ['name' => '04:10 - 05:40', 'start_time' => '16:10', 'end_time' => '17:40', 'day_group' => 'FRI', 'priority' => 20],
            ['name' => '05:45 - 07:15', 'start_time' => '17:45', 'end_time' => '19:15', 'day_group' => 'FRI', 'priority' => 21],

            // Saturday Schedule (lower priority)
            ['name' => '08:00 - 09:30', 'start_time' => '08:00', 'end_time' => '09:30', 'day_group' => 'SAT', 'priority' => 22],
            ['name' => '09:35 - 11:05', 'start_time' => '09:35', 'end_time' => '11:05', 'day_group' => 'SAT', 'priority' => 23],
            ['name' => '11:10 - 12:40', 'start_time' => '11:10', 'end_time' => '12:40', 'day_group' => 'SAT', 'priority' => 24],
            ['name' => '01:00 - 02:30', 'start_time' => '13:00', 'end_time' => '14:30', 'day_group' => 'SAT', 'priority' => 25],
            ['name' => '02:35 - 04:05', 'start_time' => '14:35', 'end_time' => '16:05', 'day_group' => 'SAT', 'priority' => 26],
            ['name' => '04:10 - 05:40', 'start_time' => '16:10', 'end_time' => '17:40', 'day_group' => 'SAT', 'priority' => 27],
            ['name' => '05:45 - 07:15', 'start_time' => '17:45', 'end_time' => '19:15', 'day_group' => 'SAT', 'priority' => 28],

            // Sunday Schedule (lowest priority)
            ['name' => '08:00 - 09:30', 'start_time' => '08:00', 'end_time' => '09:30', 'day_group' => 'SUN', 'priority' => 29],
            ['name' => '09:35 - 11:05', 'start_time' => '09:35', 'end_time' => '11:05', 'day_group' => 'SUN', 'priority' => 30],
            ['name' => '11:10 - 12:40', 'start_time' => '11:10', 'end_time' => '12:40', 'day_group' => 'SUN', 'priority' => 31],
            ['name' => '01:00 - 02:30', 'start_time' => '13:00', 'end_time' => '14:30', 'day_group' => 'SUN', 'priority' => 32],
            ['name' => '02:35 - 04:05', 'start_time' => '14:35', 'end_time' => '16:05', 'day_group' => 'SUN', 'priority' => 33],
            ['name' => '04:10 - 05:40', 'start_time' => '16:10', 'end_time' => '17:40', 'day_group' => 'SUN', 'priority' => 34],
            ['name' => '05:45 - 07:15', 'start_time' => '17:45', 'end_time' => '19:15', 'day_group' => 'SUN', 'priority' => 35],
        ];

        foreach ($timeSlots as $slot) {
            TimeSlot::firstOrCreate(
                [
                    'day_group' => $slot['day_group'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                ],
                array_merge($slot, [
                    'duration_minutes' => 90,
                    'is_active' => true,
                ])
            );
        }

        $this->command->info('Time slots seeded successfully with priorities!');
    }
}

