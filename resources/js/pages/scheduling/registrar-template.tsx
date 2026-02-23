import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Schedule } from '@/types';

interface ScheduleDetail {
    time: string;
    custom_start_time: string | null;
    custom_end_time: string | null;
    display_time: string;
    day: string;
    day_group: string;
    room: string;
    is_lab: boolean;
    session_group_id: string | null;
}

interface SubjectEntry {
    subject_code: string;
    display_code?: string;
    parallel_display_code?: string; // Combined code for parallel subjects (e.g., "ITP301/CSC101")
    block_number: number;
    subject_name: string;
    units: number;
    lecture_hours: number;
    lab_hours: number;
    faculty_name: string;
    schedules: ScheduleDetail[];
}

interface SectionData {
    section_code: string;
    year_level: string;
    block_number: number;
    subjects: SubjectEntry[];
    total_units: number;
}

interface Props {
    schedule: Schedule;
    entriesBySection: SectionData[];
}

const dayAbbrev: Record<string, string> = {
    monday: 'M',
    tuesday: 'T',
    wednesday: 'W',
    thursday: 'TH',
    friday: 'F',
    saturday: 'S',
    sunday: 'SU',
};

const dayGroupLabels: Record<string, string> = {
    MW: 'MW',
    TTH: 'TTH',
    FRI: 'F',
    SAT: 'S',
    SUN: 'SU',
};

