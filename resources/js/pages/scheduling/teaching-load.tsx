import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Calendar, Download, LayoutGrid, Printer, Table2, Users } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Schedule, type TimeSlot } from '@/types';

interface FacultyEntry {
    id: number;
    subject_code: string;
    display_code?: string;
    parallel_display_code?: string; // Combined code for parallel subjects (e.g., "ITP301/CSC101")
    block_number: number;
    subject_name: string;
    units: number;
    room: string;
    time: string;
    display_time: string;
    custom_start_time: string | null;
    custom_end_time: string | null;
    day: string;
    day_group: string;
    is_lab: boolean;
    year_level: string;
    session_group_id: string | null;
    time_slot_id?: number;
}

interface FacultyData {
    faculty_id: number | null;
    faculty_name: string;
    faculty_full_name: string;
    entries: FacultyEntry[];
    total_units: number;
}

interface Props {
    schedule: Schedule;
    entriesByFaculty: FacultyData[];
    timeSlots: TimeSlot[];
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

const dayColors: Record<string, string> = {
    monday: 'bg-blue-500 text-white',
    tuesday: 'bg-emerald-500 text-white',
    wednesday: 'bg-blue-500 text-white',
    thursday: 'bg-emerald-500 text-white',
    friday: 'bg-amber-500 text-white',
    saturday: 'bg-purple-500 text-white',
    sunday: 'bg-red-500 text-white',
};

const dayGroupColors: Record<string, string> = {
    MW: 'bg-green-100 dark:bg-green-900/30',
    TTH: 'bg-yellow-100 dark:bg-yellow-900/30',
    FRI: 'bg-red-100 dark:bg-red-900/30',
};

const dayGroupHeaderColors: Record<string, string> = {
    MW: 'bg-green-600 text-white',
    TTH: 'bg-yellow-600 text-white',
    FRI: 'bg-red-600 text-white',
};

export default function TeachingLoad({ schedule, entriesByFaculty, timeSlots }: Props) {
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Scheduling', href: '/scheduling' },
        { title: schedule.name, href: `/scheduling/${schedule.id}` },
        { title: 'Teaching Load', href: '#' },
    ];

    const handlePrint = () => {
        window.print();
    };

    // Group time slots by day group
    const timeSlotsByDayGroup = timeSlots.reduce(
        (acc, slot) => {
            const group = slot.day_group || 'OTHER';
            if (!acc[group]) acc[group] = [];
            acc[group].push(slot);
            return acc;
        },
        {} as Record<string, TimeSlot[]>
    );

    // Get entries for a specific faculty, time slot, and day group
    const getEntriesForCell = (facultyData: FacultyData, timeSlot: TimeSlot, dayGroup: string) => {
        return facultyData.entries.filter(
            (e) => e.time === timeSlot.name && e.day_group === dayGroup
        );
    };

    // Format time display from custom times or slot times
    const formatTimeRange = (entry: FacultyEntry) => {
        if (entry.custom_start_time && entry.custom_end_time) {
            const formatTime = (time: string) => {
                const [hours, minutes] = time.split(':');
                const h = parseInt(hours);
                
                // Safety check
                if (isNaN(h)) return time;

                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                return `${h12}:${minutes} ${ampm}`;
            };
            const start = formatTime(entry.custom_start_time);
            const end = formatTime(entry.custom_end_time);
            return `${start} - ${end}`;
        }
        return entry.display_time || entry.time;
    };

