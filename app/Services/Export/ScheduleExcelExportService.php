<?php

namespace App\Services\Export;

use App\Models\Room;
use App\Models\Schedule;
use App\Models\TimeSlot;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ScheduleExcelExportService
{
    protected Schedule $schedule;
    protected array $dayGroups = ['MW', 'TTH', 'FRI'];

    protected array $dayGroupColors = [
        'MW' => 'C6EFCE',    // Light green
        'TTH' => 'FFEB9C',   // Light yellow
        'FRI' => 'FFC7CE',   // Light red/pink
    ];

    protected array $facultyColors = [
        0 => 'FFFFFF', // White
        1 => 'FFF2CC', // Light yellow
        2 => 'D9EAD3', // Light green
        3 => 'CFE2F3', // Light blue
        4 => 'FCE5CD', // Light orange
        5 => 'D9D2E9', // Light purple
        6 => 'EAD1DC', // Light pink
        7 => 'D0E0E3', // Light teal
    ];

    public function __construct(Schedule $schedule)
    {
        $this->schedule = $schedule->load([
            'academicSetup.course',
            'academicSetup.department',
            'academicSetup.yearLevels',
            'entries.room',
            'entries.timeSlot',
            'entries.academicSetupSubject.subject',
            'entries.academicSetupSubject.yearLevel',
            'entries.academicSetupSubject.courses', // Load courses for combined section codes
            'entries.faculty',
        ]);
    }

    /**
     * Export Teaching Load to Excel (Faculty columns by day group - all on one sheet)
     * Format: Header once per block, then MW/TTH/F sections stacked vertically
     */
    public function exportTeachingLoad(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Teaching Load');

        // Group entries by faculty
        $entriesByFaculty = $this->schedule->entries
            ->groupBy(fn($e) => $e->user_id ?? 'unassigned')
            ->map(function ($entries, $facultyId) {
                $faculty = $entries->first()->faculty;
                return [
                    'name' => $faculty ? strtoupper($faculty->lname) : 'UNASSIGNED',
                    'full_name' => $faculty
                        ? "{$faculty->fname}" . ($faculty->mname ? " {$faculty->mname[0]}." : "") . " {$faculty->lname}"
                        : 'To Be Assigned',
                    'entries' => $entries,
                ];
            })
            ->sortBy('name')
            ->values()
            ->toArray();

        // Configuration: how many faculty per horizontal block (for printing)
        $facultyPerBlock = 3;
        $facultyBlocks = array_chunk($entriesByFaculty, $facultyPerBlock);

        $academicSetup = $this->schedule->academicSetup;
        $departmentName = $academicSetup?->department?->name ?? 'COLLEGE OF COMPUTER STUDIES';
        $semester = $academicSetup?->semester ?? '';
        $academicYear = $academicSetup?->academic_year ?? '';

        // Get time slots grouped by day
        $allTimeSlots = TimeSlot::active()->orderByPriority()->get();
        $timeSlotsByDayGroup = $allTimeSlots->groupBy('day_group');

        // For each block of faculty (horizontal blocks)
        foreach ($facultyBlocks as $blockIndex => $facultyBlock) {
            // Calculate column positions for this block
            // Each block starts at column: (blockIndex * (1 + facultyCount*3 + 1)) + 1
            $blockStartCol = ($blockIndex * (1 + count($facultyBlock) * 3 + 1)) + 1;
            $blockEndCol = $blockStartCol + count($facultyBlock) * 3;

            // === HEADER SECTION (only once per block, at the very top) ===
            $headerRow = 1;

            // College name header
            $sheet->setCellValue($this->getColumnLetter($blockStartCol) . $headerRow, strtoupper($departmentName));
            $sheet->mergeCells($this->getColumnLetter($blockStartCol) . $headerRow . ':' . $this->getColumnLetter($blockEndCol) . $headerRow);
            $sheet->getStyle($this->getColumnLetter($blockStartCol) . $headerRow)->getFont()->setBold(true)->setColor(new Color('FF0000'));

            // Tentative Teaching Load
            $sheet->setCellValue($this->getColumnLetter($blockStartCol) . ($headerRow + 1), 'TENTATIVE TEACHING LOAD');
            $sheet->mergeCells($this->getColumnLetter($blockStartCol) . ($headerRow + 1) . ':' . $this->getColumnLetter($blockEndCol) . ($headerRow + 1));
            $sheet->getStyle($this->getColumnLetter($blockStartCol) . ($headerRow + 1))->getFont()->setBold(true);

            // Semester info
            $sheet->setCellValue($this->getColumnLetter($blockStartCol) . ($headerRow + 2), "{$semester} Semester, SY {$academicYear}");
            $sheet->mergeCells($this->getColumnLetter($blockStartCol) . ($headerRow + 2) . ':' . $this->getColumnLetter($blockEndCol) . ($headerRow + 2));
            $sheet->getStyle($this->getColumnLetter($blockStartCol) . ($headerRow + 2))->getFont()->setItalic(true);

            // Set time column width
            $sheet->getColumnDimension($this->getColumnLetter($blockStartCol))->setWidth(12);

            // Set faculty column widths
            $facultyCol = $blockStartCol + 1;
            foreach ($facultyBlock as $facultyData) {
                $sheet->getColumnDimension($this->getColumnLetter($facultyCol))->setWidth(14);
                $sheet->getColumnDimension($this->getColumnLetter($facultyCol + 1))->setWidth(8);
                $sheet->getColumnDimension($this->getColumnLetter($facultyCol + 2))->setWidth(6);
                $facultyCol += 3;
            }

            // Current row starts after header
            $currentRow = 5;

            // === DAY GROUP SECTIONS (MW, TTH, FRI stacked vertically) ===
            foreach ($this->dayGroups as $dayGroup) {
                $dayGroupSlots = $timeSlotsByDayGroup[$dayGroup] ?? collect();
                if ($dayGroupSlots->isEmpty()) continue;

                // Day group label + Faculty headers
                $dayGroupRow = $currentRow;

                // Day group label in first column
                $sheet->setCellValue($this->getColumnLetter($blockStartCol) . $dayGroupRow, $dayGroup);
                $sheet->getStyle($this->getColumnLetter($blockStartCol) . $dayGroupRow)->getFont()->setBold(true)->setSize(11);

                // Faculty headers
                $facultyCol = $blockStartCol + 1;
                foreach ($facultyBlock as $facultyData) {
                    $startColLetter = $this->getColumnLetter($facultyCol);
                    $endColLetter = $this->getColumnLetter($facultyCol + 2);

                    // Faculty name
                    $sheet->setCellValue("{$startColLetter}{$dayGroupRow}", $facultyData['name']);
                    $sheet->mergeCells("{$startColLetter}{$dayGroupRow}:{$endColLetter}{$dayGroupRow}");
                    $sheet->getStyle("{$startColLetter}{$dayGroupRow}")->getFont()->setBold(true);
                    $sheet->getStyle("{$startColLetter}{$dayGroupRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    // Full name
                    $sheet->setCellValue("{$startColLetter}" . ($dayGroupRow + 1), $facultyData['full_name']);
                    $sheet->mergeCells("{$startColLetter}" . ($dayGroupRow + 1) . ":{$endColLetter}" . ($dayGroupRow + 1));
                    $sheet->getStyle("{$startColLetter}" . ($dayGroupRow + 1))->getFont()->setSize(9)->setItalic(true);

                    $facultyCol += 3;
                }

                // Column headers row
                $columnHeaderRow = $dayGroupRow + 2;
                $sheet->setCellValue($this->getColumnLetter($blockStartCol) . $columnHeaderRow, '');

                $facultyCol = $blockStartCol + 1;
                foreach ($facultyBlock as $facultyData) {
                    $sheet->setCellValue($this->getColumnLetter($facultyCol) . $columnHeaderRow, 'SUBJECTS');
                    $sheet->setCellValue($this->getColumnLetter($facultyCol + 1) . $columnHeaderRow, 'ROOM');
                    $sheet->setCellValue($this->getColumnLetter($facultyCol + 2) . $columnHeaderRow, 'UNITS');
                    $sheet->getStyle($this->getColumnLetter($facultyCol) . $columnHeaderRow . ':' . $this->getColumnLetter($facultyCol + 2) . $columnHeaderRow)
                        ->getFont()->setBold(true)->setSize(9);
                    $sheet->getStyle($this->getColumnLetter($facultyCol) . $columnHeaderRow . ':' . $this->getColumnLetter($facultyCol + 2) . $columnHeaderRow)
                        ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
                    $facultyCol += 3;
                }

                // Data rows
                $dataStartRow = $columnHeaderRow + 1;
                $dataRow = $dataStartRow;

                foreach ($dayGroupSlots as $timeSlot) {
                    // Time column
                    $sheet->setCellValue($this->getColumnLetter($blockStartCol) . $dataRow, $timeSlot->name);
                    $sheet->getStyle($this->getColumnLetter($blockStartCol) . $dataRow)->getFont()->setBold(true)->setSize(9);

                    // Faculty data
                    $facultyCol = $blockStartCol + 1;
                    foreach ($facultyBlock as $facultyData) {
                        $startColLetter = $this->getColumnLetter($facultyCol);

                        $slotEntries = collect($facultyData['entries'])->filter(function ($entry) use ($timeSlot) {
                            return $entry->time_slot_id === $timeSlot->id;
                        });

                    foreach ($slotEntries as $entry) {
                        $setupSubject = $entry->academicSetupSubject;
                        $subject = $setupSubject?->subject;
                        $yearLevel = $setupSubject?->yearLevel?->year_level;
                        $blockNumber = $setupSubject?->block_number ?? 1;

                        // Use parallel_display_code for parallel subjects, then display_code, then base code
                        $parallelCode = $setupSubject?->parallel_display_code;
                        $subjectText = (!empty($parallelCode) ? $parallelCode : $setupSubject?->display_code) ?? $subject?->code ?? '';
                        if ($entry->is_lab_session) {
                            $subjectText .= ' (LAB)';
                        }

                            $sheet->setCellValue("{$startColLetter}{$dataRow}", $subjectText);
                            $sheet->getStyle("{$startColLetter}{$dataRow}")->getFont()->setSize(9);

                            $sheet->setCellValue($this->getColumnLetter($facultyCol + 1) . $dataRow, $entry->room?->name ?? '');
                            $sheet->getStyle($this->getColumnLetter($facultyCol + 1) . $dataRow)->getFont()->setSize(9);

                            $sheet->setCellValue($this->getColumnLetter($facultyCol + 2) . $dataRow, $subject?->units ?? '');
                            $sheet->getStyle($this->getColumnLetter($facultyCol + 2) . $dataRow)->getFont()->setSize(9);

                            $dayColor = $this->getDayColor($entry->day);
                            $sheet->getStyle("{$startColLetter}{$dataRow}:" . $this->getColumnLetter($facultyCol + 2) . $dataRow)
                                ->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($dayColor);

                            $dayAbbrev = $this->getDayAbbrev($entry->day);
                            $sheet->getComment("{$startColLetter}{$dataRow}")->getText()
                                ->createTextRun("{$dayAbbrev} - {$yearLevel} Year");
                        }

                        $facultyCol += 3;
                    }

                    $sheet->getRowDimension($dataRow)->setRowHeight(20);
                    $dataRow++;
                }

                // Add borders for this day group section
                $lastDataRow = $dataRow - 1;
                $sheet->getStyle(
                    $this->getColumnLetter($blockStartCol) . $dataStartRow . ':' .
                    $this->getColumnLetter($blockEndCol) . $lastDataRow
                )->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

                // Move to next day group (add 2 empty rows)
                $currentRow = $dataRow + 2;
            }
        }

        $courseCode = $academicSetup?->course?->code ?? 'Schedule';
        return $this->downloadResponse($spreadsheet, "Teaching_Load_{$courseCode}");
    }

    /**
     * Export Room Allocation to Excel (Rooms as columns, time as rows)
     * All day groups (MW, TTH, FRI) on one sheet
     */
    public function exportRoomAllocation(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Room Allocation');

        $rooms = Room::where('is_active', true)->orderBy('priority')->get();
        $timeSlots = TimeSlot::active()->orderByPriority()->get();

        $academicSetup = $this->schedule->academicSetup;
        $departmentName = $academicSetup?->department?->name ?? 'COLLEGE OF COMPUTER STUDIES';
        $semester = $academicSetup?->semester ?? '';
        $academicYear = $academicSetup?->academic_year ?? '';

        // Separate Lecture and Lab rooms
        $lectureRooms = $rooms->where('room_type', 'lecture')->values();
        $labRooms = $rooms->where('room_type', 'laboratory')->values();
        $allRooms = $lectureRooms->merge($labRooms);

        // Calculate total columns
        $totalCols = 1 + $allRooms->count(); // Time column + room columns
        $lastCol = $this->getColumnLetter($totalCols);

        // === HEADER SECTION ===
        $sheet->setCellValue('A1', strtoupper($departmentName));
        $sheet->setCellValue('A2', 'TENTATIVE CLASS SCHEDULE');
        $sheet->setCellValue('A3', "{$semester} Semester, SY {$academicYear}");

        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->mergeCells("A3:{$lastCol}3");

        $sheet->getStyle('A1:A3')->getFont()->setBold(true);
        $sheet->getStyle('A1:A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A1')->getFont()->setColor(new Color('FF0000'));

        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(14); // Time column

        // Set room column widths (matching the format)
        $col = 2;
        foreach ($allRooms as $room) {
            $colLetter = $this->getColumnLetter($col);
            $sheet->getColumnDimension($colLetter)->setWidth(12);
            $col++;
        }

        // === BUILD EACH DAY GROUP SECTION ===
        $currentRow = 5;

        foreach ($this->dayGroups as $dayGroup) {
            $dayGroupSlots = $timeSlots->where('day_group', $dayGroup);
            if ($dayGroupSlots->isEmpty()) continue;

            // Day group label row
            $dayGroupRow = $currentRow;
            $sheet->setCellValue('A' . $dayGroupRow, $dayGroup);
            $sheet->getStyle('A' . $dayGroupRow)->getFont()->setBold(true)->setSize(11);

            // Room type headers row (LECTURE and LABORATORY)
            $roomTypeRow = $dayGroupRow + 1;
            $col = 2;

            // LECTURE header
            if ($lectureRooms->count() > 0) {
                $startLectureCol = $col;
                $endLectureCol = $col + $lectureRooms->count() - 1;
                $sheet->setCellValue($this->getColumnLetter($startLectureCol) . $roomTypeRow, 'LECTURE');
                $sheet->mergeCells(
                    $this->getColumnLetter($startLectureCol) . $roomTypeRow . ':' .
                    $this->getColumnLetter($endLectureCol) . $roomTypeRow
                );
                $sheet->getStyle($this->getColumnLetter($startLectureCol) . $roomTypeRow)
                    ->getFont()->setBold(true);
                $sheet->getStyle($this->getColumnLetter($startLectureCol) . $roomTypeRow)
                    ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                $col = $endLectureCol + 1;
            }

            // LABORATORY header
            if ($labRooms->count() > 0) {
                $startLabCol = $col;
                $endLabCol = $col + $labRooms->count() - 1;
                $sheet->setCellValue($this->getColumnLetter($startLabCol) . $roomTypeRow, 'LABORATORY');
                $sheet->mergeCells(
                    $this->getColumnLetter($startLabCol) . $roomTypeRow . ':' .
                    $this->getColumnLetter($endLabCol) . $roomTypeRow
                );
                $sheet->getStyle($this->getColumnLetter($startLabCol) . $roomTypeRow)
                    ->getFont()->setBold(true);
                $sheet->getStyle($this->getColumnLetter($startLabCol) . $roomTypeRow)
                    ->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle(
                    $this->getColumnLetter($startLabCol) . $roomTypeRow . ':' .
                    $this->getColumnLetter($endLabCol) . $roomTypeRow
                )->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFFF00'); // Yellow
            }

            // Room name headers row
            $roomHeaderRow = $roomTypeRow + 1;
            $col = 2;

            // Lecture room names
            foreach ($lectureRooms as $room) {
                $colLetter = $this->getColumnLetter($col);
                $sheet->setCellValue("{$colLetter}{$roomHeaderRow}", $room->name);
                $sheet->getStyle("{$colLetter}{$roomHeaderRow}")->getFont()->setBold(true)->setSize(9);
                $sheet->getStyle("{$colLetter}{$roomHeaderRow}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $col++;
            }

            // Lab room names (with yellow background)
            foreach ($labRooms as $room) {
                $colLetter = $this->getColumnLetter($col);
                $sheet->setCellValue("{$colLetter}{$roomHeaderRow}", $room->name);
                $sheet->getStyle("{$colLetter}{$roomHeaderRow}")->getFont()->setBold(true)->setSize(9);
                $sheet->getStyle("{$colLetter}{$roomHeaderRow}")->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("{$colLetter}{$roomHeaderRow}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFFF00'); // Yellow
                $col++;
            }

            // TIME column header
            $sheet->setCellValue('A' . $roomHeaderRow, 'TIME');
            $sheet->getStyle('A' . $roomHeaderRow)->getFont()->setBold(true);

            // Data rows
            $dataRow = $roomHeaderRow + 1;

            foreach ($dayGroupSlots as $timeSlot) {
                $sheet->setCellValue("A{$dataRow}", $timeSlot->name);
                $sheet->getStyle("A{$dataRow}")->getFont()->setBold(true)->setSize(9);

                $col = 2;
                foreach ($allRooms as $room) {
                    $colLetter = $this->getColumnLetter($col);

                    // Find entries for this room, time slot, and day group
                    $entries = $this->schedule->entries->filter(function ($entry) use ($room, $timeSlot, $dayGroup) {
                        return $entry->room_id === $room->id &&
                            $entry->time_slot_id === $timeSlot->id &&
                            $entry->timeSlot->day_group === $dayGroup;
                    });

                    if ($entries->count() > 0) {
                        $cellContent = [];
                        $dayColors = [];

                        foreach ($entries as $entry) {
                            $setupSubject = $entry->academicSetupSubject;
                            $faculty = $entry->faculty;

                            // Subject Code - use parallel_display_code for parallel subjects
                            // No day prefix since the section header (MW/TTH/FRI) already indicates the day group
                            $parallelCode = $setupSubject?->parallel_display_code;
                            $text = (!empty($parallelCode) ? $parallelCode : $setupSubject?->display_code) ?? $setupSubject?->subject?->code ?? 'N/A';
                            if ($entry->is_lab_session) {
                                $text .= ' (LAB)';
                            }

                            // Time Range (with AM/PM format)
                            $start = $entry->custom_start_time ? Carbon::parse($entry->custom_start_time) : Carbon::parse($timeSlot->start_time);
                            $end = $entry->custom_end_time ? Carbon::parse($entry->custom_end_time) : Carbon::parse($timeSlot->end_time);
                            $timeStr = $start->format('g:i A') . ' - ' . $end->format('g:i A');

                            // Instructor
                            $facultyName = 'TBA';
                            if ($faculty) {
                                $initial = $faculty->fname ? strtoupper(substr($faculty->fname, 0, 1)) . '.' : '';
                                $facultyName = $initial . ' ' . $faculty->lname;
                            }

                            $cellContent[] = "{$text}\n{$timeStr}\n{$facultyName}";
                            $dayColors[] = $this->getDayColor($entry->day);
                        }

                        $sheet->setCellValue("{$colLetter}{$dataRow}", implode("\n", $cellContent));
                        $sheet->getStyle("{$colLetter}{$dataRow}")->getAlignment()->setWrapText(true);

                        // Use color based on first entry's day, but differentiate M and W
                        $firstEntry = $entries->first();
                        $dayColor = $this->getDayColorForRoomAllocation($firstEntry->day, $dayGroup);
                        $sheet->getStyle("{$colLetter}{$dataRow}")->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()->setARGB($dayColor);
                    }

                    $sheet->getStyle("{$colLetter}{$dataRow}")->getFont()->setSize(8);
                    $sheet->getStyle("{$colLetter}{$dataRow}")->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                        ->setVertical(Alignment::VERTICAL_CENTER);

                    $col++;
                }

                $sheet->getRowDimension($dataRow)->setRowHeight(30);
                $dataRow++;
            }

            // Add borders for this day group section
            $lastDataRow = $dataRow - 1;
            $sheet->getStyle(
                "A{$dayGroupRow}:{$lastCol}{$lastDataRow}"
            )->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

            // Move to next day group (add 2 empty rows between sections)
            $currentRow = $dataRow + 2;
        }

        $courseCode = $this->schedule->academicSetup?->course?->code ?? 'Schedule';
        return $this->downloadResponse($spreadsheet, "Room_Allocation_{$courseCode}");
    }

    /**
     * Export Registrar Template to Excel (Section/Subject table)
     */
    public function exportRegistrarTemplate(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Schedule');

        $academicSetup = $this->schedule->academicSetup;
        $departmentName = $academicSetup?->department?->name ?? 'COLLEGE OF COMPUTER STUDIES';
        $semester = $academicSetup?->semester ?? '';
        $academicYear = $academicSetup?->academic_year ?? '';
        $courseName = $academicSetup?->course?->name ?? '';

        // Header
        $sheet->setCellValue('A1', strtoupper($departmentName));
        $sheet->setCellValue('A2', 'TENTATIVE SCHEDULE OF CLASSES');
        $sheet->setCellValue('A3', "{$semester} Semester S.V. {$academicYear}");
        $sheet->setCellValue('A4', $courseName);

        $sheet->mergeCells('A1:G1');
        $sheet->mergeCells('A2:G2');
        $sheet->mergeCells('A3:G3');
        $sheet->mergeCells('A4:G4');

        $sheet->getStyle('A1:A4')->getFont()->setBold(true);
        $sheet->getStyle('A1:A4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A2')->getFont()->setSize(14);

        // Column headers
        $headerRow = 6;
        $headers = ['Section Code', 'Subject Code', 'Subject with Descriptive Title', 'Time', 'Days', 'Room', 'Remarks'];
        $colWidths = [12, 12, 35, 14, 8, 10, 20];

        foreach ($headers as $index => $header) {
            $colLetter = $this->getColumnLetter($index + 1);
            $sheet->setCellValue("{$colLetter}{$headerRow}", $header);
            $sheet->getColumnDimension($colLetter)->setWidth($colWidths[$index]);
        }

        $sheet->getStyle("A{$headerRow}:G{$headerRow}")->getFont()->setBold(true);
        $sheet->getStyle("A{$headerRow}:G{$headerRow}")->getFill()
            ->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('D9D9D9');
        $sheet->getStyle("A{$headerRow}:G{$headerRow}")->getBorders()
            ->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        // Group entries by year level
        $entriesBySection = $this->schedule->entries
            ->groupBy(fn($e) => $e->academicSetupSubject?->yearLevel?->year_level ?? 'Unknown')
            ->sortBy(function ($entries, $yearLevel) {
                $order = ['1st' => 1, '2nd' => 2, '3rd' => 3, '4th' => 4, '5th' => 5];
                return $order[$yearLevel] ?? 99;
            });

        $dataRow = $headerRow + 1;
        $courseCode = $academicSetup?->course?->code ?? 'SEC';

        foreach ($entriesBySection as $yearLevel => $entries) {
            // Group by subject
            $subjectGroups = $entries->groupBy('academic_setup_subject_id');

            foreach ($subjectGroups as $subjectId => $subjectEntries) {
                $firstEntry = $subjectEntries->first();
                $setupSubject = $firstEntry->academicSetupSubject;
                $subject = $setupSubject?->subject;
                $faculty = $firstEntry->faculty;
                $blockNumber = $setupSubject?->block_number ?? 1;

                // Section code includes block: BSIT101 = BSIT + Year 1 + Block 01
                $yearNumber = match ($yearLevel) {
                    '1st' => '1', '2nd' => '2', '3rd' => '3', '4th' => '4', '5th' => '5',
                    default => '0',
                };
                $blockSuffix = str_pad($blockNumber, 2, '0', STR_PAD_LEFT);

                // Check if this block has multiple courses (fused/combined courses)
                $blockCourses = $setupSubject?->courses;
                if ($blockCourses && $blockCourses->count() > 1) {
                    // Generate combined section code for fused courses: BSCS201/BSIT201
                    $sectionCode = $blockCourses->map(function ($course) use ($yearNumber, $blockSuffix) {
                        return $course->code . $yearNumber . $blockSuffix;
                    })->sort()->implode('/');
                } else {
                    // Single course - use the block's course or fallback to academic setup course
                    $blockCourseCode = $blockCourses?->first()?->code ?? $courseCode;
                    $sectionCode = $blockCourseCode . $yearNumber . $blockSuffix;
                }

                // Collect all schedules for this subject
                $schedules = $subjectEntries->map(function ($entry) {
                    $timeStr = $entry->timeSlot?->name;

                    if ($entry->custom_start_time && $entry->custom_end_time) {
                        $start = Carbon::parse($entry->custom_start_time);
                        $end = Carbon::parse($entry->custom_end_time);
                        // Use AM/PM format for better readability
                        $timeStr = $start->format('g:i A') . ' - ' . $end->format('g:i A');
                    }

                    return [
                        'time' => $timeStr,
                        'day' => $this->getDayAbbrev($entry->day),
                        'room' => $entry->room?->name,
                        'is_lab' => $entry->is_lab_session,
                    ];
                });

                // If multiple schedules, create multiple rows
                $isFirst = true;
                // Get parallel_display_code for parallel subjects
                $parallelCode = $setupSubject?->parallel_display_code;
                $subjectCode = (!empty($parallelCode) ? $parallelCode : $setupSubject?->display_code) ?? $subject?->code ?? '';

                foreach ($schedules as $sched) {
                    if ($isFirst) {
                        $sheet->setCellValue("A{$dataRow}", $sectionCode);
                        // Use parallel_display_code for parallel subjects, then display_code
                        $sheet->setCellValue("B{$dataRow}", $subjectCode);
                        $sheet->setCellValue("C{$dataRow}", $subject?->name ?? '');
                    }

                    $sheet->setCellValue("D{$dataRow}", $sched['time'] ?? '');
                    $sheet->setCellValue("E{$dataRow}", $sched['day'] ?? '');
                    $sheet->setCellValue("F{$dataRow}", $sched['room'] ?? '');

                    if ($isFirst) {
                        $remarks = $faculty
                            ? "{$faculty->lname}, {$faculty->fname}" . ($faculty->mname ? " {$faculty->mname[0]}." : "")
                            : 'TBA';
                        if ($sched['is_lab']) {
                            $remarks .= ' (LAB)';
                        }
                        $sheet->setCellValue("G{$dataRow}", $remarks);
                    }

                    // Color based on day
                    $dayColor = $this->getDayColorByAbbrev($sched['day']);
                    $sheet->getStyle("D{$dataRow}:E{$dataRow}")->getFill()
                        ->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($dayColor);

                    $sheet->getStyle("A{$dataRow}:G{$dataRow}")->getFont()->setSize(10);
                    $sheet->getStyle("A{$dataRow}:G{$dataRow}")->getBorders()
                        ->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

                    $isFirst = false;
                    $dataRow++;
                }
            }

            // Add empty row between sections
            $dataRow++;
        }

        $courseCode = $this->schedule->academicSetup?->course?->code ?? 'Schedule';
        return $this->downloadResponse($spreadsheet, "Registrar_Template_{$courseCode}");
    }

    /**
     * Get column letter from number (1 = A, 2 = B, etc.)
     */
    protected function getColumnLetter(int $num): string
    {
        $letter = '';
        while ($num > 0) {
            $num--;
            $letter = chr(65 + ($num % 26)) . $letter;
            $num = intdiv($num, 26);
        }
        return $letter;
    }

    /**
     * Get day abbreviation
     */
    protected function getDayAbbrev(string $day): string
    {
        $abbrevs = [
            'monday' => 'M',
            'tuesday' => 'T',
            'wednesday' => 'W',
            'thursday' => 'TH',
            'friday' => 'F',
            'saturday' => 'S',
            'sunday' => 'SU',
        ];
        return $abbrevs[strtolower($day)] ?? $day;
    }

    /**
     * Get color for day
     */
    protected function getDayColor(string $day): string
    {
        $colors = [
            'monday' => 'C6EFCE',    // Green (MW)
            'wednesday' => 'C6EFCE',
            'tuesday' => 'FFEB9C',   // Yellow (TTH)
            'thursday' => 'FFEB9C',
            'friday' => 'FFC7CE',    // Red/Pink (FRI)
            'saturday' => 'D9D2E9',  // Purple
            'sunday' => 'FCE5CD',    // Orange
        ];
        return $colors[strtolower($day)] ?? 'FFFFFF';
    }

    /**
     * Get color for day in Room Allocation (different colors for M and W)
     */
    protected function getDayColorForRoomAllocation(string $day, string $dayGroup): string
    {
        $dayLower = strtolower($day);

        // Uniform colors per day group
        if ($dayGroup === 'MW') {
            return 'C6EFCE'; // Light Green
        }

        if ($dayGroup === 'TTH') {
            return 'FFD966'; // Orange/Gold
        }

        // For FRI, use the standard color
        if ($dayGroup === 'FRI') {
            return 'FFC7CE'; // Red/Pink
        }

        // Fallback to standard day color
        return $this->getDayColor($day);
    }

    /**
     * Get color by day abbreviation
     */
    protected function getDayColorByAbbrev(string $abbrev): string
    {
        $colors = [
            'M' => 'C6EFCE',
            'W' => 'C6EFCE',
            'T' => 'FFEB9C',
            'TH' => 'FFEB9C',
            'F' => 'FFC7CE',
            'S' => 'D9D2E9',
            'SU' => 'FCE5CD',
            'MW' => 'C6EFCE',
            'TTH' => 'FFEB9C',
        ];
        return $colors[strtoupper($abbrev)] ?? 'FFFFFF';
    }

    /**
     * Create download response
     */
    protected function downloadResponse(Spreadsheet $spreadsheet, string $filename): StreamedResponse
    {
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, "{$filename}_" . date('Y-m-d') . ".xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}

