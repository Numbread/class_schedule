import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Calendar, Check, ChevronsUpDown, LayoutGrid, Printer, Table2 } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type TimeSlot } from '@/types';

interface FacultyEntry {
    id: number;
    subject_code: string;
    display_code?: string;
    parallel_display_code?: string;
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

interface ScheduleInfo {
    id: number;
    name: string;
    status: string;
    department?: string;
    academic_year?: string;
    semester?: string;
    curriculum_name?: string;
    created_at?: string;
}

interface Props {
    schedules: ScheduleInfo[];
    selectedSchedule: ScheduleInfo | null;
    entries: FacultyEntry[];
    totalUnits: number;
    timeSlots: TimeSlot[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '#' },
    { title: 'My Teaching Load', href: '/faculty/teaching-load' },
];

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

export default function FacultyTeachingLoad({
    schedules,
    selectedSchedule,
    entries,
    totalUnits,
    timeSlots,
}: Props) {
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    const handleScheduleChange = (value: string) => {
        router.get(
            '/faculty/teaching-load',
            { schedule_id: value },
            { preserveState: true, preserveScroll: true }
        );
    };

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

    // Get entries for a specific time slot and day group
    const getEntriesForCell = (timeSlot: TimeSlot, dayGroup: string) => {
        return entries.filter(
            (e) => e.time === timeSlot.name && e.day_group === dayGroup
        );
    };

    // Format time range from custom times
    const formatTimeRange = (entry: FacultyEntry) => {
        if (entry.custom_start_time && entry.custom_end_time && entry.custom_start_time !== entry.custom_end_time) {
            const formatTime = (time: string) => {
                const [hours, minutes] = time.split(':');
                const h = parseInt(hours);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h % 12 || 12;
                return `${h12}:${minutes} ${ampm}`;
            };
            const startStr = formatTime(entry.custom_start_time);
            const endStr = formatTime(entry.custom_end_time);
            
            if (startStr !== endStr) {
                return `${startStr} - ${endStr}`;
            }
        }
        return entry.display_time || entry.time;
    };

    // Calculate summary stats
    const totalSubjects = new Set(entries.map(e => e.session_group_id || `${e.subject_code}-${e.block_number}`)).size;
    const totalHours = entries.reduce((sum, e) => {
        if (e.custom_start_time && e.custom_end_time) {
            const start = e.custom_start_time.split(':').map(Number);
            const end = e.custom_end_time.split(':').map(Number);
            // Ensure we have valid numbers
            if (!isNaN(start[0]) && !isNaN(start[1]) && !isNaN(end[0]) && !isNaN(end[1])) {
                return sum + ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1]));
            }
        }
        return sum + 90; // default 1.5 hours
    }, 0) / 60;

    // Group entries by subject for card view
    const entriesBySubject = entries.reduce((acc, entry) => {
        // Combined key using display code to ensure Lec/Lab and parallel subjects merge
        const key = `${entry.parallel_display_code || entry.display_code || entry.subject_code}-${entry.block_number}`;
        
        if (!acc[key]) {
            acc[key] = {
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
        acc[key].schedules.push({
            id: entry.id,
            day: entry.day,
            time: entry.time,
            display_time: entry.display_time,
            room: entry.room,
            is_lab: entry.is_lab, // Track type per schedule
        });
        return acc;
    }, {} as Record<string, {
        subject_code: string;
        display_code?: string;
        parallel_display_code?: string;
        subject_name: string;
        units: number;
        block_number: number;
        year_level: string;
        schedules: { id: number; day: string; time: string; display_time: string; room: string; is_lab: boolean }[];
    }>);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Teaching Load" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 print:p-2">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/faculty/schedule">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">My Teaching Load</h1>
                            <p className="text-muted-foreground">
                                {selectedSchedule?.curriculum_name || 'N/A'} - {selectedSchedule?.semester} Sem ({selectedSchedule?.academic_year})
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

                        {/* Schedule Selector */}
                        {schedules.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-auto py-2 px-3 flex flex-col items-end gap-1 min-w-[200px] border-dashed hover:border-solid hover:bg-accent/50 transition-all text-right"
                                    >
                                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
                                            {selectedSchedule?.status === 'published' ? (
                                                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                                    </span>
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    Tentative
                                                </span>
                                            )}
                                            <span className="text-muted-foreground/30">•</span>
                                            <span className="text-muted-foreground truncate max-w-[150px]">
                                                {selectedSchedule?.department || 'General'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                            {selectedSchedule?.academic_year} {selectedSchedule?.semester} Sem
                                            <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[320px]">
                                    <DropdownMenuLabel>Available Schedules</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {schedules.map((schedule) => (
                                        <DropdownMenuItem
                                            key={schedule.id}
                                            onClick={() => handleScheduleChange(schedule.id.toString())}
                                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className="font-semibold text-sm">
                                                    {schedule.academic_year} {schedule.semester} Sem
                                                </span>
                                                {schedule.id === selectedSchedule?.id && <Check className="h-4 w-4 text-primary" />}
                                            </div>
                                            <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                                                <span>{schedule.department || 'General'}</span>
                                                <Badge variant={schedule.status === 'published' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                                    {schedule.status}
                                                </Badge>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block text-center mb-4">
                    <h1 className="text-lg font-bold uppercase">
                        {selectedSchedule?.department}
                    </h1>
                    <h2 className="text-base font-semibold">MY TEACHING LOAD</h2>
                    <p className="text-sm">
                        {selectedSchedule?.semester} Semester, SY {selectedSchedule?.academic_year}
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 print:grid-cols-4 print:gap-2">
                    <div className="rounded-lg border bg-card p-3 print:p-2">
                        <p className="text-muted-foreground text-xs">Total Subjects</p>
                        <p className="text-xl font-bold print:text-lg">{totalSubjects}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 print:p-2">
                        <p className="text-muted-foreground text-xs">Total Entries</p>
                        <p className="text-xl font-bold print:text-lg">{entries.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 print:p-2">
                        <p className="text-muted-foreground text-xs">Total Units</p>
                        <p className="text-xl font-bold print:text-lg">{totalUnits}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 print:p-2">
                        <p className="text-muted-foreground text-xs">Total Hours/Week</p>
                        <p className="text-xl font-bold print:text-lg">{totalHours.toFixed(1)}</p>
                    </div>
                </div>

                {entries.length === 0 ? (
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <CardTitle>No Teaching Load</CardTitle>
                            <CardDescription>
                                You don't have any assigned classes in the selected schedule.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <>
                        {/* Card View */}
                        {viewMode === 'cards' && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {Object.values(entriesBySubject).map((subject, index) => {
                                    const lecSchedules = subject.schedules.filter(s => !s.is_lab);
                                    const labSchedules = subject.schedules.filter(s => s.is_lab);

                                    return (
                                        <div
                                            key={index}
                                            className="rounded-lg border bg-card shadow-sm overflow-hidden"
                                        >
                                            {/* Subject Header */}
                                            <div className="bg-primary/10 dark:bg-primary/20 border-b px-4 py-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="font-bold text-sm">
                                                        {subject.parallel_display_code || subject.display_code || subject.subject_code}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                                            {subject.units} units
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {subject.subject_name}
                                                </p>
                                            </div>

                                            {/* Subject Details */}
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>{subject.year_level} Year • Block {subject.block_number}</span>
                                                </div>

                                                {/* Schedules */}
                                                <div className="space-y-2">
                                                    {/* Lecture Schedules */}
                                                    {lecSchedules.length > 0 && (
                                                        <div className="space-y-1">
                                                            {lecSchedules.map((sched) => (
                                                                <div
                                                                    key={sched.id}
                                                                    className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2 py-1.5"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            className={`text-[9px] px-1.5 py-0 h-4 font-medium ${dayColors[sched.day] || 'bg-gray-500 text-white'}`}
                                                                        >
                                                                            {dayAbbrev[sched.day] || sched.day}
                                                                        </Badge>
                                                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                                                            LEC
                                                                        </Badge>
                                                                        <span className="text-muted-foreground">
                                                                            {sched.display_time}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-medium">{sched.room}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Divider if both exist */}
                                                    {lecSchedules.length > 0 && labSchedules.length > 0 && (
                                                        <div className="relative py-2">
                                                            <div className="absolute inset-0 flex items-center">
                                                                <span className="w-full border-t border-dashed border-gray-300 dark:border-gray-700" />
                                                            </div>
                                                            <div className="relative flex justify-center text-[10px] uppercase">
                                                                <span className="bg-card px-2 text-muted-foreground">Laboratory</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Laboratory Schedules */}
                                                    {labSchedules.length > 0 && (
                                                        <div className="space-y-1">
                                                            {labSchedules.map((sched) => (
                                                                <div
                                                                    key={sched.id}
                                                                    className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2 py-1.5"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            className={`text-[9px] px-1.5 py-0 h-4 font-medium ${dayColors[sched.day] || 'bg-gray-500 text-white'}`}
                                                                        >
                                                                            {dayAbbrev[sched.day] || sched.day}
                                                                        </Badge>
                                                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                                            LAB
                                                                        </Badge>
                                                                        <span className="text-muted-foreground">
                                                                            {sched.display_time}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-medium">{sched.room}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Table View */}
                        {viewMode === 'table' && (
                            <div className="overflow-x-auto">
                                {(['MW', 'TTH', 'FRI'] as const).map((dayGroup) => {
                                    const slots = timeSlotsByDayGroup[dayGroup];
                                    if (!slots || slots.length === 0) return null;

                                    // Check if any entries exist for this day group
                                    const hasEntries = slots.some(slot =>
                                        getEntriesForCell(slot, dayGroup).length > 0
                                    );
                                    if (!hasEntries) return null;

                                    return (
                                        <div key={dayGroup} className="mb-6">
                                            {/* Day Group Header */}
                                            <div className={`px-4 py-2 font-bold text-sm rounded-t-lg ${dayGroupHeaderColors[dayGroup]}`}>
                                                {dayGroup === 'MW' ? 'Monday / Wednesday' : dayGroup === 'TTH' ? 'Tuesday / Thursday' : 'Friday'}
                                            </div>

                                            <div className="overflow-x-auto border border-t-0 rounded-b-lg">
                                                <table className="w-full text-sm border-collapse">
                                                    <thead>
                                                        <tr className="bg-muted/50">
                                                            <th className="border p-2 font-semibold text-left w-28">Time</th>
                                                            <th className="border p-2 font-semibold text-left">Subject</th>
                                                            <th className="border p-2 font-semibold text-center w-24">Room</th>
                                                            <th className="border p-2 font-semibold text-center w-16">Units</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {slots.map((slot) => {
                                                            const cellEntries = getEntriesForCell(slot, dayGroup);
                                                            if (cellEntries.length === 0) return null;

                                                            return cellEntries.map((entry, idx) => (
                                                                <tr key={entry.id} className={`hover:bg-muted/30 ${dayGroupColors[dayGroup]}`}>
                                                                    {idx === 0 && (
                                                                        <td className="border p-2 font-medium align-top bg-card" rowSpan={cellEntries.length}>
                                                                            {slot.name}
                                                                        </td>
                                                                    )}
                                                                    <td className="border p-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold">
                                                                                {entry.parallel_display_code || entry.display_code || entry.subject_code}
                                                                            </span>
                                                                            {entry.is_lab && (
                                                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-orange-100 text-orange-700">
                                                                                    LAB
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                                            {entry.year_level} Year • Block {entry.block_number}
                                                                        </div>
                                                                        <div className="text-[10px] text-muted-foreground">
                                                                            {formatTimeRange(entry)}
                                                                        </div>
                                                                    </td>
                                                                    <td className="border p-2 text-center font-medium">
                                                                        {entry.room}
                                                                    </td>
                                                                    <td className="border p-2 text-center font-bold text-primary">
                                                                        {entry.units}
                                                                    </td>
                                                                </tr>
                                                            ));
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
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
                }
            `}</style>
        </AppLayout>
    );
}
