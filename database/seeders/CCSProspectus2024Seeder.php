<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CurriculumProspectus;
use App\Models\Department;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class CCSProspectus2024Seeder extends Seeder
{
    /**
     * Seed the 2024-2025 CCS curriculum prospectus.
     * This creates prospectus for BSIT and BSCS courses based on provided 2024 curriculum.
     */
    public function run(): void
    {
        $ccs = Department::where('code', 'CCS')->first();

        if (!$ccs) {
            $this->command->warn('CCS Department not found. Please run DepartmentsSeeder first.');
            return;
        }

        $bsit = Course::where('code', 'BSIT')->first();
        $bscs = Course::where('code', 'BSCS')->first();

        if ($bsit) {
            $this->seedBSITProspectus($ccs, $bsit);
        }

        if ($bscs) {
            $this->seedBSCSProspectus($ccs, $bscs);
        }

        $this->command->info('CCS 2024-2025 Prospectus seeded successfully!');
    }

    /**
     * Seed BSIT Prospectus for 2024-2025
     */
    private function seedBSITProspectus(Department $department, Course $course): void
    {
        $prospectus = CurriculumProspectus::firstOrCreate(
            [
                'course_id' => $course->id,
                'academic_year' => '2024-2025',
            ],
            [
                'department_id' => $department->id,
                'name' => 'BSIT Curriculum 2024-2025',
                'description' => 'Bachelor of Science in Information Technology Curriculum for Academic Year 2024-2025',
                'is_active' => true,
            ]
        );

        $subjects = [
            // FIRST YEAR - FIRST SEMESTER
            ['code' => 'CSIT 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'CSIT 2', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'SOCSCI 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'SOCECON 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'HIST 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'OC 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'ENGLISH A', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 7],
            ['code' => 'PATH FIT 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 8],
            ['code' => 'NSTP 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 9],

            // FIRST YEAR - SECOND SEMESTER
            ['code' => 'CSIT 3', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'CSP 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'ITP 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'MATH 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'PHILO 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'HUM 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'EP 1S', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 7],
            ['code' => 'PATH FIT 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 8],
            ['code' => 'NSTP 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 9],

            // SECOND YEAR - FIRST SEMESTER
            ['code' => 'CSIT 4', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'ITP 2', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'CSC 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'CSP 4', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'ITEL 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'COMM 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'RIZAL', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 7],
            ['code' => 'GE EL1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 8],
            ['code' => 'PATH FIT 3', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 9],

            // SECOND YEAR - SECOND SEMESTER
            ['code' => 'CSIT 5', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'ITP 3', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'ITP 4', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'CSC 2', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'STS 1', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'GE EL2', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'GE EL3', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 7],
            ['code' => 'PATH FIT 4', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 8],

            // THIRD YEAR - FIRST SEMESTER
            ['code' => 'ITP 5', 'name' => 'Systems Integration and Architecture 1', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 1, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'ITP 6', 'name' => 'Advanced Database Systems', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 2, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'ITP 7', 'name' => 'Event-Driven Programming', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 3, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'ITP 8', 'name' => 'Mobile Applications Development', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 4, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 12', 'name' => 'Software Engineering 1', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 5, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSC 3', 'name' => 'Networking 3 (CISCO 3: LAN Switching & Wireless)', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 6, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'ACCTG 1', 'name' => 'Accounting 1', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 7, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],

            // THIRD YEAR - SECOND SEMESTER
            ['code' => 'CSIT 6', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'ITP 9', 'name' => 'Quantitative Methods (Including Modeling & Simulation)', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 2, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'CSP 14', 'name' => 'Information Assurance and Security 1', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 3, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 15', 'name' => 'Software Project Management', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 4, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'CSP 16', 'name' => 'Data Analytics', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 5, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSC 4', 'name' => 'Networking 4 (CISCO 4: Network Programmability)', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 6, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'ITEL 2', 'name' => 'Integrative Programming and Technologies 2 (Elective)', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 7, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],

            // THIRD YEAR - SUMMER
            ['code' => 'ITP 10', 'name' => 'Capstone Project and Research 1', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 1, 'units' => 3, 'lecture_hours' => 0, 'lab_hours' => 3],
            ['code' => 'ITP 11', 'name' => 'Intelligent Systems (Elective)', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 2, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'ITEL 3', 'name' => 'Web Systems and Technologies (Elective)', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 3, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],

            // FOURTH YEAR - FIRST SEMESTER
            ['code' => 'CSP 18', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'ITP 12', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'ITP 13', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'ITP 14', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'ITP 15', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 5],

            // FOURTH YEAR - SECOND SEMESTER
            ['code' => 'ITPRAC', 'year_level' => '4th', 'semester' => '2nd', 'sort_order' => 1],
        ];

        $this->attachSubjectsToProspectus($prospectus, $subjects);
        $this->command->info("Created BSIT 2024-2025 Prospectus with " . count($subjects) . " subjects");
    }

    /**
     * Seed BSCS Prospectus for 2024-2025
     */
    private function seedBSCSProspectus(Department $department, Course $course): void
    {
        $prospectus = CurriculumProspectus::firstOrCreate(
            [
                'course_id' => $course->id,
                'academic_year' => '2024-2025',
            ],
            [
                'department_id' => $department->id,
                'name' => 'BSCS Curriculum 2024-2025',
                'description' => 'Bachelor of Science in Computer Science Curriculum for Academic Year 2024-2025',
                'is_active' => true,
            ]
        );

        $subjects = [
            // FIRST YEAR - FIRST SEMESTER
            ['code' => 'CSIT 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'CSIT 2', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'SOCSCI 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'SOCECON 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'HIST 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'OC 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'ENGLISH A', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 7],
            ['code' => 'PATH FIT 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 8],
            ['code' => 'NSTP 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 9],

            // FIRST YEAR - SECOND SEMESTER
            ['code' => 'CSIT 3', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'CSP 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'CSP 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'MATH 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'PHILO 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'HUM 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'EP 1S', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 7],
            ['code' => 'PATH FIT 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 8],
            ['code' => 'NSTP 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 9],

            // SECOND YEAR - FIRST SEMESTER
            ['code' => 'CSIT 4', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'CSP 3', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'CSP 4', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'CSP 5', 'name' => 'Social Issues and Professional Practice', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'CSC 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'COMM 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'RIZAL', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 7],
            ['code' => 'GE EL1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 8],
            ['code' => 'PATH FIT 3', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 9],

            // SECOND YEAR - SECOND SEMESTER
            ['code' => 'CSIT 5', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 1, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 6', 'name' => 'Human-Computer Interaction', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 2, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 7', 'name' => 'Web Applications Development', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 3, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSC 2', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 4, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'STS 1', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 5, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'GE EL2', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 6, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'GE EL3', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 7, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'PATH FIT 4', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 8, 'units' => 2, 'lecture_hours' => 2, 'lab_hours' => 0], // Based on spreadsheet 2-0-2

            // THIRD YEAR - FIRST SEMESTER
            ['code' => 'CSP 8', 'name' => 'Automata Theory and Formal Languages', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 1, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'CSP 9', 'name' => 'Algorithms and Complexity', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 2, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 10', 'name' => 'Architecture and Organization', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 3, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0], // Assuming based on previous pattern or spreadsheet (Arch usually has lab for CS)
            ['code' => 'CSP 11', 'name' => 'Programming Languages', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 4, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 12L', 'name' => 'Software Engineering 1', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 5, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'ITP 8', 'name' => 'Mobile Applications Development', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 6, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSC 3', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 7, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],

            // THIRD YEAR - SECOND SEMESTER
            ['code' => 'CSIT 6', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 1, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 13', 'name' => 'Operating Systems', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 2, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 14', 'name' => 'Information Assurance and Security 1', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 3, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1], // Usually has lab
            ['code' => 'CSP 15', 'name' => 'Software Project Management', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 4, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'CSP 16', 'name' => 'Data Analytics', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 5, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CS MATH', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 6, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'CSC 4', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 7, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],

            // THIRD YEAR - SUMMER
            ['code' => 'CSP 17', 'name' => 'CS Thesis Writing 1', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 1, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'ITP 11', 'name' => 'Intelligent Systems (Elective)', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 2, 'units' => 3, 'lecture_hours' => 3, 'lab_hours' => 0],
            ['code' => 'CSEL 1', 'name' => 'Graphics and Visual Computing: Image Analysis (Elective)', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 3, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],

            // FOURTH YEAR - FIRST SEMESTER
            ['code' => 'CSP 18', 'name' => 'Systems Architecture and Infrastructure (Internet of Things)', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 1, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 19', 'name' => 'Modeling & Simulation', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 2, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1], // Usually has lab
            ['code' => 'CSP 20', 'name' => 'Software Engineering 2', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 3, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSP 21', 'name' => 'CS Thesis Writing 2', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 4, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],
            ['code' => 'CSEL 2', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 5, 'units' => 3, 'lecture_hours' => 2, 'lab_hours' => 1],

            // FOURTH YEAR - SECOND SEMESTER
            ['code' => 'CSPRAC', 'year_level' => '4th', 'semester' => '2nd', 'sort_order' => 1, 'units' => 6, 'lecture_hours' => 0, 'lab_hours' => 6],
        ];

        $this->attachSubjectsToProspectus($prospectus, $subjects);
        $this->command->info("Created BSCS 2024-2025 Prospectus with " . count($subjects) . " subjects");
    }

    /**
     * Attach subjects to prospectus by code.
     * Creates missing subjects automatically.
     */
    private function attachSubjectsToProspectus(CurriculumProspectus $prospectus, array $subjectsData): void
    {
        $syncData = [];
        $createdCount = 0;

        foreach ($subjectsData as $item) {
            $query = Subject::where('code', $item['code']);
            if (isset($item['name'])) {
                $query->where('name', $item['name']);
            }
            $subject = $query->first();

            // If subject doesn't exist, create it
            if (!$subject) {
                $subject = Subject::create([
                    'code' => $item['code'],
                    'name' => $item['name'] ?? $this->generateSubjectName($item['code']),
                    'units' => $item['units'] ?? 3,
                    'lecture_hours' => $item['lecture_hours'] ?? 3,
                    'lab_hours' => $item['lab_hours'] ?? 0,
                    'course_id' => $prospectus->course_id,
                    'is_active' => true,
                ]);
                $createdCount++;
                $this->command->info("Created subject: {$subject->code} - {$subject->name}");
            } else {
                // Check if we need to update units/hours for 2024 curriculum
                // Note: This modifies the shared subject record. If 2018 uses same code+name but different units, this conflicts.
                // Assuming distinct names were used for distinct versions, so this update effectively enforces the spec.
                $updated = false;
                if (isset($item['units']) && $subject->units != $item['units']) {
                    $subject->units = $item['units'];
                    $updated = true;
                }
                if (isset($item['lecture_hours']) && $subject->lecture_hours != $item['lecture_hours']) {
                    $subject->lecture_hours = $item['lecture_hours'];
                    $updated = true;
                }
                if (isset($item['lab_hours']) && $subject->lab_hours != $item['lab_hours']) {
                    $subject->lab_hours = $item['lab_hours'];
                    $updated = true;
                }

                if ($updated) {
                    $subject->save();
                    // $this->command->info("Updated subject: {$subject->code} hours/units");
                }
            }

            // Use subject_id as key to avoid duplicates (same subject in same position)
            // If the same subject appears multiple times, we'll keep the first occurrence
            $key = $subject->id . '_' . $item['year_level'] . '_' . $item['semester'];

            if (!isset($syncData[$key])) {
                $syncData[$subject->id] = [
                    'year_level' => $item['year_level'],
                    'semester' => $item['semester'],
                    'sort_order' => $item['sort_order'],
                ];
            }
        }

        if ($createdCount > 0) {
            $this->command->info("Created {$createdCount} missing subjects");
        }

        $prospectus->subjects()->sync($syncData);
    }

    /**
     * Generate a subject name from its code.
     */
    private function generateSubjectName(string $code): string
    {
        $names = [
            'CSP 8' => 'Automata Theory and Formal Lang.',
            'CSP 9' => 'Algorithms and Complexity',
            'CSP 10' => 'Architecture and Organization',
            'CSP 11' => 'Programming Languages',
            'CSP 12' => 'Software Engineering 1',
            'CSP 12L' => 'Software Engineering 1',
            'CSP 13' => 'Operating Systems',
            'CSP 14' => 'Information Assurance and Security 1',
            'CSP 15' => 'Software Project Management',
            'CSP 16' => 'Data Analytics',
            'CS Math' => 'Mathematical Modeling',
            'CSP 17' => 'CS Thesis Writing 1',
            'CS EL1' => 'Graphics and Visual Computing: Image Analysis (Elective)',
            'CSP 18' => 'Systems Architecture and Infrastructure (Internet of Things)',
            'CSP 19' => 'Modeling & Simulation',
            'CSP 20' => 'Software Engineering 2',
            'CSP 21' => 'CS Thesis Writing 2',
            'CS EL2' => 'Parallel and Distributed Computing (Elective)',
            'CSPrac' => 'Practicum/On-the-Job Training (486 Hours)',
            'ITPrac' => 'Practicum/On-the-Job Training (486 Hours)',
            // BSIT ones
            'ITP 12' => 'Information Assurance and Security 2',
            'ITP 13' => 'Systems Administration and Maintenance',
            'ITP 14' => 'Capstone Project and Research 2',
            'ITP 15' => 'Systems Integration and Architecture 2',
            // 2018 carry overs if needed
            'ITP 16' => 'Capstone Project and Research 2',
            'ITP 17' => 'Systems Integration and Architecture 2',
            'ITEL 4' => 'IT Elective 4 (Web Systems and Technologies)',
            'EP 1S' => 'English Proficiency 1 - Start',
            'EP 1A' => 'English Proficiency 1 - Advanced',
        ];

        return $names[$code] ?? "Subject: {$code}";
    }
}