    // Calculate unique units for a faculty's entries
    const calculateUniqueUnits = (entries: FacultyEntry[]) => {
        const seen = new Set<string>();
        let total = 0;
        entries.forEach((entry) => {
            const key = `${entry.parallel_display_code || entry.display_code || entry.subject_code}-${entry.block_number}`;
            if (!seen.has(key)) {
                seen.add(key);
                total += entry.units;
            }
        });
        return total;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Teaching Load - ${schedule.name}`} />

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
                            <h1 className="text-2xl font-bold tracking-tight">Teaching Load</h1>
                            <p className="text-muted-foreground">
                                {schedule.academic_setup?.curriculum_name || 'N/A'} - {schedule.academic_setup?.semester} Sem ({schedule.academic_setup?.academic_year})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cards' | 'table')}>
                            <TabsList className="h-9">
                                <TabsTrigger value="cards" className="px-3">
                                    <LayoutGrid className="h-4 w-4 mr-1.5" />
                                    Cards
                                </TabsTrigger>
                                <TabsTrigger value="table" className="px-3">
                                    <Table2 className="h-4 w-4 mr-1.5" />
                                    Table
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <Button variant="default" asChild>
                            <a href={`/scheduling/${schedule.id}/export/teaching-load`}>
                                <Download className="mr-2 h-4 w-4" />
                                Export Excel
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/scheduling/${schedule.id}/registrar-template`}>
                                Registrar View
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block text-center mb-4">
                    <h1 className="text-lg font-bold uppercase">
                        {schedule.academic_setup?.department?.name}
                    </h1>
                    <h2 className="text-base font-semibold">TENTATIVE TEACHING LOAD</h2>
                    <p className="text-sm">
                        {schedule.academic_setup?.semester} Semester, SY {schedule.academic_setup?.academic_year}
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 print:grid-cols-4 print:gap-2">
                    <div className="rounded-lg border bg-card p-3 print:p-2">
                        <p className="text-muted-foreground text-xs">Total Faculty</p>
                        <p className="text-xl font-bold print:text-lg">{entriesByFaculty.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 print:p-2">
                        <p className="text-muted-foreground text-xs">Total Entries</p>
                        <p className="text-xl font-bold print:text-lg">
                            {entriesByFaculty.reduce((sum, f) => sum + f.entries.length, 0)}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 print:p-2">
                        <p className="text-muted-foreground text-xs">Total Units</p>
                        <p className="text-xl font-bold print:text-lg">
                            {entriesByFaculty.reduce((sum, f) => sum + calculateUniqueUnits(f.entries), 0)}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 print:p-2">
                        <p className="text-muted-foreground text-xs">Avg Units/Faculty</p>
                        <p className="text-xl font-bold print:text-lg">
                            {entriesByFaculty.length > 0
                                ? (entriesByFaculty.reduce((sum, f) => sum + calculateUniqueUnits(f.entries), 0) / entriesByFaculty.length).toFixed(1)
                                : 0}
                        </p>
                    </div>
                </div>

                {/* Card View */}
                {viewMode === 'cards' && (
                    <div
                        className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4"
                        style={{ columnFill: 'balance' }}
                    >
                        {entriesByFaculty.map((facultyData) => (
                            <div
                                key={facultyData.faculty_id ?? 'unassigned'}
                                className="break-inside-avoid rounded-lg border bg-card shadow-sm overflow-hidden print:break-inside-avoid"
                            >
                                {/* Faculty Header */}
                                <div className="bg-primary/10 dark:bg-primary/20 border-b px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 dark:bg-primary/30 print:hidden">
                                            <Users className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{facultyData.faculty_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{facultyData.faculty_full_name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Subject Entries */}
                                <div className="divide-y text-left">
                                    {Object.values(facultyData.entries.reduce((acc, entry) => {
                                        const key = `${entry.parallel_display_code || entry.display_code || entry.subject_code}-${entry.block_number}`;
                                        if (!acc[key]) {
                                            acc[key] = {
                                                display_key: key,
                                                subject_code: entry.subject_code,
                                                display_code: entry.display_code,
                                                parallel_display_code: entry.parallel_display_code,
                                                subject_name: entry.subject_name,
                                                units: entry.units,
                                                block_number: entry.block_number,
                                                year_level: entry.year_level,
                                                schedules: [],
                                            };
                                        }
                                        acc[key].schedules.push(entry);
                                        return acc;
                                    }, {} as Record<string, any>)).map((subject) => {
                                        // Helper to combine paired days
                                        const groupSchedules = (schedules: FacultyEntry[]) => {
                                            const grouped: Record<string, { days: string[], entry: FacultyEntry }> = {};
                                            schedules.forEach(s => {
                                                // Group by time, room, and custom times to ensure identical slots merge
                                                const key = `${s.room}-${s.time}-${s.custom_start_time || ''}-${s.custom_end_time || ''}`;
                                                if (!grouped[key]) grouped[key] = { days: [], entry: s };
                                                if (!grouped[key].days.includes(s.day)) grouped[key].days.push(s.day);
                                            });
                                            
                                            return Object.values(grouped).map(g => {
                                                const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                                                g.days.sort((a, b) => order.indexOf(a) - order.indexOf(b));
                                                return {
                                                    ...g.entry,
                                                    combined_days: g.days.map(d => dayAbbrev[d]).join('/'),
                                                    badge_color: dayColors[g.days[0]] || 'bg-gray-500 text-white'
                                                };
                                            });
                                        };

                                        const lecSchedules = groupSchedules(subject.schedules.filter((s: FacultyEntry) => !s.is_lab));
                                        const labSchedules = groupSchedules(subject.schedules.filter((s: FacultyEntry) => s.is_lab));

                                        return (
                                            <div
                                                key={subject.display_key}
                                                className="px-4 py-3 hover:bg-muted/30 transition-colors"
                                            >
                                                {/* Header Part: Code, Units */}
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-sm">
                                                            {subject.parallel_display_code || subject.display_code || subject.subject_code}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{subject.year_level} Year • Block {subject.block_number}</span>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                        {subject.units} units
                                                    </Badge>
                                                </div>

                                                {/* Schedules List */}
                                                <div className="space-y-2">
                                                    {/* Lecture Schedules */}
                                                    {lecSchedules.length > 0 && (
                                                        <div className="space-y-1">
                                                            {lecSchedules.map((sched: any) => (
                                                                <div key={sched.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            className={`text-[9px] px-1.5 py-0 h-4 font-medium ${sched.badge_color}`}
                                                                        >
                                                                            {sched.combined_days}
                                                                        </Badge>
                                                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                                                            LEC
                                                                        </Badge>
                                                                        <span className="text-muted-foreground">
                                                                             {formatTimeRange(sched)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-medium ml-2">{sched.room}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Divider if both exist */}
                                                    {lecSchedules.length > 0 && labSchedules.length > 0 && (
                                                        <div className="relative py-1">
                                                            <div className="absolute inset-0 flex items-center">
                                                                <span className="w-full border-t border-dashed border-gray-300 dark:border-gray-700" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Laboratory Schedules */}
                                                    {labSchedules.length > 0 && (
                                                        <div className="space-y-1">
                                                            {labSchedules.map((sched: any) => (
                                                                <div key={sched.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            className={`text-[9px] px-1.5 py-0 h-4 font-medium ${sched.badge_color}`}
                                                                        >
                                                                            {sched.combined_days}
                                                                        </Badge>
                                                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                                            LAB
                                                                        </Badge>
                                                                         <span className="text-muted-foreground">
                                                                             {formatTimeRange(sched)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-medium ml-2">{sched.room}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Total Footer */}
                                <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 bg-muted/50 border-t font-semibold text-sm">
                                    <span>Total Units</span>
                                    <span className="w-20"></span>
                                    <span className="w-12 text-center text-primary">{calculateUniqueUnits(facultyData.entries)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table View - Excel-like format */}
                {viewMode === 'table' && (
                    <div className="overflow-x-auto">
                        {(['MW', 'TTH', 'FRI'] as const).map((dayGroup) => {
                            const slots = timeSlotsByDayGroup[dayGroup];
                            if (!slots || slots.length === 0) return null;

                            return (
                                <div key={dayGroup} className="mb-8">
                                    {/* Day Group Header */}
                                    <div className={`px-4 py-2 font-bold text-sm ${dayGroupHeaderColors[dayGroup]}`}>
                                        {dayGroup}
                                    </div>

                                    <div className="overflow-x-auto border rounded-b-lg">
                                        <table className="w-full text-xs border-collapse min-w-max">
                                            <thead>
                                                {/* Faculty Names Row */}
                                                <tr className="bg-muted/50">
                                                    <th className="border p-2 font-bold text-left w-24 sticky left-0 bg-muted/50 z-10">
                                                        TIME
                                                    </th>
                                                    {entriesByFaculty.map((faculty) => (
                                                        <th
                                                            key={faculty.faculty_id ?? 'unassigned'}
                                                            colSpan={3}
                                                            className="border p-2 font-bold text-center min-w-48"
                                                        >
                                                            {faculty.faculty_name}
                                                        </th>
                                                    ))}
                                                </tr>
                                                {/* Sub-headers Row */}
                                                <tr className="bg-muted/30">
                                                    <th className="border p-1.5 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10"></th>
                                                    {entriesByFaculty.map((faculty) => (
                                                        <React.Fragment key={faculty.faculty_id ?? 'unassigned'}>
                                                            <th className="border p-1.5 font-medium text-muted-foreground text-center w-32">
                                                                SUBJECTS
                                                            </th>
                                                            <th className="border p-1.5 font-medium text-muted-foreground text-center w-16">
                                                                ROOM
                                                            </th>
                                                            <th className="border p-1.5 font-medium text-muted-foreground text-center w-12">
                                                                UNITS
                                                            </th>
                                                        </React.Fragment>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {slots.map((slot) => (
                                                    <tr key={slot.id} className="hover:bg-muted/20">
                                                        <td className="border p-2 font-bold text-xs whitespace-nowrap sticky left-0 bg-card z-10">
                                                            {slot.name}
                                                        </td>
                                                        {entriesByFaculty.map((faculty) => {
                                                            const cellEntries = getEntriesForCell(faculty, slot, dayGroup);

                                                            return (
                                                                <React.Fragment key={faculty.faculty_id ?? 'unassigned'}>
                                                                    {/* Subject Cell */}
                                                                    <td className={`border p-1.5 align-top ${cellEntries.length > 0 ? dayGroupColors[dayGroup] : ''}`}>
                                                                        {cellEntries.map((entry, idx) => (
                                                                            <div key={entry.id} className={idx > 0 ? 'mt-2 pt-2 border-t border-dashed' : ''}>
                                                                                <div className="font-semibold">
                                                                                    {entry.parallel_display_code || entry.display_code || entry.subject_code}
                                                                                    {entry.is_lab && <span className="text-orange-600 ml-1">(LAB)</span>}
                                                                                </div>
                                                                                <div className="text-[10px] text-muted-foreground">
                                                                                    {formatTimeRange(entry)}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </td>
                                                                    {/* Room Cell */}
                                                                    <td className={`border p-1.5 text-center align-top ${cellEntries.length > 0 ? dayGroupColors[dayGroup] : ''}`}>
                                                                        {cellEntries.map((entry, idx) => (
                                                                            <div key={entry.id} className={idx > 0 ? 'mt-2 pt-2 border-t border-dashed' : ''}>
                                                                                {entry.room}
                                                                            </div>
                                                                        ))}
                                                                    </td>
                                                                    {/* Units Cell */}
                                                                    <td className={`border p-1.5 text-center align-top font-medium ${cellEntries.length > 0 ? dayGroupColors[dayGroup] : ''}`}>
                                                                        {cellEntries.map((entry, idx) => (
                                                                            <div key={entry.id} className={idx > 0 ? 'mt-2 pt-2 border-t border-dashed' : ''}>
                                                                                {entry.units}
                                                                            </div>
                                                                        ))}
                                                                    </td>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {entriesByFaculty.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No teaching load data</p>
                        <p className="text-sm">Generate a schedule first to see faculty teaching loads.</p>
                    </div>
                )}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 0.4in;
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
