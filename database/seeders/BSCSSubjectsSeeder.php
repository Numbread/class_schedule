<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class BSCSSubjectsSeeder extends Seeder
{
    /**
     * Seed BSCS subjects with prerequisites.
     * Note: Year level and semester assignment will be done dynamically in Academic Setup.
     */
    public function run(): void
    {
        $bscs = Course::where('code', 'BSCS')->first();

        if (!$bscs) {
            $this->command->warn('BSCS course not found. Please run the main DatabaseSeeder first.');
            return;
        }

        // Store created subjects for prerequisite linking
        $subjects = [];

        // =====================================================
        // FIRST YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['OC1'] = $this->createSubject($bscs->id, [
            'code' => 'OC 1',
            'name' => 'Orientation Course',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['CSIT1'] = $this->createSubject($bscs->id, [
            'code' => 'CSIT 1',
            'name' => 'Introduction to Computing',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['CSIT2'] = $this->createSubject($bscs->id, [
            'code' => 'CSIT 2',
            'name' => 'Fundamentals of Programming/Computer Programming 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['SocSci1'] = $this->createSubject($bscs->id, [
            'code' => 'SOCSCI 1',
            'name' => 'Understanding the Self',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EnglishA'] = $this->createSubject($bscs->id, [
            'code' => 'ENGLISH A',
            'name' => 'Grammar & Speech Enhancement',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE1'] = $this->createSubject($bscs->id, [
            'code' => 'PE 1',
            'name' => 'PATH FIT 1',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['NSTP1'] = $this->createSubject($bscs->id, [
            'code' => 'NSTP 1',
            'name' => 'NSTP I',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // FIRST YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['CSIT3'] = $this->createSubject($bscs->id, [
            'code' => 'CSIT 3',
            'name' => 'Intermediate Programming/Computer Programming 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ]);

        $subjects['CSP1'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 1',
            'name' => 'Systems Fundamentals',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['CSP2'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 2',
            'name' => 'Discrete Structures 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Math1'] = $this->createSubject($bscs->id, [
            'code' => 'MATH 1',
            'name' => 'Mathematics in the Modern World',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Hist1'] = $this->createSubject($bscs->id, [
            'code' => 'HIST 1',
            'name' => 'Readings in Philippine History',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE2'] = $this->createSubject($bscs->id, [
            'code' => 'PE 2',
            'name' => 'PATH FIT 2',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['NSTP2'] = $this->createSubject($bscs->id, [
            'code' => 'NSTP 2',
            'name' => 'NSTP II',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // SECOND YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['CSIT4'] = $this->createSubject($bscs->id, [
            'code' => 'CSIT 4',
            'name' => 'Data Structures and Algorithms',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP3'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 3',
            'name' => 'Discrete Structures 2',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['CSP4'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 4',
            'name' => 'Object-Oriented Programming',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSC1'] = $this->createSubject($bscs->id, [
            'code' => 'CSC 1',
            'name' => 'CISCO 1: Networking Basics',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['EP1S'] = $this->createSubject($bscs->id, [
            'code' => 'EP 1S',
            'name' => 'English Proficiency 1 - Start',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['SocEcon1'] = $this->createSubject($bscs->id, [
            'code' => 'SOCECON 1',
            'name' => 'The Contemporary World',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['PE3'] = $this->createSubject($bscs->id, [
            'code' => 'PE 3',
            'name' => 'PATH FIT 3',
            'units' => 2,
            'lecture_hours' => 0,
            'lab_hours' => 2,
        ]);

        // =====================================================
        // SECOND YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['CSIT5'] = $this->createSubject($bscs->id, [
            'code' => 'CSIT 5',
            'name' => 'Information Management',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP5'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 5',
            'name' => 'Human Computer Interaction',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSC2'] = $this->createSubject($bscs->id, [
            'code' => 'CSC 2',
            'name' => 'CISCO 2: Routing Protocols & Concepts',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['Philo1'] = $this->createSubject($bscs->id, [
            'code' => 'PHILO 1',
            'name' => 'Ethics',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['Hum1'] = $this->createSubject($bscs->id, [
            'code' => 'HUM 1',
            'name' => 'Arts Appreciation',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['Comm1'] = $this->createSubject($bscs->id, [
            'code' => 'COMM 1',
            'name' => 'Purposive Communication',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['PE4'] = $this->createSubject($bscs->id, [
            'code' => 'PE 4',
            'name' => 'PATH FIT 4',
            'units' => 2,
            'lecture_hours' => 0,
            'lab_hours' => 2,
        ]);

        // =====================================================
        // THIRD YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['CSP6'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 6',
            'name' => 'Algorithms and Complexity',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP7'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 7',
            'name' => 'Architecture and Organization',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP8'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 8',
            'name' => 'Programming Languages',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP9'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 9',
            'name' => 'Social Issues & Professional Practice',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['CSC3'] = $this->createSubject($bscs->id, [
            'code' => 'CSC 3',
            'name' => 'CISCO 3: LAN Switching & Wireless',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSEL1A'] = $this->createSubject($bscs->id, [
            'code' => 'CSEL 1',
            'name' => 'Graphics and Visual Computing: Image Analysis',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['Rizal'] = $this->createSubject($bscs->id, [
            'code' => 'RIZAL',
            'name' => "Rizal's Life, Works, and Writings",
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL1'] = $this->createSubject($bscs->id, [
            'code' => 'GE EL1',
            'name' => 'Math, Science, & Tech Elective',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // THIRD YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['CSIT6'] = $this->createSubject($bscs->id, [
            'code' => 'CSIT 6',
            'name' => 'Applications Devt and Emerging Tech',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP10'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 10',
            'name' => 'Networks & Comm. (CISCO 4: WAN Solutions)',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP11'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 11',
            'name' => 'Software Engineering 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP12'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 12',
            'name' => 'Intro to Modeling & Simulation',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSMath'] = $this->createSubject($bscs->id, [
            'code' => 'CS MATH',
            'name' => 'Mathematical Modeling',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['STS'] = $this->createSubject($bscs->id, [
            'code' => 'STS',
            'name' => 'Science, Tech, & Society',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL2'] = $this->createSubject($bscs->id, [
            'code' => 'GE EL2',
            'name' => 'Soc. Sci. & Philo Elective: Gender & Society',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL3'] = $this->createSubject($bscs->id, [
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
        $subjects['CSP15'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 15',
            'name' => 'Information Assurance and Security',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP16'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 16',
            'name' => 'Operating Systems',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP17'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 17',
            'name' => 'Automata Theory & Formal Lang.',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['CSP18'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 18',
            'name' => 'Software Engineering 2',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSP19'] = $this->createSubject($bscs->id, [
            'code' => 'CSP 19',
            'name' => 'CS Thesis Writing 2',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['CSEL3A'] = $this->createSubject($bscs->id, [
            'code' => 'CSEL 3A',
            'name' => 'Parallel & Distributed Computing',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 3,
        ]);

        $subjects['EP1A'] = $this->createSubject($bscs->id, [
            'code' => 'EP 1A',
            'name' => 'English Proficiency 1 - Accelerate',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        // =====================================================
        // FOURTH YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['CSPRAC'] = $this->createSubject($bscs->id, [
            'code' => 'CSPRAC',
            'name' => 'Practicum/On-the-Job Training',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        // =====================================================
        // SET UP PREREQUISITES
        // =====================================================
        $this->setupPrerequisites($subjects);

        $this->command->info('BSCS subjects seeded successfully with prerequisites!');
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

            // CSP 2 requires CSIT 1
            'CSP2' => ['CSIT1'],
            // CSP 3 requires CSP 2
            'CSP3' => ['CSP2'],
            // CSP 4 requires CSIT 3
            'CSP4' => ['CSIT3'],
            // CSP 5 requires CSIT 4
            'CSP5' => ['CSIT4'],
            // CSP 6 requires CSIT 4
            'CSP6' => ['CSIT4'],
            // CSP 7 requires CSP 1
            'CSP7' => ['CSP1'],
            // CSP 8 requires CSP 4
            'CSP8' => ['CSP4'],
            // CSP 9 requires 2nd Yr. Standing (we'll use CSIT4 as proxy)
            'CSP9' => ['CSIT4'],
            // CSP 10 requires CSC 3
            'CSP10' => ['CSC3'],
            // CSP 11 requires CSP 8
            'CSP11' => ['CSP8'],
            // CSP 12 requires CSP 11
            'CSP12' => ['CSP11'],
            // CSP 15 requires CSP 11
            'CSP15' => ['CSP11'],
            // CSP 16 requires CSP 7
            'CSP16' => ['CSP7'],
            // CSP 17 requires CSP 8
            'CSP17' => ['CSP8'],
            // CSP 18 requires CSP 11
            'CSP18' => ['CSP11'],
            // CSP 19 requires 4th Yr. Standing (we'll use CSP17 as proxy)
            'CSP19' => ['CSP17'],

            // CSC 2 requires CSC 1
            'CSC2' => ['CSC1'],
            // CSC 3 requires CSC 2
            'CSC3' => ['CSC2'],

            // CSMath requires CSP 3
            'CSMath' => ['CSP3'],

            // CSEL 1A requires 3rd Yr. Standing (we'll use CSIT4 as proxy)
            'CSEL1A' => ['CSIT4'],
            // CSEL 3A requires 4th Yr. Standing (we'll use CSP17 as proxy)
            'CSEL3A' => ['CSP17'],

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