export default function RegistrarTemplate({ schedule, entriesBySection }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Scheduling', href: '/scheduling' },
        { title: schedule.name, href: `/scheduling/${schedule.id}` },
        { title: 'Registrar Template', href: '#' },
    ];

    const handlePrint = () => {
        window.print();
    };

    // Format time string (HH:mm) to display format (h:mm AM/PM)
    const formatTime = (timeString: string | null): string => {
        if (!timeString) return '';
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch {
            return timeString;
        }
    };

    // Format schedule display: combine similar day groups and show custom times
    const formatSchedule = (schedules: ScheduleDetail[]) => {
        // Group by session_group_id if available, otherwise by day_group and time
        const grouped = schedules.reduce((acc, s) => {
            const key = s.session_group_id || `${s.time}-${s.day_group}`;
            if (!acc[key]) {
                // Calculate display time
                let displayTime = s.time;
                if (s.custom_start_time && s.custom_end_time) {
                    displayTime = `${formatTime(s.custom_start_time)} - ${formatTime(s.custom_end_time)}`;
                }

                acc[key] = {
                    time: s.time,
                    display_time: displayTime,
                    custom_start_time: s.custom_start_time,
                    custom_end_time: s.custom_end_time,
                    day_group: s.day_group,
                    days: [],
                    room: s.room,
                    is_lab: s.is_lab,
                };
            }
            if (!acc[key].days.includes(s.day)) {
                acc[key].days.push(s.day);
            }
            return acc;
        }, {} as Record<string, { time: string; display_time: string; custom_start_time: string | null; custom_end_time: string | null; day_group: string; days: string[]; room: string; is_lab: boolean }>);

        return Object.values(grouped);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Registrar Template - ${schedule.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 print:p-2">
                {/* Header - Hidden on print */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/scheduling/${schedule.id}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Registrar Template</h1>
                            <p className="text-muted-foreground">
                                {schedule.academic_setup?.curriculum_name || 'N/A'} - {schedule.academic_setup?.semester} Sem ({schedule.academic_setup?.academic_year})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <Button variant="default" asChild>
                            <a href={`/scheduling/${schedule.id}/export/registrar-template`}>
                                <Download className="mr-2 h-4 w-4" />
                                Export Excel
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/scheduling/${schedule.id}/teaching-load`}>
                                Teaching Load
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block text-center mb-6">
                    <p className="text-xs mb-1">{schedule.academic_setup?.department?.name}</p>
                    <h1 className="text-base font-bold uppercase">TENTATIVE SCHEDULE OF CLASSES</h1>
                    <p className="text-sm">
                        {schedule.academic_setup?.semester} Semester S.V. {schedule.academic_setup?.academic_year}
                    </p>
                    <p className="text-sm font-medium mt-1">
                        {schedule.academic_setup?.courses && schedule.academic_setup.courses.length > 0
                            ? schedule.academic_setup.courses.map((c) => c.name).join(' / ')
                            : schedule.academic_setup?.course?.name}
                    </p>
                </div>

                {/* Registrar Table per Section */}
                {entriesBySection.map((section) => (
                    <div key={section.section_code} className="space-y-3 print:break-inside-avoid print:mb-8">
                        {/* Section Header */}
                        <div className="flex items-center justify-between print:justify-start print:gap-4">
                            <h2 className="text-lg font-semibold print:text-base">
                                Section: {section.section_code} ({section.year_level} Year - Block {section.block_number})
                            </h2>
                            <Badge variant="outline" className="print:hidden">
                                {section.total_units} Units
                            </Badge>
                        </div>

                        {/* Registrar-style Table */}
                        <div className="rounded-lg border print:rounded-none">
                            <Table className="w-full text-sm border-collapse">
                                <TableHeader>
                                    <TableRow className="bg-muted/50 print:bg-gray-100 hover:bg-muted/50">
                                        <TableHead className="border px-3 py-2 text-left font-semibold w-24 print:w-20 text-black">
                                            Section Code
                                        </TableHead>
                                        <TableHead className="border px-3 py-2 text-left font-semibold w-24 print:w-20 text-black">
                                            Subject Code
                                        </TableHead>
                                        <TableHead className="border px-3 py-2 text-left font-semibold min-w-[200px] text-black">
                                            Subject with Descriptive Title
                                        </TableHead>
                                        <TableHead className="border px-3 py-2 text-center font-semibold w-28 text-black">
                                            Time
                                        </TableHead>
                                        <TableHead className="border px-3 py-2 text-center font-semibold w-16 text-black">
                                            Days
                                        </TableHead>
                                        <TableHead className="border px-3 py-2 text-center font-semibold w-20 text-black">
                                            Room
                                        </TableHead>
                                        <TableHead className="border px-3 py-2 text-left font-semibold min-w-[120px] text-black">
                                            Remarks
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {section.subjects.map((subject, subIdx) => {
                                        const formattedSchedules = formatSchedule(subject.schedules);

                                        return formattedSchedules.map((sched, schedIdx) => (
                                            <TableRow
                                                key={`${subject.subject_code}-${schedIdx}`}
                                                className={subIdx % 2 === 0 ? 'bg-white dark:bg-transparent hover:bg-white' : 'bg-muted/20 hover:bg-muted/20'}
                                            >
                                                {/* Section Code - Only on first row of subject */}
                                                {schedIdx === 0 && (
                                                    <TableCell
                                                        className="border px-3 py-2 font-medium"
                                                        rowSpan={formattedSchedules.length}
                                                    >
                                                        {section.section_code}
                                                    </TableCell>
                                                )}

                                                {/* Subject Code - Only on first row */}
                                                {schedIdx === 0 && (
                                                    <TableCell
                                                        className="border px-3 py-2 font-medium"
                                                        rowSpan={formattedSchedules.length}
                                                    >
                                                        {subject.parallel_display_code || subject.display_code || subject.subject_code}
                                                    </TableCell>
                                                )}

                                                {/* Subject Name - Only on first row */}
                                                {schedIdx === 0 && (
                                                    <TableCell
                                                        className="border px-3 py-2"
                                                        rowSpan={formattedSchedules.length}
                                                    >
                                                        <div>
                                                            <p className="font-medium">{subject.subject_name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {subject.units} units ({subject.lecture_hours}L + {subject.lab_hours}Lab)
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                )}

                                                {/* Time */}
                                                <TableCell className="border px-3 py-2 text-center">
                                                    <div>
                                                        <span className="whitespace-nowrap">{sched.display_time}</span>
                                                        {sched.custom_start_time && sched.custom_end_time && sched.display_time !== sched.time && (
                                                            <p className="text-[10px] text-muted-foreground">
                                                                (Slot: {sched.time})
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Days */}
                                                <TableCell className="border px-3 py-2 text-center">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {dayGroupLabels[sched.day_group] || sched.days.map(d => dayAbbrev[d] || d).join('')}
                                                    </Badge>
                                                </TableCell>

                                                {/* Room */}
                                                <TableCell className="border px-3 py-2 text-center font-medium">
                                                    {sched.room}
                                                </TableCell>

                                                {/* Remarks - Only on first row */}
                                                {schedIdx === 0 && (
                                                    <TableCell
                                                        className="border px-3 py-2 text-xs"
                                                        rowSpan={formattedSchedules.length}
                                                    >
                                                        <p>{subject.faculty_name}</p>
                                                        {sched.is_lab && (
                                                            <Badge variant="outline" className="mt-1 text-[10px]">
                                                                LAB
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ));
                                    })}

                                    {/* Total Row */}
                                    <TableRow className="bg-muted/50 font-semibold print:bg-gray-100 hover:bg-muted/50">
                                        <TableCell className="border px-3 py-2" colSpan={2}>Total</TableCell>
                                        <TableCell className="border px-3 py-2">
                                            {section.subjects.length} subject(s)
                                        </TableCell>
                                        <TableCell className="border px-3 py-2 text-center" colSpan={3}>
                                            {section.total_units} units
                                        </TableCell>
                                        <TableCell className="border px-3 py-2"></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}

                {/* Overall Summary - Hidden on print */}
                <div className="grid gap-4 md:grid-cols-4 print:hidden">
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Total Sections</p>
                        <p className="text-2xl font-bold">{entriesBySection.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Total Subjects</p>
                        <p className="text-2xl font-bold">
                            {entriesBySection.reduce((sum, s) => sum + s.subjects.length, 0)}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Total Units</p>
                        <p className="text-2xl font-bold">
                            {entriesBySection.reduce((sum, s) => sum + s.total_units, 0)}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Schedule Status</p>
                        <Badge variant={schedule.status === 'published' ? 'default' : 'secondary'} className="mt-1">
                            {schedule.status}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: portrait;
                        margin: 0.5in;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .break-inside-avoid {
                        break-inside: avoid;
                    }
                }
            `}</style>
        </AppLayout>
    );
}

