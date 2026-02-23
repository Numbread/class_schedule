import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    type Room,
    type Schedule,
    type ScheduleEntry,
    type SharedData,
    type TimeSlot,
} from '@/types';
import { formatForUser } from '@/utils/timezone';

interface Props {
    schedule: Schedule;
    timeSlots: TimeSlot[];
    rooms: Room[];
}

export default function ScheduleExport({ schedule, timeSlots, rooms }: Props) {
    const { auth } = usePage<SharedData>().props;
    // Group time slots by day group
    const timeSlotsByGroup = timeSlots.reduce((acc, slot) => {
        if (!acc[slot.day_group]) {
            acc[slot.day_group] = [];
        }
        acc[slot.day_group].push(slot);
        return acc;
    }, {} as Record<string, TimeSlot[]>);

    // Create a map of entries by room, day, and time slot
    const entriesMap = schedule.entries?.reduce((acc, entry) => {
        const key = `${entry.day}_${entry.time_slot_id}_${entry.room_id}`;
        acc[key] = entry;
        return acc;
    }, {} as Record<string, ScheduleEntry>) || {};

    const getEntry = (day: string, timeSlotId: number, roomId: number): ScheduleEntry | undefined => {
        return entriesMap[`${day}_${timeSlotId}_${roomId}`];
    };

    const formatEntryDisplay = (entry: ScheduleEntry | undefined): string => {
        if (!entry) return '';

        const subjectCode = entry.academic_setup_subject?.parallel_display_code ||
                           entry.academic_setup_subject?.display_code ||
                           entry.academic_setup_subject?.subject?.code ||
                           'N/A';

        const facultyName = entry.faculty
            ? `${entry.faculty.fname?.charAt(0) || ''}.${entry.faculty.mname ? entry.faculty.mname.charAt(0) + '.' : ''} ${entry.faculty.lname || ''}`.trim()
            : 'TBA';

        const dayShort = entry.day === 'monday' ? 'M' :
                        entry.day === 'wednesday' ? 'W' :
                        entry.day === 'tuesday' ? 'T' :
                        entry.day === 'thursday' ? 'TH' :
                        entry.day === 'friday' ? 'F' : entry.day.charAt(0).toUpperCase();

        const labIndicator = entry.is_lab_session ? ' LAB' : '';

        return `${dayShort} ${subjectCode} (${facultyName})${labIndicator}`;
    };

    const handlePrint = () => {
        window.print();
    };

    // Separate lecture and lab rooms
    const lectureRooms = rooms.filter((r) => r.room_type === 'lecture');
    const labRooms = rooms.filter((r) => r.room_type === 'laboratory' || r.room_type === 'hybrid');

    return (
        <>
            <Head title={`Export - ${schedule.name}`} />

            {/* Print-hidden controls */}
            <div className="print:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/scheduling/${schedule.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-bold">
                            {schedule.name && schedule.name.includes('Schedule -') ? (
                                <>
                                    Schedule -{' '}
                                    {(() => {
                                        const match = schedule.name.match(/Schedule - (.+)/);
                                        if (match) {
                                            const dateStr = match[1];
                                            try {
                                                // Parse format: "2026-01-16 17:40" (UTC)
                                                const [datePart, timePart] = dateStr.split(' ');
                                                if (datePart && timePart) {
                                                    // Create UTC date string
                                                    const utcString = `${datePart}T${timePart}:00Z`;
                                                    // Format using user's timezone
                                                    return formatForUser(utcString, auth.user?.timezone || null, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    });
                                                }
                                                return dateStr;
                                            } catch {
                                                return dateStr;
                                            }
                                        }
                                        return schedule.name;
                                    })()}
                                </>
                            ) : (
                                schedule.name
                            )}
                        </h1>
                        <p className="text-muted-foreground text-sm">Print Preview</p>
                    </div>
                </div>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </div>

            {/* Printable Content */}
            <div className="p-4 print:p-0 bg-white text-black min-h-screen">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold uppercase">
                        {schedule.academic_setup?.department?.name || 'COLLEGE'}
                    </h1>
                    <h2 className="text-lg font-semibold">
                        TENTATIVE CLASS SCHEDULE
                    </h2>
                    <p className="text-sm">
                        {schedule.academic_setup?.semester === '1st' ? 'First Semester' :
                         schedule.academic_setup?.semester === '2nd' ? 'Second Semester' : 'Summer'},
                        SY {schedule.academic_setup?.academic_year}
                    </p>
                    <p className="text-sm font-medium mt-2">
                        {schedule.academic_setup?.curriculum_name || 'N/A'}
                    </p>
                </div>

                {/* MW Schedule */}
                <div className="mb-6">
                    <h3 className="font-bold text-sm mb-2 border-b pb-1">MW (Monday-Wednesday) Schedule</h3>
                    <Table className="w-full text-xs border-collapse border border-gray-400">
                        <TableHeader>
                            <TableRow className="bg-gray-100 hover:bg-gray-100">
                                <TableHead className="border border-gray-400 px-2 py-1 text-left w-24 h-auto text-black font-bold">TIME</TableHead>
                                <TableHead colSpan={lectureRooms.length} className="border border-gray-400 px-2 py-1 text-center h-auto text-black font-bold">
                                    LECTURE
                                </TableHead>
                                <TableHead colSpan={labRooms.length} className="border border-gray-400 px-2 py-1 text-center h-auto text-black font-bold">
                                    LABORATORY
                                </TableHead>
                            </TableRow>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="border border-gray-400 px-2 py-1 h-auto"></TableHead>
                                {lectureRooms.map((room) => (
                                    <TableHead key={room.id} className="border border-gray-400 px-1 py-1 text-center text-[10px] h-auto text-black font-medium">
                                        {room.name}
                                    </TableHead>
                                ))}
                                {labRooms.map((room) => (
                                    <TableHead key={room.id} className="border border-gray-400 px-1 py-1 text-center text-[10px] h-auto text-black font-medium">
                                        {room.name}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(timeSlotsByGroup['MW'] || []).sort((a, b) => a.priority - b.priority).map((slot) => (
                                <TableRow key={slot.id} className="align-top hover:bg-transparent">
                                    <TableCell className="border border-gray-400 px-2 py-1 font-medium whitespace-nowrap">
                                        {slot.name}
                                    </TableCell>
                                    {lectureRooms.map((room) => {
                                        const monEntry = getEntry('monday', slot.id, room.id);
                                        const wedEntry = getEntry('wednesday', slot.id, room.id);
                                        const entries = [monEntry, wedEntry].filter(Boolean) as ScheduleEntry[];
                                        return (
                                            <TableCell key={room.id} className={`border border-gray-400 px-1 py-1 text-center text-[9px] align-top ${entries.length > 0 ? 'bg-yellow-100' : ''}`}>
                                                {entries.length > 0 ? (
                                                    <div className="space-y-0.5">
                                                        {entries.map((entry, idx) => (
                                                            <div key={idx} className="leading-tight">
                                                                {formatEntryDisplay(entry)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : ''}
                                            </TableCell>
                                        );
                                    })}
                                    {labRooms.map((room) => {
                                        const monEntry = getEntry('monday', slot.id, room.id);
                                        const wedEntry = getEntry('wednesday', slot.id, room.id);
                                        const entries = [monEntry, wedEntry].filter(Boolean) as ScheduleEntry[];
                                        return (
                                            <TableCell key={room.id} className={`border border-gray-400 px-1 py-1 text-center text-[9px] align-top ${entries.length > 0 ? 'bg-yellow-100' : ''}`}>
                                                {entries.length > 0 ? (
                                                    <div className="space-y-0.5">
                                                        {entries.map((entry, idx) => (
                                                            <div key={idx} className="leading-tight">
                                                                {formatEntryDisplay(entry)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : ''}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* TTH Schedule */}
                <div className="mb-6">
                    <h3 className="font-bold text-sm mb-2 border-b pb-1">TTH (Tuesday-Thursday) Schedule</h3>
                    <Table className="w-full text-xs border-collapse border border-gray-400">
                        <TableHeader>
                            <TableRow className="bg-gray-100 hover:bg-gray-100">
                                <TableHead className="border border-gray-400 px-2 py-1 text-left w-24 h-auto text-black font-bold">TIME</TableHead>
                                <TableHead colSpan={lectureRooms.length} className="border border-gray-400 px-2 py-1 text-center h-auto text-black font-bold">
                                    LECTURE
                                </TableHead>
                                <TableHead colSpan={labRooms.length} className="border border-gray-400 px-2 py-1 text-center h-auto text-black font-bold">
                                    LABORATORY
                                </TableHead>
                            </TableRow>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="border border-gray-400 px-2 py-1 h-auto"></TableHead>
                                {lectureRooms.map((room) => (
                                    <TableHead key={room.id} className="border border-gray-400 px-1 py-1 text-center text-[10px] h-auto text-black font-medium">
                                        {room.name}
                                    </TableHead>
                                ))}
                                {labRooms.map((room) => (
                                    <TableHead key={room.id} className="border border-gray-400 px-1 py-1 text-center text-[10px] h-auto text-black font-medium">
                                        {room.name}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(timeSlotsByGroup['TTH'] || []).sort((a, b) => a.priority - b.priority).map((slot) => (
                                <TableRow key={slot.id} className="align-top hover:bg-transparent">
                                    <TableCell className="border border-gray-400 px-2 py-1 font-medium whitespace-nowrap">
                                        {slot.name}
                                    </TableCell>
                                    {lectureRooms.map((room) => {
                                        const tueEntry = getEntry('tuesday', slot.id, room.id);
                                        const thuEntry = getEntry('thursday', slot.id, room.id);
                                        const entries = [tueEntry, thuEntry].filter(Boolean) as ScheduleEntry[];
                                        return (
                                            <TableCell key={room.id} className={`border border-gray-400 px-1 py-1 text-center text-[9px] align-top ${entries.length > 0 ? 'bg-green-100' : ''}`}>
                                                {entries.length > 0 ? (
                                                    <div className="space-y-0.5">
                                                        {entries.map((entry, idx) => (
                                                            <div key={idx} className="leading-tight">
                                                                {formatEntryDisplay(entry)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : ''}
                                            </TableCell>
                                        );
                                    })}
                                    {labRooms.map((room) => {
                                        const tueEntry = getEntry('tuesday', slot.id, room.id);
                                        const thuEntry = getEntry('thursday', slot.id, room.id);
                                        const entries = [tueEntry, thuEntry].filter(Boolean) as ScheduleEntry[];
                                        return (
                                            <TableCell key={room.id} className={`border border-gray-400 px-1 py-1 text-center text-[9px] align-top ${entries.length > 0 ? 'bg-green-100' : ''}`}>
                                                {entries.length > 0 ? (
                                                    <div className="space-y-0.5">
                                                        {entries.map((entry, idx) => (
                                                            <div key={idx} className="leading-tight">
                                                                {formatEntryDisplay(entry)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : ''}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Friday Schedule */}
                <div className="mb-6">
                    <h3 className="font-bold text-sm mb-2 border-b pb-1">Friday Schedule</h3>
                    <Table className="w-full text-xs border-collapse border border-gray-400">
                        <TableHeader>
                            <TableRow className="bg-gray-100 hover:bg-gray-100">
                                <TableHead className="border border-gray-400 px-2 py-1 text-left w-24 h-auto text-black font-bold">TIME</TableHead>
                                <TableHead colSpan={lectureRooms.length} className="border border-gray-400 px-2 py-1 text-center h-auto text-black font-bold">
                                    LECTURE
                                </TableHead>
                                <TableHead colSpan={labRooms.length} className="border border-gray-400 px-2 py-1 text-center h-auto text-black font-bold">
                                    LABORATORY
                                </TableHead>
                            </TableRow>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="border border-gray-400 px-2 py-1 h-auto"></TableHead>
                                {lectureRooms.map((room) => (
                                    <TableHead key={room.id} className="border border-gray-400 px-1 py-1 text-center text-[10px] h-auto text-black font-medium">
                                        {room.name}
                                    </TableHead>
                                ))}
                                {labRooms.map((room) => (
                                    <TableHead key={room.id} className="border border-gray-400 px-1 py-1 text-center text-[10px] h-auto text-black font-medium">
                                        {room.name}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(timeSlotsByGroup['FRI'] || []).sort((a, b) => a.priority - b.priority).map((slot) => (
                                <TableRow key={slot.id} className="align-top hover:bg-transparent">
                                    <TableCell className="border border-gray-400 px-2 py-1 font-medium whitespace-nowrap">
                                        {slot.name}
                                    </TableCell>
                                    {lectureRooms.map((room) => {
                                        const friEntry = getEntry('friday', slot.id, room.id);
                                        return (
                                            <TableCell key={room.id} className={`border border-gray-400 px-1 py-1 text-center text-[9px] align-top ${friEntry ? 'bg-blue-100' : ''}`}>
                                                {friEntry ? formatEntryDisplay(friEntry) : ''}
                                            </TableCell>
                                        );
                                    })}
                                    {labRooms.map((room) => {
                                        const friEntry = getEntry('friday', slot.id, room.id);
                                        return (
                                            <TableCell key={room.id} className={`border border-gray-400 px-1 py-1 text-center text-[9px] align-top ${friEntry ? 'bg-blue-100' : ''}`}>
                                                {friEntry ? formatEntryDisplay(friEntry) : ''}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="mt-8 text-sm">
                    <div className="flex justify-between">
                        <div>
                            <p className="font-medium">Generated: {new Date(schedule.created_at).toLocaleDateString()}</p>
                            <p>Fitness Score: {schedule.fitness_score}</p>
                        </div>
                        <div className="text-right">
                            <p>______________________________</p>
                            <p className="font-medium mt-1">Approved By</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                }
            `}</style>
        </>
    );
}

