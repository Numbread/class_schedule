<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed users
        $this->call(UsersSeeder::class);

        // Seed departments
        $this->call(DepartmentsSeeder::class);

        // Seed courses and majors
        $this->call(CoursesSeeder::class);

        // Seed subjects with prerequisites
        // Using combined seeder that properly handles shared subjects between courses
        $this->call(CCSSubjectsSeeder::class);

        // Seed buildings
        $this->call(BuildingSeeder::class);

        // Seed rooms
        $this->call(RoomsSeeder::class);

        // Seed room assignment rules
        $this->call(RoomAssignmentRuleSeeder::class);

        // Seed time slots with priorities
        $this->call(TimeSlotsSeeder::class);

        // Seed faculty members
        $this->call(FacultySeeder::class);

        // Seed CCS Prospectus 2024
        $this->call(CCSProspectus2024Seeder::class);

        // Seed CCS Prospectus 2018
        $this->call(CCSProspectus2018Seeder::class);
    }
}
