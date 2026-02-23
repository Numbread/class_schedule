<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CurriculumProspectus;
use App\Models\Department;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class CCSProspectus2018Seeder extends Seeder
{
    /**
     * Seed the 2018-2019 CCS curriculum prospectus.
     * This creates prospectus for BSIT, BSCS, and BLIS courses.
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
        $blis = Course::where('code', 'BLIS')->first();

        if ($bsit) {
            $this->seedBSITProspectus($ccs, $bsit);
        }

        if ($bscs) {
            $this->seedBSCSProspectus($ccs, $bscs);
        }

        if ($blis) {
            $this->seedBLISProspectus($ccs, $blis);
        }

        $this->command->info('CCS 2018-2019 Prospectus seeded successfully!');
    }

    /**
     * Seed BSIT Prospectus
     */
    private function seedBSITProspectus(Department $department, Course $course): void
    {
        $prospectus = CurriculumProspectus::firstOrCreate(
            [
                'course_id' => $course->id,
                'academic_year' => '2018-2019',
            ],
            [
                'department_id' => $department->id,
                'name' => 'BSIT Curriculum 2018-2019',
                'description' => 'Bachelor of Science in Information Technology Curriculum for Academic Year 2018-2019',
                'is_active' => true,
            ]
        );

        $subjects = [
            // FIRST YEAR - FIRST SEMESTER
            ['code' => 'OC 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'CSIT 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'CSIT 2', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'SOCSCI 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'ENGLISH A', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'PE 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'NSTP 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 7],

            // FIRST YEAR - SECOND SEMESTER
            ['code' => 'CSIT 3', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'ITP 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'ITP 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'Math 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'EP 1S', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'PE 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'NSTP 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 7],

            // SECOND YEAR - FIRST SEMESTER
            ['code' => 'CSIT 4', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'ITP 3', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'ITEL 1A', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'ITEL 2A', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'HIST 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'SOCECON 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'PE 3', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 7],

            // SECOND YEAR - SECOND SEMESTER
            ['code' => 'CSIT 5', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'ITP 4', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'ITP 5', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'ITP 6', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'PHILO 1', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'COMM 1', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'PE 4', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 7],

            // THIRD YEAR - FIRST SEMESTER
            ['code' => 'ITP 7', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'ITP 8', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'ITP 9', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'CSC 3', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'RIZAL', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'GE EL1', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'GE EL2', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 7],

            // THIRD YEAR - SECOND SEMESTER
            ['code' => 'CSIT 6', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'ITP 10', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'ITP 11', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'ITEL 3A', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'CSC 4', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'HUM 1', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'GE EL3', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 7],

            // THIRD YEAR - SUMMER
            ['code' => 'ITP 12', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 1],
            ['code' => 'ITP 13', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 2],
            ['code' => 'STS', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 3],

            // FOURTH YEAR - FIRST SEMESTER
            ['code' => 'ITP 14', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'ITP 15', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'ITP 16', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'ITP 17', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'ITEL 4A', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'ACCTG 1', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'EP 1A', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 7],

            // FOURTH YEAR - SECOND SEMESTER
            ['code' => 'ITPRAC', 'year_level' => '4th', 'semester' => '2nd', 'sort_order' => 1],
        ];

        $this->attachSubjectsToProspectus($prospectus, $subjects);
        $this->command->info("Created BSIT 2018-2019 Prospectus with " . count($subjects) . " subjects");
    }

    /**
     * Seed BSCS Prospectus
     */
    private function seedBSCSProspectus(Department $department, Course $course): void
    {
        $prospectus = CurriculumProspectus::firstOrCreate(
            [
                'course_id' => $course->id,
                'academic_year' => '2018-2019',
            ],
            [
                'department_id' => $department->id,
                'name' => 'BSCS Curriculum 2018-2019',
                'description' => 'Bachelor of Science in Computer Science Curriculum for Academic Year 2018-2019',
                'is_active' => true,
            ]
        );

        $subjects = [
            // FIRST YEAR - FIRST SEMESTER
            ['code' => 'OC 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'CSIT 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'CSIT 2', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'SocSci 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'ENGLISH A', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'PE 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'NSTP 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 7],

            // FIRST YEAR - SECOND SEMESTER
            ['code' => 'CSIT 3', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'CSP 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'CSP 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'Math 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'HIST 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'PE 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'NSTP 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 7],

            // SECOND YEAR - FIRST SEMESTER
            ['code' => 'CSIT 4', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'CSP 3', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'CSP 4', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'CSC 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'EP 1S', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'SOCECON 1', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'PE 3', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 7],

            // SECOND YEAR - SECOND SEMESTER
            ['code' => 'CSIT 5', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'CSP 5', 'name' => 'Human Computer Interaction', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'CSC 2', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'PHILO 1', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'HUM 1', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'COMM 1', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'PE 4', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 7],

            // THIRD YEAR - FIRST SEMESTER
            ['code' => 'CSP 6', 'name' => 'Algorithms and Complexity', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'CSP 7', 'name' => 'Architecture and Organization', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'CSP 8', 'name' => 'Programming Languages', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'CSP 9', 'name' => 'Social Issues and Professional Practice', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'CSC 3', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'CSEL 1A', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'GE EL1', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 7],
            ['code' => 'RIZAL', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 8],

            // THIRD YEAR - SECOND SEMESTER
            ['code' => 'CSIT 6', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'CSP 10', 'name' => 'Networks & Communication (CISCO 4: WAN Solutions)', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'CSP 11', 'name' => 'Software Engineering 1', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'CSP 12', 'name' => 'Introduction to Modeling & Simulation', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'CS MATH', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'STS', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'GE EL2', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 7],
            ['code' => 'GE EL3', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 8],

            // THIRD YEAR - SUMMER
            ['code' => 'CSP 13', 'name' => 'CS Thesis Writing 1', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 1],
            ['code' => 'CSP 14', 'name' => 'Software Project Management', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 2],
            ['code' => 'CSEL 2A', 'year_level' => '3rd', 'semester' => 'summer', 'sort_order' => 3],

            // FOURTH YEAR - FIRST SEMESTER
            ['code' => 'CSP 15', 'name' => 'Information Assurance and Security', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'CSP 16', 'name' => 'Operating Systems', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'CSP 17', 'name' => 'Automata Theory & Formal Languages', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'CSP 18', 'name' => 'Software Engineering 2', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'CSP 19', 'name' => 'CS Thesis Writing 2', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'CSEL 3A', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'EP 1A', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 7],

            // FOURTH YEAR - SECOND SEMESTER
            ['code' => 'CSPRAC', 'year_level' => '4th', 'semester' => '2nd', 'sort_order' => 1],
        ];

        $this->attachSubjectsToProspectus($prospectus, $subjects);
        $this->command->info("Created BSCS 2018-2019 Prospectus with " . count($subjects) . " subjects");
    }

    /**
     * Seed BLIS Prospectus
     */
    private function seedBLISProspectus(Department $department, Course $course): void
    {
        $prospectus = CurriculumProspectus::firstOrCreate(
            [
                'course_id' => $course->id,
                'academic_year' => '2018-2019',
            ],
            [
                'department_id' => $department->id,
                'name' => 'BLIS Curriculum 2018-2019',
                'description' => 'Bachelor of Library and Information Science Curriculum for Academic Year 2018-2019',
                'is_active' => true,
            ]
        );

        $subjects = [
            // FIRST YEAR - FIRST SEMESTER
            ['code' => 'OC 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'LIS 101', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'LISPT 01', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'ICT 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'SOCSCI 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'MATH 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'HIST 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 7],
            ['code' => 'PE 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 8],
            ['code' => 'NSTP 1', 'year_level' => '1st', 'semester' => '1st', 'sort_order' => 9],

            // FIRST YEAR - SECOND SEMESTER
            ['code' => 'LIS 102', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'LIS 103', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'LIS 104', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'LISPT 02', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'SOCECON 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'COMM 1', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'PE 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 7],
            ['code' => 'NSTP 2', 'year_level' => '1st', 'semester' => '2nd', 'sort_order' => 8],

            // SECOND YEAR - FIRST SEMESTER
            ['code' => 'LIS 105', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'LIS 106', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'LIS 107', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'LIS 108', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'LICT 101', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'STS', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'ENGLISH A', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 7],
            ['code' => 'PE 3', 'year_level' => '2nd', 'semester' => '1st', 'sort_order' => 8],

            // SECOND YEAR - SECOND SEMESTER
            ['code' => 'LIS 109', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'LIS 110', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'LIS 111', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'LICT 102', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'LISPT 03', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'PHILO 1', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 6],
            ['code' => 'RIZAL', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 7],
            ['code' => 'PE 4', 'year_level' => '2nd', 'semester' => '2nd', 'sort_order' => 8],

            // THIRD YEAR - FIRST SEMESTER
            ['code' => 'LIS 112', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'LICT 103', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'LICT 104', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'LISPT 04', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'LISPT 05', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'HUM 1', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 6],
            ['code' => 'GE EL1', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 7],
            ['code' => 'EP 1S', 'year_level' => '3rd', 'semester' => '1st', 'sort_order' => 8],

            // THIRD YEAR - SECOND SEMESTER
            ['code' => 'LIS 113', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'LIS 114', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'LIS 115', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 3],
            ['code' => 'LICT 105', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 4],
            ['code' => 'LICT 106', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'GE EL2', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 5],
            ['code' => 'EP 1A', 'year_level' => '3rd', 'semester' => '2nd', 'sort_order' => 6],

            // FOURTH YEAR - FIRST SEMESTER
            ['code' => 'LIS 116', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 1],
            ['code' => 'LIS 117', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 2],
            ['code' => 'LIS 118', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 3],
            ['code' => 'LPR 01', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 4],
            ['code' => 'LISPT 06', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 5],
            ['code' => 'GE EL3', 'year_level' => '4th', 'semester' => '1st', 'sort_order' => 6],

            // FOURTH YEAR - SECOND SEMESTER
            ['code' => 'LISPT 07', 'year_level' => '4th', 'semester' => '2nd', 'sort_order' => 1],
            ['code' => 'LPR 02', 'year_level' => '4th', 'semester' => '2nd', 'sort_order' => 2],
            ['code' => 'LIS 119', 'year_level' => '4th', 'semester' => '2nd', 'sort_order' => 3],
        ];

        $this->attachSubjectsToProspectus($prospectus, $subjects);
        $this->command->info("Created BLIS 2018-2019 Prospectus with " . count($subjects) . " subjects");
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
            // If checking both, we might need first() vs get() if duplicate names exist (unlikely for now).
            // But if we only check code, we might get the wrong one.
            // If name IS provided, we want the specific one.
            // If name IS NOT provided, we might default to the first one found (legacy behavior).
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
            }

            // Use subject_id as key to avoid duplicates
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
            'ITP 16' => 'Capstone Project and Research 2',
            'ITP 17' => 'Systems Integration and Architecture 2',
            'ITEL 4' => 'IT Elective 4 (Web Systems and Technologies)',
            'LIS 109' => 'Information Literacy',
            'LIS 110' => 'Library Materials for Children and Young Adults',
            'LIS 111' => 'Introduction to Records Management and Archives',
            'LIS 112' => 'Web Technologies in Libraries and Information Centers',
            'LIS 113' => 'Thesis/Research Writing',
            'LIS 114' => 'Collection Management in Academic Libraries',
            'LIS 115' => 'Information Sources and Services in Academic Libraries',
            'LIS 116' => 'Organization of Information Resources in Academic Libraries',
            'LIS 117' => 'Indexing and Abstracting in Academic Libraries',
            'LIS 118' => 'Cataloging, Indexing, and IT Evaluation',
            'LIS 119' => 'Library Practicum',
            'LICT 105' => 'SADi in LIS',
            'LISpT 06' => 'Indigenous Knowledge and Multi-Cultural Librarianship',
            'LISpT 07' => 'Foreign Language',
            'LPR 01' => 'Library Practice (In-Campus) 200 Hours',
            'LPR 02' => 'Library Practice (Off-Campus) 200 Hours',
            'LICT 101' => 'Info Processing & Handling in Lib & Info Res',
        ];

        return $names[$code] ?? "Subject: {$code}";
    }
}
