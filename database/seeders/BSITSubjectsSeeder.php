<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class BSITSubjectsSeeder extends Seeder
{
    /**
     * Seed BSIT subjects with prerequisites.
     * Note: Year level and semester assignment will be done dynamically in Academic Setup.
     */
    public function run(): void
    {
        $bsit = Course::where('code', 'BSIT')->first();

        if (!$bsit) {
            $this->command->warn('BSIT course not found. Please run the main DatabaseSeeder first.');
            return;
        }

        // Store created subjects for prerequisite linking
        $subjects = [];

        // =====================================================
        // FIRST YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['OC1'] = $this->createSubject($bsit->id, [
            'code' => 'OC 1',
            'name' => 'Orientation Course',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['CSIT1'] = $this->createSubject($bsit->id, [
            'code' => 'CSIT 1',
            'name' => 'Introduction to Computing',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['CSIT2'] = $this->createSubject($bsit->id, [
            'code' => 'CSIT 2',
            'name' => 'Fundamentals of Programming/Computer Programming 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['SocSci1'] = $this->createSubject($bsit->id, [
            'code' => 'SOCSCI 1',
            'name' => 'Understanding the Self',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EnglishA'] = $this->createSubject($bsit->id, [
            'code' => 'ENGLISH A',
            'name' => 'Grammar & Speech Enhancement',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE1'] = $this->createSubject($bsit->id, [
            'code' => 'PE 1',
            'name' => 'PATH FIT 1',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['NSTP1'] = $this->createSubject($bsit->id, [
            'code' => 'NSTP 1',
            'name' => 'NSTP I',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // FIRST YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['CSIT3'] = $this->createSubject($bsit->id, [
            'code' => 'CSIT 3',
            'name' => 'Intermediate Programming/Computer Programming 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP1'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 1',
            'name' => 'IT Fundamentals',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['ITP2'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 2',
            'name' => 'Discrete Mathematics',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Math1'] = $this->createSubject($bsit->id, [
            'code' => 'MATH 1',
            'name' => 'Mathematics in the Modern World',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EP1S'] = $this->createSubject($bsit->id, [
            'code' => 'EP 1S',
            'name' => 'English Proficiency 1 - Start',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['PE2'] = $this->createSubject($bsit->id, [
            'code' => 'PE 2',
            'name' => 'PATH FIT 2',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['NSTP2'] = $this->createSubject($bsit->id, [
            'code' => 'NSTP 2',
            'name' => 'NSTP II',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // SECOND YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['CSIT4'] = $this->createSubject($bsit->id, [
            'code' => 'CSIT 4',
            'name' => 'Data Structures and Algorithms',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP3'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 3',
            'name' => 'Networking 1 (CISCO 1: Networking Basics)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITEL1A'] = $this->createSubject($bsit->id, [
            'code' => 'ITEL 1A',
            'name' => 'Platform Technologies',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITEL2A'] = $this->createSubject($bsit->id, [
            'code' => 'ITEL 2A',
            'name' => 'Object-Oriented Programming',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['Hist1'] = $this->createSubject($bsit->id, [
            'code' => 'HIST 1',
            'name' => 'Readings in Phil. History',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['SocEcon1'] = $this->createSubject($bsit->id, [
            'code' => 'SOCECON 1',
            'name' => 'The Contemporary World',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE3'] = $this->createSubject($bsit->id, [
            'code' => 'PE 3',
            'name' => 'PATH FIT 3',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // SECOND YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['CSIT5'] = $this->createSubject($bsit->id, [
            'code' => 'CSIT 5',
            'name' => 'Information Management',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP4'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 4',
            'name' => 'Integrative Programming & Technologies',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP5'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 5',
            'name' => 'Networking 2 (CISCO 2: Routing Protocols & Concepts)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP6'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 6',
            'name' => 'Introduction to HCI',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['Philo1'] = $this->createSubject($bsit->id, [
            'code' => 'PHILO 1',
            'name' => 'Ethics',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Comm1'] = $this->createSubject($bsit->id, [
            'code' => 'COMM 1',
            'name' => 'Purposive Communication',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE4'] = $this->createSubject($bsit->id, [
            'code' => 'PE 4',
            'name' => 'PATH FIT 4',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // THIRD YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['ITP7'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 7',
            'name' => 'Advanced Database Systems',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP8'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 8',
            'name' => 'Systems Integration and Architecture 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP9'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 9',
            'name' => 'Social and Professional Issues',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['CSC3'] = $this->createSubject($bsit->id, [
            'code' => 'CSC 3',
            'name' => 'CISCO 3: LAN Switching & Wireless',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['Rizal'] = $this->createSubject($bsit->id, [
            'code' => 'RIZAL',
            'name' => "Rizal's Life, Works, and Writings",
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL1'] = $this->createSubject($bsit->id, [
            'code' => 'GE EL1',
            'name' => 'Math, Science, & Tech Elective',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL2'] = $this->createSubject($bsit->id, [
            'code' => 'GE EL2',
            'name' => 'Soc. Sci. & Philo Elective: Gender & Society',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // THIRD YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['CSIT6'] = $this->createSubject($bsit->id, [
            'code' => 'CSIT 6',
            'name' => 'Applications Devt and Emerging Tech',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP10'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 10',
            'name' => 'Information Assurance and Security 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP11'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 11',
            'name' => 'Event-Driven Programming',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITEL3A'] = $this->createSubject($bsit->id, [
            'code' => 'ITEL 3A',
            'name' => 'Integrative Programming & Tech 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['CSC4'] = $this->createSubject($bsit->id, [
            'code' => 'CSC 4',
            'name' => 'CISCO 4: WAN Solutions',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['Hum1'] = $this->createSubject($bsit->id, [
            'code' => 'HUM 1',
            'name' => 'Arts Appreciation',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL3'] = $this->createSubject($bsit->id, [
            'code' => 'GE EL3',
            'name' => 'Arts and Humanities Elective',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // THIRD YEAR - SUMMER
        // =====================================================
        // Note: Summer subjects not shown in new curriculum

        // =====================================================
        // FOURTH YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['ITP14'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 14',
            'name' => 'Quantitative Methods (Incl. Modeling & Simulation)',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['ITP15'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 15',
            'name' => 'Systems Admin and Maintenance',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP16'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 16',
            'name' => 'Capstone Project and Research 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITP17'] = $this->createSubject($bsit->id, [
            'code' => 'ITP 17',
            'name' => 'Systems Integration and Architecture 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['ITEL4A'] = $this->createSubject($bsit->id, [
            'code' => 'ITEL 4A',
            'name' => 'Web Systems and Technologies',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['Acctg1'] = $this->createSubject($bsit->id, [
            'code' => 'ACCTG 1',
            'name' => 'Accounting 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EP1A'] = $this->createSubject($bsit->id, [
            'code' => 'EP 1A',
            'name' => 'English Proficiency 1 - Accelerate',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        // =====================================================
        // FOURTH YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['ITPrac'] = $this->createSubject($bsit->id, [
            'code' => 'ITPrac',
            'name' => 'Practicum/On-the-Job Training',
            'units' => 6,
            'lecture_hours' => 6,
            'lab_hours' => 6,
        ]);

        // =====================================================
        // SET UP PREREQUISITES
        // =====================================================
        $this->setupPrerequisites($subjects);

        $this->command->info('BSIT subjects seeded successfully with prerequisites!');
    }

    /**
     * Create a subject using firstOrCreate to avoid duplicates.
     */
    private function createSubject(int $courseId, array $data): Subject
    {
        return Subject::firstOrCreate(
            ['code' => $data['code']],
            array_merge($data, [
                'course_id' => $courseId,
                'is_active' => true,
            ])
        );
    }

    /**
     * Set up prerequisite relationships.
     */
    private function setupPrerequisites(array $subjects): void
    {
        $prerequisites = [
            // CSIT 3 requires CSIT 2
            'CSIT3' => ['CSIT2'],
            // CSIT 4 requires CSIT 3
            'CSIT4' => ['CSIT3'],
            // CSIT 5 requires CSIT 4
            'CSIT5' => ['CSIT4'],
            // CSIT 6 requires CSIT 5
            'CSIT6' => ['CSIT5'],
            
            // ITP 2 requires ITP 1
            'ITP2' => ['ITP1'],
            // ITP 3 requires CSIT 4
            'ITP3' => ['CSIT4'],
            // ITP 4 requires CSIT 4
            'ITP4' => ['CSIT4'],
            // ITP 5 requires ITP 3
            'ITP5' => ['ITP3'],
            // ITP 6 requires CSIT 4
            'ITP6' => ['CSIT4'],
            // ITP 7 requires CSIT 5
            'ITP7' => ['CSIT5'],
            // ITP 8 requires ITP 4
            'ITP8' => ['ITP4'],
            // ITP 9 requires 3rd Yr. Standing (we'll use CSIT4 as proxy)
            'ITP9' => ['CSIT4'],
            // ITP 10 requires ITP 8
            'ITP10' => ['ITP8'],
            // ITP 11 requires ITP 6 and ITP 4
            'ITP11' => ['ITP6', 'ITP4'],
            // ITP 14 requires 4th Yr. Standing (we'll use CSIT6 as proxy)
            'ITP14' => ['CSIT6'],
            // ITP 15 requires ITP 10
            'ITP15' => ['ITP10'],
            // ITP 16 requires ITP 15
            'ITP16' => ['ITP15'],
            // ITP 17 requires ITP 8
            'ITP17' => ['ITP8'],
            
            // CSC 3 requires ITP 3
            'CSC3' => ['ITP3'],
            // CSC 4 requires ITP 5
            'CSC4' => ['ITP5'],
            
            // ITEL 1A requires CSIT 3
            'ITEL1A' => ['CSIT3'],
            // ITEL 2A requires CSIT 3
            'ITEL2A' => ['CSIT3'],
            // ITEL 3A requires ITP 4
            'ITEL3A' => ['ITP4'],
            // ITEL 4A requires 4th Yr. Standing (we'll use CSIT6 as proxy)
            'ITEL4A' => ['CSIT6'],
            
            // PE 2 requires PE 1
            'PE2' => ['PE1'],
            // PE 3 requires PE 2
            'PE3' => ['PE2'],
            // PE 4 requires PE 3
            'PE4' => ['PE3'],
            
            // NSTP 2 requires NSTP 1
            'NSTP2' => ['NSTP1'],
            
            // EP 1A requires EP 1S
            'EP1A' => ['EP1S'],
        ];

        foreach ($prerequisites as $subjectKey => $prereqKeys) {
            if (!isset($subjects[$subjectKey])) {
                continue;
            }

            $subject = $subjects[$subjectKey];
            
            foreach ($prereqKeys as $prereqKey) {
                if (!isset($subjects[$prereqKey])) {
                    continue;
                }

                $prereq = $subjects[$prereqKey];
                
                // Only attach if not already attached
                if (!$subject->prerequisites()->where('prerequisite_id', $prereq->id)->exists()) {
                    $subject->prerequisites()->attach($prereq->id, ['requirement_type' => 'required']);
                }
            }
        }
    }
}

