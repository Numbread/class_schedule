<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentsSeeder extends Seeder
{
    /**
     * Seed departments for the application.
     */
    public function run(): void
    {
        // Create CCS Department
        Department::firstOrCreate(
            ['code' => 'CCS'],
            [
                'name' => 'College of Computer Studies',
                'description' => 'Department focused on computing, programming, and information technology.',
                'is_active' => true,
            ]
        );

        $this->command->info('Departments seeded successfully!');
    }
}

