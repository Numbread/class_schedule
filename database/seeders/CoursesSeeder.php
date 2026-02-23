<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseMajor;
use App\Models\Department;
use Illuminate\Database\Seeder;

class CoursesSeeder extends Seeder
{
    /**
     * Seed courses and their majors for CCS.
     */
    public function run(): void
    {
        $ccs = Department::where('code', 'CCS')->first();

        if (!$ccs) {
            $this->command->warn('CCS department not found. Please run DepartmentsSeeder first.');
            return;
        }

        // BSCS - Bachelor of Science in Computer Science
        $bscs = Course::firstOrCreate(
            ['code' => 'BSCS'],
            [
                'department_id' => $ccs->id,
                'name' => 'Bachelor of Science in Computer Science',
                'description' => 'A program focused on software development, algorithms, and computing theory.',
                'years' => 4,
                'is_active' => true,
            ]
        );

        // Create majors for BSCS
        CourseMajor::firstOrCreate(
            ['course_id' => $bscs->id, 'code' => 'SE'],
            ['name' => 'Software Engineering', 'is_active' => true]
        );
        CourseMajor::firstOrCreate(
            ['course_id' => $bscs->id, 'code' => 'DS'],
            ['name' => 'Data Science', 'is_active' => true]
        );

        // BSIT - Bachelor of Science in Information Technology
        $bsit = Course::firstOrCreate(
            ['code' => 'BSIT'],
            [
                'department_id' => $ccs->id,
                'name' => 'Bachelor of Science in Information Technology',
                'description' => 'A program focused on IT infrastructure, networking, and system administration.',
                'years' => 4,
                'is_active' => true,
            ]
        );

        // Create majors for BSIT
        CourseMajor::firstOrCreate(
            ['course_id' => $bsit->id, 'code' => 'WD'],
            ['name' => 'Web Development', 'is_active' => true]
        );
        CourseMajor::firstOrCreate(
            ['course_id' => $bsit->id, 'code' => 'NM'],
            ['name' => 'Network Management', 'is_active' => true]
        );

        // BLIS - Bachelor of Library and Information Science
        $blis = Course::firstOrCreate(
            ['code' => 'BLIS'],
            [
                'department_id' => $ccs->id,
                'name' => 'Bachelor of Library and Information Science',
                'description' => 'A program focused on library science, information management, and knowledge organization.',
                'years' => 4,
                'is_active' => true,
            ]
        );

        $this->command->info('Courses and majors seeded successfully!');
    }
}

