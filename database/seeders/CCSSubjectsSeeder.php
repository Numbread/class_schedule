<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class CCSSubjectsSeeder extends Seeder
{
    /**
     * Seed all CCS department subjects (BSIT, BSCS, BLIS).
     * Subjects are created once and attached to multiple courses via course_subject pivot.
     */
    public function run(): void
    {
        // Get courses
        $bsit = Course::where('code', 'BSIT')->first();
        $bscs = Course::where('code', 'BSCS')->first();
        $blis = Course::where('code', 'BLIS')->first();

        if (!$bsit && !$bscs && !$blis) {
            $this->command->warn('No CCS courses found. Please run the main DatabaseSeeder first.');
            return;
        }

        $subjects = [];

        // =====================================================
        // GENERAL EDUCATION SUBJECTS (No course assignment - available to all)
        // These subjects have course_id = null
        // =====================================================
        $subjects['OC1'] = $this->createGESubject([
            'code' => 'OC 1',
            'name' => 'Orientation Course',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['SocSci1'] = $this->createGESubject([
            'code' => 'SOCSCI 1',
            'name' => 'Understanding the Self',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['SocEcon1'] = $this->createGESubject([
            'code' => 'SOCECON 1',
            'name' => 'The Contemporary World',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Hist1'] = $this->createGESubject([
            'code' => 'HIST 1',
            'name' => 'Readings in Philippine History',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EnglishA'] = $this->createGESubject([
            'code' => 'ENGLISH A',
            'name' => 'Grammar and Speech Enhancement',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Math1'] = $this->createGESubject([
            'code' => 'MATH 1',
            'name' => 'Mathematics in the Modern World',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Philo1'] = $this->createGESubject([
            'code' => 'PHILO 1',
            'name' => 'Ethics',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Hum1'] = $this->createGESubject([
            'code' => 'HUM 1',
            'name' => 'Art Appreciation',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Comm1'] = $this->createGESubject([
            'code' => 'COMM 1',
            'name' => 'Purposive Communication',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Rizal'] = $this->createGESubject([
            'code' => 'RIZAL',
            'name' => "Rizal's Life, Works, and Writings",
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['STS1'] = $this->createGESubject([
            'code' => 'STS 1',
            'name' => 'Science, Technology and Society',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['STS'] = $this->createGESubject([
            'code' => 'STS',
            'name' => 'Science, Technology and Society',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // English Proficiency (also GE)
        $subjects['EP1S'] = $this->createGESubject([
            'code' => 'EP 1S',
            'name' => 'English Proficiency 1 - Start',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EP1A'] = $this->createGESubject([
            'code' => 'EP 1A',
            'name' => 'English Proficiency 1 - Accelerate',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // PE Subjects (GE)
        // 2024 Curriculum uses PATH FIT
        $subjects['PATHFIT1'] = $this->createGESubject([
            'code' => 'PATH FIT 1',
            'name' => 'Movement Competency Training',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['PATHFIT2'] = $this->createGESubject([
            'code' => 'PATH FIT 2',
            'name' => 'Exercise-based Fitness Activities',
            'units' => 2,
            'lecture_hours' => 0,
            'lab_hours' => 2,
        ]);

        $subjects['PATHFIT3'] = $this->createGESubject([
            'code' => 'PATH FIT 3',
            'name' => 'Sports (Individual/Dual)',
            'units' => 2,
            'lecture_hours' => 0,
            'lab_hours' => 2,
        ]);

        $subjects['PATHFIT4'] = $this->createGESubject([
            'code' => 'PATH FIT 4',
            'name' => 'Sports (Team)',
            'units' => 2,
            'lecture_hours' => 0,
            'lab_hours' => 2,
        ]);

        // 2018 Curriculum uses PE
        $subjects['PE1'] = $this->createGESubject([
            'code' => 'PE 1',
            'name' => 'Physical Education 1',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['PE2'] = $this->createGESubject([
            'code' => 'PE 2',
            'name' => 'Physical Education 2',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['PE3'] = $this->createGESubject([
            'code' => 'PE 3',
            'name' => 'Physical Education 3',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['PE4'] = $this->createGESubject([
            'code' => 'PE 4',
            'name' => 'Physical Education 4',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        // NSTP (GE)
        $subjects['NSTP1'] = $this->createGESubject([
            'code' => 'NSTP 1',
            'name' => 'NSTP (Civic Welfare Training Service) 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['NSTP2'] = $this->createGESubject([
            'code' => 'NSTP 2',
            'name' => 'NSTP (Civic Welfare Training Service) 2',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // GE Electives
        $subjects['GEEL1'] = $this->createGESubject([
            'code' => 'GE EL1',
            'name' => 'Mathematics, Science and Technology Elective (Environmental Science)',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL2'] = $this->createGESubject([
            'code' => 'GE EL2',
            'name' => 'Social Sciences and Philosophy Elective (Gender & Society)',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL3'] = $this->createGESubject([
            'code' => 'GE EL3',
            'name' => 'Arts and Humanities Elective (Indigenous Creative Crafts)',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // CSIT SUBJECTS (Shared between BSIT, BSCS)
        // =====================================================
        $subjects['CSIT1'] = $this->createAndAttachSubject([
            'code' => 'CSIT 1',
            'name' => 'Introduction to Computing',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        $subjects['CSIT2'] = $this->createAndAttachSubject([
            'code' => 'CSIT 2',
            'name' => 'Fundamentals of Programming/Computer Programming 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        $subjects['CSIT3'] = $this->createAndAttachSubject([
            'code' => 'CSIT 3',
            'name' => 'Intermediate Programming/Computer Programming 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        $subjects['CSIT4'] = $this->createAndAttachSubject([
            'code' => 'CSIT 4',
            'name' => 'Data Structures and Algorithms',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        $subjects['CSIT5'] = $this->createAndAttachSubject([
            'code' => 'CSIT 5',
            'name' => 'Information Management',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        $subjects['CSIT6'] = $this->createAndAttachSubject([
            'code' => 'CSIT 6',
            'name' => 'Applications Development and Emerging Technologies with Industry Process Orientation',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        // =====================================================
        // CSC SUBJECTS - NETWORKING (Shared between BSIT, BSCS)
        // =====================================================
        $subjects['CSC1'] = $this->createAndAttachSubject([
            'code' => 'CSC 1',
            'name' => 'CISCO 1: Networking Basics',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        $subjects['CSC2'] = $this->createAndAttachSubject([
            'code' => 'CSC 2',
            'name' => 'CISCO 2: Routing Protocols and Concepts',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        $subjects['CSC3'] = $this->createAndAttachSubject([
            'code' => 'CSC 3',
            'name' => 'CISCO 3: LAN Switching and Wireless',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        $subjects['CSC4'] = $this->createAndAttachSubject([
            'code' => 'CSC 4',
            'name' => 'CISCO 4: WAN Solutions',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        // =====================================================
        // CSP SUBJECTS (Mostly BSCS, some shared)
        // =====================================================
        // Shared CSP subjects
        $subjects['CSP1'] = $this->createAndAttachSubject([
            'code' => 'CSP 1',
            'name' => 'Systems Fundamentals',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bsit, $bscs]);

        $subjects['CSP4'] = $this->createAndAttachSubject([
            'code' => 'CSP 4',
            'name' => 'Object-Oriented Programming',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit, $bscs]);

        // BSCS-only CSP subjects
        $subjects['CSP2'] = $this->createAndAttachSubject([
            'code' => 'CSP 2',
            'name' => 'Discrete Structures 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP3'] = $this->createAndAttachSubject([
            'code' => 'CSP 3',
            'name' => 'Discrete Structures 2',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP5'] = $this->createAndAttachSubject([
            'code' => 'CSP 5',
            'name' => 'Human Computer Interaction',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP6'] = $this->createAndAttachSubject([
            'code' => 'CSP 6',
            'name' => 'Algorithms and Complexity',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP7'] = $this->createAndAttachSubject([
            'code' => 'CSP 7',
            'name' => 'Architecture and Organization',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP8'] = $this->createAndAttachSubject([
            'code' => 'CSP 8',
            'name' => 'Programming Languages',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP9'] = $this->createAndAttachSubject([
            'code' => 'CSP 9',
            'name' => 'Social Issues and Professional Practice',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP10'] = $this->createAndAttachSubject([
            'code' => 'CSP 10',
            'name' => 'Networks & Communication (CISCO 4: WAN Solutions)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ], [$bscs]);

        $subjects['CSP11'] = $this->createAndAttachSubject([
            'code' => 'CSP 11',
            'name' => 'Software Engineering 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP12'] = $this->createAndAttachSubject([
            'code' => 'CSP 12',
            'name' => 'Introduction to Modeling & Simulation',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP13'] = $this->createAndAttachSubject([
            'code' => 'CSP 13',
            'name' => 'CS Thesis Writing 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP14'] = $this->createAndAttachSubject([
            'code' => 'CSP 14',
            'name' => 'Operating Systems',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP15'] = $this->createAndAttachSubject([
            'code' => 'CSP 15',
            'name' => 'Information Assurance and Security',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP16'] = $this->createAndAttachSubject([
            'code' => 'CSP 16',
            'name' => 'Software Engineering 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP17'] = $this->createAndAttachSubject([
            'code' => 'CSP 17',
            'name' => 'Networks and Communications (CISCO 4: Network Programmability)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP18'] = $this->createAndAttachSubject([
            'code' => 'CSP 18',
            'name' => 'Software Engineering 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP19'] = $this->createAndAttachSubject([
            'code' => 'CSP 19',
            'name' => 'CS Thesis Writing 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP20'] = $this->createAndAttachSubject([
            'code' => 'CSP 20',
            'name' => 'Software Project Management',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP21'] = $this->createAndAttachSubject([
            'code' => 'CSP 21',
            'name' => 'Systems Architecture and Infrastructure (Internet of Things)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP22'] = $this->createAndAttachSubject([
            'code' => 'CSP 22',
            'name' => 'Modeling and Simulation',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP23'] = $this->createAndAttachSubject([
            'code' => 'CSP 23',
            'name' => 'Software Engineering 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP24'] = $this->createAndAttachSubject([
            'code' => 'CSP 24',
            'name' => 'CS Thesis Writing 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSMath'] = $this->createAndAttachSubject([
            'code' => 'CS Math',
            'name' => 'Mathematical Modeling',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        // CS Electives
        $subjects['CSEL1'] = $this->createAndAttachSubject([
            'code' => 'CS EL1',
            'name' => 'CS Elective: Intelligent Systems (Expert System)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSEL2'] = $this->createAndAttachSubject([
            'code' => 'CS EL2',
            'name' => 'CS Elective: Intelligent Systems (Machine Learning)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSEL3'] = $this->createAndAttachSubject([
            'code' => 'CS EL3',
            'name' => 'CS Elective: Graphics and Visual Computing (Image Analysis)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSEL4'] = $this->createAndAttachSubject([
            'code' => 'CS EL4',
            'name' => 'CS Elective: Parallel and Distributed Computing',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        // CSEL for 2018 (A series)
        $subjects['CSEL1A'] = $this->createAndAttachSubject([
            'code' => 'CSEL 1A',
            'name' => 'Graphics and Visual Computing',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSEL2A'] = $this->createAndAttachSubject([
            'code' => 'CSEL 2A',
            'name' => 'Intelligent Systems',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSEL3A'] = $this->createAndAttachSubject([
            'code' => 'CSEL 3A',
            'name' => 'Parallel & Distributed Computing',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSPRAC'] = $this->createAndAttachSubject([
            'code' => 'CSPRAC',
            'name' => 'Practicum/On-the-Job Training (486 hours)',
            'units' => 6,
            'lecture_hours' => 0,
            'lab_hours' => 6,
        ], [$bscs]);

        // CSEL for 2024 (BSCS)
        $subjects['CSEL1'] = $this->createAndAttachSubject([
            'code' => 'CSEL 1',
            'name' => 'Graphics and Visual Computing: Image Analysis (Elective)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSEL2'] = $this->createAndAttachSubject([
            'code' => 'CSEL 2',
            'name' => 'Parallel and Distributed Computing (Elective)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP12L'] = $this->createAndAttachSubject([
            'code' => 'CSP 12L',
            'name' => 'Software Engineering 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        // =====================================================
        // ITP SUBJECTS (BSIT-only with some shared)
        // =====================================================
        $subjects['ITP1'] = $this->createAndAttachSubject([
            'code' => 'ITP 1',
            'name' => 'IT Fundamentals',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bsit]);

        $subjects['ITP2'] = $this->createAndAttachSubject([
            'code' => 'ITP 2',
            'name' => 'Discrete Mathematics',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bsit]);

        $subjects['ITP3'] = $this->createAndAttachSubject([
            'code' => 'ITP 3',
            'name' => 'Networking 1 (CISCO 1: Networking Basics)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITP4'] = $this->createAndAttachSubject([
            'code' => 'ITP 4',
            'name' => 'Integrative Programming & Technologies',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITP5'] = $this->createAndAttachSubject([
            'code' => 'ITP 5',
            'name' => 'Networking 2 (CISCO 2: Routing Protocols & Concepts)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITP6'] = $this->createAndAttachSubject([
            'code' => 'ITP 6',
            'name' => 'Introduction to HCI',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITP7'] = $this->createAndAttachSubject([
            'code' => 'ITP 7',
            'name' => 'Advanced Database Systems',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITP8'] = $this->createAndAttachSubject([
            'code' => 'ITP 8',
            'name' => 'Systems Integration and Architecture 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITP9'] = $this->createAndAttachSubject([
            'code' => 'ITP 9',
            'name' => 'Social and Professional Issues',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bsit]);

        $subjects['ITP10'] = $this->createAndAttachSubject([
            'code' => 'ITP 10',
            'name' => 'Information Assurance and Security 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bsit]);

        $subjects['ITP11'] = $this->createAndAttachSubject([
            'code' => 'ITP 11',
            'name' => 'Event-Driven Programming',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bsit]);

        $subjects['ITP12'] = $this->createAndAttachSubject([
            'code' => 'ITP 12',
            'name' => 'Capstone Project and Research 1',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ], [$bsit]);

        $subjects['ITP13'] = $this->createAndAttachSubject([
            'code' => 'ITP 13',
            'name' => 'Information Assurance and Security 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITP14'] = $this->createAndAttachSubject([
            'code' => 'ITP 14',
            'name' => 'Quantitative Methods (incl. Modeling and Simulation)',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ], [$bsit]);

        $subjects['ITP15'] = $this->createAndAttachSubject([
            'code' => 'ITP 15',
            'name' => 'Systems Admin and Maintenance',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        // ITP 16/17 for 2018 Curriculum
        $subjects['ITP16'] = $this->createAndAttachSubject([
            'code' => 'ITP 16',
            'name' => 'Capstone Project and Research 2',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bsit]);

        $subjects['ITP17'] = $this->createAndAttachSubject([
            'code' => 'ITP 17',
            'name' => 'Systems Integration and Architecture 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITPRAC'] = $this->createAndAttachSubject([
            'code' => 'ITPRAC',
            'name' => 'Practicum/On-the-Job Training (486 hours)',
            'units' => 6,
            'lecture_hours' => 0,
            'lab_hours' => 6,
        ], [$bsit]);

        // ITEL Electives (BSIT)
        $subjects['ITEL1'] = $this->createAndAttachSubject([
            'code' => 'ITEL 1',
            'name' => 'Platform Technologies (Elective)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITEL2'] = $this->createAndAttachSubject([
            'code' => 'ITEL 2',
            'name' => 'Integrative Programming and Technologies 2 (Elective)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITEL3'] = $this->createAndAttachSubject([
            'code' => 'ITEL 3',
            'name' => 'Web Systems and Technologies (Elective)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        // ITEL for 2018 (A series)
        $subjects['ITEL1A'] = $this->createAndAttachSubject([
            'code' => 'ITEL 1A',
            'name' => 'Platform Technologies (Elective)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITEL2A'] = $this->createAndAttachSubject([
            'code' => 'ITEL 2A',
            'name' => 'Object-Oriented Programming',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITEL3A'] = $this->createAndAttachSubject([
            'code' => 'ITEL 3A',
            'name' => 'Integrative Programming & Tech 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ITEL4A'] = $this->createAndAttachSubject([
            'code' => 'ITEL 4A',
            'name' => 'Web Systems and Technologies',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bsit]);

        $subjects['ACCTG1'] = $this->createAndAttachSubject([
            'code' => 'ACCTG 1',
            'name' => 'Accounting 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bsit]);

        // =====================================================
        // BLIS SUBJECTS
        // =====================================================
        if ($blis) {
            $subjects['LIS101'] = $this->createAndAttachSubject([
                'code' => 'LIS 101',
                'name' => 'Introduction to Library and Information Science',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LISPT01'] = $this->createAndAttachSubject([
                'code' => 'LISPT 01', // Fixed capitalization
                'name' => 'School/Academic Librarianship',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['ICT1'] = $this->createAndAttachSubject([
                'code' => 'ICT 1',
                'name' => 'Computer Concepts and Productivity Tools',
                'units' => 3,
                'lecture_hours' => 2,
                'lab_hours' => 1,
            ], [$blis]);

            $subjects['LIS102'] = $this->createAndAttachSubject([
                'code' => 'LIS 102',
                'name' => 'Collection Management of Information Resources',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS103'] = $this->createAndAttachSubject([
                'code' => 'LIS 103',
                'name' => 'Information Resources and Services I',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS104'] = $this->createAndAttachSubject([
                'code' => 'LIS 104',
                'name' => 'Organization of Information Resources I',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LISPT02'] = $this->createAndAttachSubject([
                'code' => 'LISPT 02', // Fixed capitalization
                'name' => 'Special/Public Librarianship',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS105'] = $this->createAndAttachSubject([
                'code' => 'LIS 105',
                'name' => 'Information Resources and Services II',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS106'] = $this->createAndAttachSubject([
                'code' => 'LIS 106',
                'name' => 'Organization of Information Resources II',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS107'] = $this->createAndAttachSubject([
                'code' => 'LIS 107',
                'name' => 'Indexing and Abstracting',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS108'] = $this->createAndAttachSubject([
                'code' => 'LIS 108',
                'name' => 'Management of Libraries and Information Centers',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LICT101'] = $this->createAndAttachSubject([
                'code' => 'LICT 101',
                'name' => 'Information Processing and Handling in Lib. & Info. Centers',
                'units' => 3,
                'lecture_hours' => 2,
                'lab_hours' => 1,
            ], [$blis]);

            $subjects['LIS109'] = $this->createAndAttachSubject([
                'code' => 'LIS 109',
                'name' => 'Information Literacy',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS110'] = $this->createAndAttachSubject([
                'code' => 'LIS 110',
                'name' => 'Library materials for Children and Young Adults',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS111'] = $this->createAndAttachSubject([
                'code' => 'LIS 111',
                'name' => 'Introduction to Records Management and Archives',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LICT102'] = $this->createAndAttachSubject([
                'code' => 'LICT 102',
                'name' => 'Web Technologies in Libraries and Information Centers',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LISPT03'] = $this->createAndAttachSubject([
                'code' => 'LISPT 03', // Fixed capitalization
                'name' => 'Preservation of Information Resources',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS112'] = $this->createAndAttachSubject([
                'code' => 'LIS 112',
                'name' => 'Research Methods in LIS',
                'units' => 3,
                'lecture_hours' => 2,
                'lab_hours' => 1,
            ], [$blis]);

            $subjects['LICT103'] = $this->createAndAttachSubject([
                'code' => 'LICT 103',
                'name' => 'Digital Libraries & Resources',
                'units' => 3,
                'lecture_hours' => 2,
                'lab_hours' => 1,
            ], [$blis]);

            $subjects['LICT104'] = $this->createAndAttachSubject([
                'code' => 'LICT 104',
                'name' => 'Programming Fundamentals',
                'units' => 3,
                'lecture_hours' => 2,
                'lab_hours' => 1,
            ], [$blis]);

            $subjects['LISPT04'] = $this->createAndAttachSubject([
                'code' => 'LISPT 04',
                'name' => 'Philosophies and Principles of Teaching',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LISPT05'] = $this->createAndAttachSubject([
                'code' => 'LISPT 05',
                'name' => 'Educational Technology',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS113'] = $this->createAndAttachSubject([
                'code' => 'LIS 113',
                'name' => 'Thesis/Research Writing',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS114'] = $this->createAndAttachSubject([
                'code' => 'LIS 114',
                'name' => 'Collection Management in Academic Libraries',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS115'] = $this->createAndAttachSubject([
                'code' => 'LIS 115',
                'name' => 'Information Sources and Services in Academic Libraries',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LICT105'] = $this->createAndAttachSubject([
                'code' => 'LICT 105',
                'name' => 'Systems Analysis and Design in LIS',
                'units' => 3,
                'lecture_hours' => 2,
                'lab_hours' => 1,
            ], [$blis]);

            $subjects['LICT106'] = $this->createAndAttachSubject([
                'code' => 'LICT 106',
                'name' => 'Database Design for Libraries',
                'units' => 3,
                'lecture_hours' => 2,
                'lab_hours' => 1,
            ], [$blis]);

            $subjects['LIS116'] = $this->createAndAttachSubject([
                'code' => 'LIS 116',
                'name' => 'Organization of Information Resources in Academic Libraries',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS117'] = $this->createAndAttachSubject([
                'code' => 'LIS 117',
                'name' => 'Indexing and Abstracting in Academic Libraries',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LIS118'] = $this->createAndAttachSubject([
                'code' => 'LIS 118',
                'name' => 'Cataloging, Indexing, and IT Evaluation',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LISPT06'] = $this->createAndAttachSubject([
                'code' => 'LISPT 06',
                'name' => 'Indigenous Knowledge and Multi-Cultural Librarianship',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LISPT07'] = $this->createAndAttachSubject([
                'code' => 'LISPT 07',
                'name' => 'Foreign Language',
                'units' => 3,
                'lecture_hours' => 3,
                'lab_hours' => 0,
            ], [$blis]);

            $subjects['LPR01'] = $this->createAndAttachSubject([
                'code' => 'LPR 01',
                'name' => 'Library Practice (In-Campus) 200 Hours',
                'units' => 3,
                'lecture_hours' => 0,
                'lab_hours' => 6,
            ], [$blis]);

            $subjects['LPR02'] = $this->createAndAttachSubject([
                'code' => 'LPR 02',
                'name' => 'Library Practice (Off-Campus) 200 Hours',
                'units' => 3,
                'lecture_hours' => 0,
                'lab_hours' => 6,
            ], [$blis]);

            $subjects['LIS119'] = $this->createAndAttachSubject([
                'code' => 'LIS 119',
                'name' => 'Management and Organization, Reference, Selection Evaluation',
                'units' => 3,
                'lecture_hours' => 0,
                'lab_hours' => 6,
            ], [$blis]);
        }

        // =====================================================
        // 2024 CURRICULUM SUBJECTS (BSCS/BSIT Differences)
        // =====================================================
        $subjects['CSP5_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 5',
            'name' => 'Human Computer Interaction',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP6_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 6',
            'name' => 'Algorithms and Complexity',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP7_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 7',
            'name' => 'Architecture and Organization', // Based on User Edit Step 102
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP8_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 8',
            'name' => 'Programming Languages', // Based on User Edit Step 102
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP9_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 9',
            'name' => 'Social Issues and Professional Practice', // Based on User Edit Step 102
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP10_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 10',
            'name' => 'Networks & Communication (CISCO 4: WAN Solutions)', // Based on User Edit Step 102
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 3,
        ], [$bscs]);

        $subjects['CSP11_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 11',
            'name' => 'Software Engineering 1', // Based on User Edit Step 102
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP12_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 12',
            'name' => 'Introduction to Modeling & Simulation', // Based on User Edit Step 102
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP12L_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 12L',
            'name' => 'Software Engineering 1',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP13_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 13',
            'name' => 'Operating Systems',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP14_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 14',
            'name' => 'Information Assurance and Security 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP15_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 15',
            'name' => 'Software Project Management',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP16_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 16',
            'name' => 'Data Analytics',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP17_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 17',
            'name' => 'CS Thesis Writing 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        $subjects['CSP18_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 18',
            'name' => 'Systems Architecture and Infrastructure (Internet of Things)',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP19_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 19',
            'name' => 'Modeling & Simulation',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP20_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 20',
            'name' => 'Software Engineering 2',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ], [$bscs]);

        $subjects['CSP21_2024'] = $this->createAndAttachSubject([
            'code' => 'CSP 21',
            'name' => 'CS Thesis Writing 2',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ], [$bscs]);

        // ITP check for 2024
        // Likely reuse existing if names match, but defining explicitly if needed.
        // Assuming ITP 12-17 might overlap or differ.
        // For now, these are the main conflicts.
        // Add ITP if needed.


        // =====================================================
        // SET UP PREREQUISITES
        // =====================================================
        $this->setupPrerequisites($subjects);

        $this->command->info('CCS subjects seeded successfully with course attachments!');
    }

    /**
     * Create a subject and attach to multiple courses.
     * Modified to handle array inputs for data to prevent type errors.
     */
    private function createAndAttachSubject(array $data, array $courses): Subject
    {
        // Filter out null courses
        $courses = array_filter($courses);

        // Get first course for legacy course_id field
        $firstCourse = reset($courses);

        // Create or find the subject
        // We include 'name' in the search attributes to allow duplicate codes with different names (e.g. for different curriculum years)
        $subject = Subject::firstOrCreate(
            [
                'code' => $data['code'],
                'name' => $data['name']
            ],
            array_merge($data, [
                'course_id' => $firstCourse ? $firstCourse->id : null,
                'is_active' => true,
            ])
        );

        // Attach to all courses via pivot table
        foreach ($courses as $course) {
            if ($course && !$subject->courses()->where('course_id', $course->id)->exists()) {
                $subject->courses()->attach($course->id);
            }
        }

        return $subject;
    }

    /**
     * Create a General Education subject (no course assignment).
     * GE subjects have course_id = null and are not attached to any specific course.
     */
    private function createGESubject(array $data): Subject
    {
        return Subject::firstOrCreate(
            [
                'code' => $data['code'],
                'name' => $data['name']
            ],
            array_merge($data, [
                'course_id' => null,
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
            // CSIT chain
            'CSIT3' => ['CSIT2'],
            'CSIT4' => ['CSIT3'],
            'CSIT5' => ['CSIT4'],
            'CSIT6' => ['ITP6', 'ITP8'], // For BSIT, or CSP5, CSP12 for BSCS

            // CSC chain (Networking)
            'CSC2' => ['CSC1'],
            'CSC3' => ['CSC2'],
            'CSC4' => ['CSC3'],

            // ITP chain (BSIT)
            'ITP3' => ['CSIT4'],
            'ITP4' => ['CSIT4'],
            'ITP5' => ['ITP4'],
            'ITP6' => ['CSIT5'],
            'ITP7' => ['ITP5', 'ITP4'],
            'ITP8' => ['ITP5', 'ITP4'],
            'ITP9' => ['ITP6', 'ITP8'],
            'ITP10' => ['CSP15', 'ITP9'],
            'ITP12' => ['CSP14'],
            'ITP13' => ['CSP14'],
            'ITP14' => ['ITP10'],
            'ITP15' => ['CSP14'],

            // CSP chain (BSCS)
            'CSP3' => ['CSIT3'],
            'CSP5' => ['CSIT3'],
            'CSP6' => ['CSIT4'],
            'CSP7' => ['CSP4'],
            'CSP8' => ['CSIT4'],
            'CSP9' => ['CSP4'],
            'CSP10' => ['CSP6', 'CSP7'],
            'CSP11' => ['CSIT4', 'CSP7'],
            'CSP12' => ['CSP10'],
            'CSP13' => ['CSP12'],
            'CSP14' => ['CSP10'],
            'CSP15' => ['CSP12'],
            'CSP16' => ['CSP13'],
            'CSP17' => ['CSC3'],
            'CSP18' => ['CSP16', 'CSMath'],
            'CSP19' => ['CSMath'],
            'CSP20' => [],
            'CSP21' => ['CSP15', 'CSP17'],
            'CSP22' => ['CSMath'],
            'CSP23' => ['CSP16'],
            'CSP24' => ['CSP18'],

            // CS Math
            'CSMath' => [],

            // CS Electives
            'CSEL2' => [],

            // PE chain
            'PATHFit2' => ['PATHFit1'],
            'PATHFit3' => ['PATHFit2'],
            'PATHFit4' => ['PATHFit3'],

            // NSTP chain
            'NSTP2' => ['NSTP1'],

            // EP chain
            'EP1A' => ['EP1S'],

            // LIS chain
            'LIS102' => ['LIS101'],
            'LIS103' => ['LIS101'],
            'LIS104' => ['LISPT01'],
            'LIS105' => ['LIS103'],
            'LIS106' => ['LIS104'],
            'LICT101' => ['ICT1'],
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

        // Add prerequisites for new subjects
        $additionalPrereqs = [
            'PE2' => ['PE1'],
            'PE3' => ['PE1'], // Generally PE1 is prereq for others, or PE2->PE3. Using loose chain.
            'PE4' => ['PE1'],
            'ITP16' => ['ITP10'],
            'ITP17' => ['ITP5'],
        ];

        foreach ($additionalPrereqs as $subjectKey => $prereqKeys) {
            if (!isset($subjects[$subjectKey])) continue;

            $subject = $subjects[$subjectKey];
            foreach ($prereqKeys as $prereqKey) {
                if (!isset($subjects[$prereqKey])) continue;

                $prereq = $subjects[$prereqKey];
                if (!$subject->prerequisites()->where('prerequisite_id', $prereq->id)->exists()) {
                    $subject->prerequisites()->attach($prereq->id, ['requirement_type' => 'required']);
                }
            }
        }
    }
}
