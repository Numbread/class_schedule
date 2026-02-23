<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class BLISSubjectsSeeder extends Seeder
{
    /**
     * Seed BLIS subjects with prerequisites.
     * Note: Year level and semester assignment will be done dynamically in Academic Setup.
     */
    public function run(): void
    {
        $blis = Course::where('code', 'BLIS')->first();

        if (!$blis) {
            $this->command->warn('BLIS course not found. Please run the main DatabaseSeeder first.');
            return;
        }

        // Store created subjects for prerequisite linking
        $subjects = [];

        // =====================================================
        // FIRST YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['OC1'] = $this->createSubject($blis->id, [
            'code' => 'OC 1',
            'name' => 'Orientation Course',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS101'] = $this->createSubject($blis->id, [
            'code' => 'LIS 101',
            'name' => 'Introduction to LIS',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LISPT01'] = $this->createSubject($blis->id, [
            'code' => 'LISPT 01',
            'name' => 'School/Academic Librarianship',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['ICT1'] = $this->createSubject($blis->id, [
            'code' => 'ICT 1',
            'name' => 'Computer Concepts and Productivity 1',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['SocSci1'] = $this->createSubject($blis->id, [
            'code' => 'SOCSCI 1',
            'name' => 'Understanding the Self',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Math1'] = $this->createSubject($blis->id, [
            'code' => 'MATH 1',
            'name' => 'Mathematics in the Modern World',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Hist1'] = $this->createSubject($blis->id, [
            'code' => 'HIST 1',
            'name' => 'Readings in Philippine History',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE1'] = $this->createSubject($blis->id, [
            'code' => 'PE 1',
            'name' => 'PATH FIT 1',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['NSTP1'] = $this->createSubject($blis->id, [
            'code' => 'NSTP 1',
            'name' => 'NSTP I',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // FIRST YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['LIS102'] = $this->createSubject($blis->id, [
            'code' => 'LIS 102',
            'name' => 'Collection Mngt of Info Resources',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS103'] = $this->createSubject($blis->id, [
            'code' => 'LIS 103',
            'name' => 'Info Resources and Services I',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS104'] = $this->createSubject($blis->id, [
            'code' => 'LIS 104',
            'name' => 'Organization of Info Resources I',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LISPT02'] = $this->createSubject($blis->id, [
            'code' => 'LISPT 02',
            'name' => 'Special/Public Librarianship',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['SocEcon1'] = $this->createSubject($blis->id, [
            'code' => 'SOCECON 1',
            'name' => 'The Contemporary World',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Comm1'] = $this->createSubject($blis->id, [
            'code' => 'COMM 1',
            'name' => 'Purposive Communication',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE2'] = $this->createSubject($blis->id, [
            'code' => 'PE 2',
            'name' => 'PATH FIT 2',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        $subjects['NSTP2'] = $this->createSubject($blis->id, [
            'code' => 'NSTP 2',
            'name' => 'NSTP II',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // SECOND YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['LIS105'] = $this->createSubject($blis->id, [
            'code' => 'LIS 105',
            'name' => 'Info Resources and Services II',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['LIS106'] = $this->createSubject($blis->id, [
            'code' => 'LIS 106',
            'name' => 'Organization of Info Resources II',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['LIS107'] = $this->createSubject($blis->id, [
            'code' => 'LIS 107',
            'name' => 'Indexing and Abstracting',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['LIS108'] = $this->createSubject($blis->id, [
            'code' => 'LIS 108',
            'name' => 'Mngt of Libraries & Info Centers',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['LICT101'] = $this->createSubject($blis->id, [
            'code' => 'LICT 101',
            'name' => 'Info Processing & Handling in Lib & Inf',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ]);

        $subjects['STS1'] = $this->createSubject($blis->id, [
            'code' => 'STS 1',
            'name' => 'Science, Technology, & Society',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EnglishA'] = $this->createSubject($blis->id, [
            'code' => 'ENGLISH A',
            'name' => 'Grammar & Speech Enhancement',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE3'] = $this->createSubject($blis->id, [
            'code' => 'PE 3',
            'name' => 'PATH FIT 3',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // SECOND YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['LIS109'] = $this->createSubject($blis->id, [
            'code' => 'LIS 109',
            'name' => 'Information Literacy',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS110'] = $this->createSubject($blis->id, [
            'code' => 'LIS 110',
            'name' => 'Library Materials for Children & Young',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS111'] = $this->createSubject($blis->id, [
            'code' => 'LIS 111',
            'name' => 'Intro to Records Mngt and Archives',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LICT102'] = $this->createSubject($blis->id, [
            'code' => 'LICT 102',
            'name' => 'Web Technologies in Libraries & Info Ce',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LISPT03'] = $this->createSubject($blis->id, [
            'code' => 'LISPT 03',
            'name' => 'Preservation of Info Resources',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Philo1'] = $this->createSubject($blis->id, [
            'code' => 'PHILO 1',
            'name' => 'Ethics',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Rizal'] = $this->createSubject($blis->id, [
            'code' => 'RIZAL',
            'name' => "Rizal's Life, Works, & Writings",
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['PE4'] = $this->createSubject($blis->id, [
            'code' => 'PE 4',
            'name' => 'PATH FIT 4',
            'units' => 2,
            'lecture_hours' => 2,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // THIRD YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['LIS112'] = $this->createSubject($blis->id, [
            'code' => 'LIS 112',
            'name' => 'Research Methods in LIS',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LICT103'] = $this->createSubject($blis->id, [
            'code' => 'LICT 103',
            'name' => 'Digital Libraries & Resources',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LICT104'] = $this->createSubject($blis->id, [
            'code' => 'LICT 104',
            'name' => 'Programming Fundamentals',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ]);

        $subjects['LISPT04'] = $this->createSubject($blis->id, [
            'code' => 'LISPT 04',
            'name' => 'Philosophies and Principles of Teaching',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LISPT05'] = $this->createSubject($blis->id, [
            'code' => 'LISPT 05',
            'name' => 'Educational Technology',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['Hum1'] = $this->createSubject($blis->id, [
            'code' => 'HUM 1',
            'name' => 'Arts Appreciation',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL1'] = $this->createSubject($blis->id, [
            'code' => 'GE EL1',
            'name' => 'Math, Science, & Tech Elective',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EP1S'] = $this->createSubject($blis->id, [
            'code' => 'EP 1S',
            'name' => 'English Proficiency 1 - Start',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // THIRD YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['LIS113'] = $this->createSubject($blis->id, [
            'code' => 'LIS 113',
            'name' => 'Thesis/Research Writing',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS114'] = $this->createSubject($blis->id, [
            'code' => 'LIS 114',
            'name' => 'Collection Mngt in Academic Libraries',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS115'] = $this->createSubject($blis->id, [
            'code' => 'LIS 115',
            'name' => 'Info Sources & Services in Acad Librari',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LICT105'] = $this->createSubject($blis->id, [
            'code' => 'LICT 105',
            'name' => 'SAD in LIS',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ]);

        $subjects['LICT106'] = $this->createSubject($blis->id, [
            'code' => 'LICT 106',
            'name' => 'Database Design for Libraries',
            'units' => 3,
            'lecture_hours' => 2,
            'lab_hours' => 1,
        ]);

        $subjects['GEEL2'] = $this->createSubject($blis->id, [
            'code' => 'GE EL2',
            'name' => 'Soc. Sci. & Philo Elective: Gender & Soci',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['EP1A'] = $this->createSubject($blis->id, [
            'code' => 'EP 1A',
            'name' => 'English Proficiency 1 - Accelerate',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // FOURTH YEAR - FIRST SEMESTER
        // =====================================================
        $subjects['LIS116'] = $this->createSubject($blis->id, [
            'code' => 'LIS 116',
            'name' => 'Org of Info Resources in Acad Librarie',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS117'] = $this->createSubject($blis->id, [
            'code' => 'LIS 117',
            'name' => 'Indexing and Abstracting in Acad Libra',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS118'] = $this->createSubject($blis->id, [
            'code' => 'LIS 118',
            'name' => 'Cataloging, Indexing, & IT Evaluation',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS119'] = $this->createSubject($blis->id, [
            'code' => 'LIS 119',
            'name' => 'Library Practice (In-Campus) 200 hrs',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['LIS120'] = $this->createSubject($blis->id, [
            'code' => 'LIS 120',
            'name' => 'Indigenous Knowledge & Multi-Cultur',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['GEEL3'] = $this->createSubject($blis->id, [
            'code' => 'GE EL3',
            'name' => 'Arts and Humanities Elective',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // FOURTH YEAR - SECOND SEMESTER
        // =====================================================
        $subjects['LIS121'] = $this->createSubject($blis->id, [
            'code' => 'LIS 121',
            'name' => 'Foreign Language',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        $subjects['LIS122'] = $this->createSubject($blis->id, [
            'code' => 'LIS 122',
            'name' => 'Library Practice II (Off-Campus) 200 hrs',
            'units' => 3,
            'lecture_hours' => 0,
            'lab_hours' => 3,
        ]);

        $subjects['LIS123'] = $this->createSubject($blis->id, [
            'code' => 'LIS 123',
            'name' => 'Mngt & Org, Reference, Selection Eval',
            'units' => 3,
            'lecture_hours' => 3,
            'lab_hours' => 0,
        ]);

        // =====================================================
        // SET UP PREREQUISITES
        // =====================================================
        $this->setupPrerequisites($subjects);

        $this->command->info('BLIS subjects seeded successfully with prerequisites!');
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
            // LIS 102 requires LIS 101
            'LIS102' => ['LIS101'],
            // LIS 103 requires LIS 101
            'LIS103' => ['LIS101'],
            // LIS 104 requires LIS 101
            'LIS104' => ['LIS101'],
            // LIS 105 requires LIS 103
            'LIS105' => ['LIS103'],
            // LIS 106 requires LIS 104
            'LIS106' => ['LIS104'],
            // LIS 107 requires LIS 104
            'LIS107' => ['LIS104'],
            // LIS 108 requires LIS 102
            'LIS108' => ['LIS102'],
            // LIS 109 requires LIS 103
            'LIS109' => ['LIS103'],
            // LIS 110 requires LIS 103
            'LIS110' => ['LIS103'],
            // LIS 111 requires LIS 102
            'LIS111' => ['LIS102'],
            // LIS 112 requires 3rd Yr. Standing (we'll use LIS108 as proxy)
            'LIS112' => ['LIS108'],
            // LIS 113 requires LIS 112
            'LIS113' => ['LIS112'],
            // LIS 114 requires LIS 102
            'LIS114' => ['LIS102'],
            // LIS 115 requires LIS 103
            'LIS115' => ['LIS103'],
            // LIS 116 requires LIS 106
            'LIS116' => ['LIS106'],
            // LIS 117 requires LIS 107
            'LIS117' => ['LIS107'],
            // LIS 118 requires LIS 106 and LIS 107
            'LIS118' => ['LIS106', 'LIS107'],
            // LIS 119 requires 4th Yr. Standing (we'll use LIS113 as proxy)
            'LIS119' => ['LIS113'],
            // LIS 122 requires LIS 119
            'LIS122' => ['LIS119'],
            // LIS 123 requires LIS 108 and LIS 115
            'LIS123' => ['LIS108', 'LIS115'],
            
            // LICT 101 requires ICT 1
            'LICT101' => ['ICT1'],
            // LICT 102 requires LICT 101
            'LICT102' => ['LICT101'],
            // LICT 103 requires LICT 102
            'LICT103' => ['LICT102'],
            // LICT 104 requires LICT 101
            'LICT104' => ['LICT101'],
            // LICT 105 requires LICT 103
            'LICT105' => ['LICT103'],
            // LICT 106 requires LICT 104
            'LICT106' => ['LICT104'],
            
            // LISPT 02 requires LISPT 01
            'LISPT02' => ['LISPT01'],
            // LISPT 03 requires LISPT 02
            'LISPT03' => ['LISPT02'],
            // LISPT 04 requires 3rd Yr. Standing (we'll use LIS108 as proxy)
            'LISPT04' => ['LIS108'],
            // LISPT 05 requires LISPT 04
            'LISPT05' => ['LISPT04'],
            
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

