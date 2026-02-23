import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, BookOpen, Download, FileSpreadsheet, FileText, RefreshCw, RotateCcw, Users } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Room, type Schedule, type ScheduleEntry, type SharedData, type TimeSlot } from '@/types';
import { formatForUser } from '@/utils/timezone';

interface Props {
    schedule: Schedule;
    entriesByDay: Record<string, Record<string, ScheduleEntry[]>>;
    rooms: Room[];
    timeSlots: TimeSlot[];
}

const dayGroupColors: Record<string, string> = {
    MW: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
    TTH: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    FRI: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
    SAT: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
    SUN: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
};

// Format time string (HH:mm:ss) to display format (h:mm AM/PM)
const formatTime = (timeString: string | null): string => {
    if (!timeString) return '';
    try {
        // Handle HH:mm:ss format
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
        return timeString;
    }
};

const addMinutesToTime = (timeString: string, minutesToAdd: number) => {
    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0);
        date.setMinutes(date.getMinutes() + minutesToAdd);
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}:00`;
    } catch {
        return timeString;
    }
};

export default function ScheduleShow({ schedule, entriesByDay, rooms, timeSlots }: Props) {
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [draggingEntry, setDraggingEntry] = useState<ScheduleEntry | null>(null);
    const [targetCell, setTargetCell] = useState<{ slotId: number; roomId: number } | null>(null);
    const { auth } = usePage<SharedData>().props;

    const handleDragStart = (e: React.DragEvent, entry: ScheduleEntry) => {
        setDraggingEntry(entry);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', entry.id.toString());
    };

    const handleDragOver = (e: React.DragEvent, slotId: number, roomId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!targetCell || targetCell.slotId !== slotId || targetCell.roomId !== roomId) {
            setTargetCell({ slotId, roomId });
        }
    };

    const handleDrop = (e: React.DragEvent, targetGroup: string, slotId: number, roomId: number) => {
        e.preventDefault();
        if (!draggingEntry) return;

        // Logic to determine target day
        let targetDay = '';
        if (targetGroup === 'MW') targetDay = 'monday';
        else if (targetGroup === 'TTH') targetDay = 'tuesday';
        else targetDay = 'friday';

        const getGroup = (d: string) => {
            const dl = d.toLowerCase();
            if (['monday', 'wednesday'].includes(dl)) return 'MW';
            if (['tuesday', 'thursday'].includes(dl)) return 'TTH';
            if (['friday'].includes(dl)) return 'FRI';
            return 'FRI';
        };

        const originalGroup = getGroup(draggingEntry.day);

        // If moving within same group, preserve the specific day (Mon vs Wed)
        if (originalGroup === targetGroup) {
            targetDay = draggingEntry.day;
        }

        router.patch(`/scheduling/${schedule.id}/entries/${draggingEntry.id}`, {
            day: targetDay,
            time_slot_id: slotId,
            room_id: roomId
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setDraggingEntry(null);
                setTargetCell(null);
            },
            onError: () => {
                setDraggingEntry(null);
                setTargetCell(null);
            },
            onFinish: () => {
                setDraggingEntry(null);
                setTargetCell(null);
            }
        });
    };

    const formatScheduleName = (name: string): string => {
        if (name && name.includes('Schedule -')) {
            const match = name.match(/Schedule - (.+)/);
            if (match) {
                const dateStr = match[1];
                try {
                    // Parse format: "2026-01-16 17:40" (UTC)
                    const [datePart, timePart] = dateStr.split(' ');
                    if (datePart && timePart) {
                        // Create UTC date string
                        const utcString = `${datePart}T${timePart}:00Z`;
                        // Format using user's timezone
                        return `Schedule - ${formatForUser(utcString, auth.user?.timezone || null, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })}`;
                    }
                    return name;
                } catch {
                    return name;
                }
            }
        }
        return name;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Scheduling', href: '/scheduling' },
        { title: formatScheduleName(schedule.name), href: '#' },
    ];

    const handlePublish = () => {
        router.patch(`/scheduling/${schedule.id}/publish`, {}, { preserveScroll: true });
    };

    const handleUpdateFaculty = () => {
        setIsUpdating(true);
        router.patch(`/scheduling/${schedule.id}/update-faculty`, {}, {
            preserveScroll: true,
            onFinish: () => setIsUpdating(false),
        });
    };

    const handleRegenerate = () => {
        // Navigate to scheduling index with the academic setup preselected for regeneration
        router.get('/scheduling', { regenerate: schedule.academic_setup_id });
    };

    // Count entries with TBA (no faculty assigned)
    const tbaCount = schedule.entries?.filter((e) => !e.user_id).length || 0;

    // Group time slots by day group for display
    const timeSlotsByGroup = timeSlots.reduce((acc, slot) => {
        if (!acc[slot.day_group]) {
            acc[slot.day_group] = [];
        }
        acc[slot.day_group].push(slot);
        return acc;
    }, {} as Record<string, TimeSlot[]>);

    // Create a map of entries by room, day, and time slot for easy lookup
    const getEntry = (day: string, timeSlotId: number, roomId: number): ScheduleEntry | undefined => {
        const dayLower = day.toLowerCase();
        let foundEntry: ScheduleEntry | undefined;

        // Search in all keys that match the day name (case-insensitive) to handle inconsistent casing in DB
        Object.keys(entriesByDay).forEach((key) => {
            if (key.toLowerCase() === dayLower) {
                const dayEntries = entriesByDay[key];
                if (dayEntries) {
                    const slotEntries = dayEntries[timeSlotId.toString()];
                    if (slotEntries) {
                        const match = slotEntries.find((e) => e.room_id === roomId);
                        if (match) {
                            foundEntry = match;
                        }
                    }
                }
            }
        });

        return foundEntry;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={schedule.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/scheduling">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {schedule.academic_setup?.department?.name || 'Schedule'}
                            </h1>
                            <p className="text-muted-foreground">
                                {schedule.academic_setup?.curriculum_name || 'N/A'} - {schedule.academic_setup?.semester} Sem ({schedule.academic_setup?.academic_year})
                            </p>
                            {schedule.name && schedule.name.includes('Schedule -') && (
                                <p className="text-muted-foreground text-xs mt-1">
                                    Generated: {(() => {
                                        const match = schedule.name.match(/Schedule - (.+)/);
                                        if (match) {
                                            const dateStr = match[1];
                                            try {
                                                // Parse format: "2026-01-16 17:36" (UTC)
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
                                        return '';
                                    })()}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={schedule.status === 'published' ? 'default' : 'secondary'}>
                            {schedule.status}
                        </Badge>
                        {tbaCount > 0 && (
                            <Badge variant="destructive">
                                {tbaCount} TBA
                            </Badge>
                        )}

                        {/* Update/Regenerate Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Update
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Schedule Options</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleUpdateFaculty} disabled={isUpdating}>
                                    <RefreshCw className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                                    Update Faculty Assignments
                                    <span className="text-muted-foreground ml-2 text-xs">
                                        (keep rooms & times)
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowRegenerateDialog(true)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Regenerate Schedule
                                    <span className="text-muted-foreground ml-2 text-xs">
                                        (start fresh)
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {schedule.status === 'draft' && (
                            <Button onClick={handlePublish}>
                                <FileText className="mr-2 h-4 w-4" />
                                Publish
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href={`/scheduling/${schedule.id}/teaching-load`}>
                                <Users className="mr-2 h-4 w-4" />
                                Teaching Load
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/scheduling/${schedule.id}/registrar-template`}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                Registrar View
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="default">
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Export Excel
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Export to Excel</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a href={`/scheduling/${schedule.id}/export/room-allocation`} className="cursor-pointer">
                                        <Download className="mr-2 h-4 w-4" />
                                        Room Allocation
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`/scheduling/${schedule.id}/export/teaching-load`} className="cursor-pointer">
                                        <Users className="mr-2 h-4 w-4" />
                                        Teaching Load
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href={`/scheduling/${schedule.id}/export/registrar-template`} className="cursor-pointer">
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Registrar Template
                                    </a>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Schedule Info */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Fitness Score</p>
                        <p className={`text-2xl font-bold ${(schedule.fitness_score || 0) >= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                            {schedule.fitness_score ?? 'N/A'}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Generations</p>
                        <p className="text-2xl font-bold">{schedule.generation ?? 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Total Entries</p>
                        <p className="text-2xl font-bold">{schedule.entries?.length || 0}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Academic Year</p>
                        <p className="text-2xl font-bold">{schedule.academic_setup?.academic_year}</p>
                    </div>
                </div>

                {/* Schedule Grid - MW/TTH View */}
                {['MW', 'TTH', 'FRI'].map((dayGroup) => {
                    const slots = timeSlotsByGroup[dayGroup] || [];
                    if (slots.length === 0) return null;

                    const days = dayGroup === 'MW'
                        ? ['monday', 'wednesday']
                        : dayGroup === 'TTH'
                            ? ['tuesday', 'thursday']
                            : ['friday'];

                    const sortedSlots = slots.sort((a, b) => a.priority - b.priority);

                    // For Friday, build a map of cells that are "occupied" by spanning entries
                    // Key: `${slotIndex}_${roomId}`, Value: true if cell should be skipped
                    // For Friday, build a map of cells that are "occupied" by spanning entries
                    // Key: `${slotIndex}_${roomId}`, Value: true if cell should be skipped
                    const occupiedCells: Record<string, boolean> = {};
                    const actualRowSpans: Record<string, number> = {};

                    // Pre-process Friday entries to mark occupied cells
                    if (dayGroup === 'FRI') {
                        sortedSlots.forEach((slot, slotIndex) => {
                            rooms.forEach((room) => {
                                // Use case-insensitive lookup
                                const entry = getEntry('friday', slot.id, room.id);
                                if (entry && (entry.slots_span || 1) > 1) {
                                    const span = entry.slots_span || 1;
                                    let realSpan = 1;

                                    // Check for collisions downstream
                                    for (let i = 1; i < span; i++) {
                                        if (slotIndex + i < sortedSlots.length) {
                                            const nextSlot = sortedSlots[slotIndex + i];
                                            const nextEntry = getEntry('friday', nextSlot.id, room.id);
                                            // If collision exists, stop spanning
                                            if (nextEntry && nextEntry.id !== entry.id) break;
                                            realSpan++;
                                        }
                                    }
                                    actualRowSpans[`${slotIndex}_${room.id}`] = realSpan;

                                    // Mark subsequent slots as occupied
                                    for (let i = 1; i < realSpan; i++) {
                                        if (slotIndex + i < sortedSlots.length) {
                                            occupiedCells[`${slotIndex + i}_${room.id}`] = true;
                                        }
                                    }
                                }
                            });
                        });
                    }

                    return (
                        <div key={dayGroup} className="space-y-4">
                            <h2 className="text-lg font-semibold">
                                {dayGroup === 'MW' ? 'Monday/Wednesday' : dayGroup === 'TTH' ? 'Tuesday/Thursday' : 'Friday'} Schedule
                            </h2>

                            <div className="rounded-lg border">
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-b hover:bg-muted/50">
                                            <TableHead className="px-3 py-2 text-left text-sm font-medium w-28 sticky left-0 bg-muted/50 z-10 h-auto">Time</TableHead>
                                            {rooms.map((room) => (
                                                <TableHead key={room.id} className="px-3 py-2 text-center text-sm font-medium min-w-25 h-auto text-black">
                                                    <div>
                                                        <p>{room.name}</p>
                                                        <p className="text-muted-foreground text-xs font-normal">
                                                            {room.room_type} ({room.capacity})
                                                        </p>
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedSlots.map((slot, slotIndex) => (
                                            <TableRow key={slot.id} className="border-b last:border-0 hover:bg-transparent">
                                                <TableCell className="px-3 py-2 font-medium text-sm whitespace-nowrap sticky left-0 bg-background z-10">
                                                    {slot.name}
                                                </TableCell>
                                                {rooms.map((room) => {
                                                    // For Friday, check if this cell is occupied by a spanning entry
                                                    if (dayGroup === 'FRI' && occupiedCells[`${slotIndex}_${room.id}`]) {
                                                        return null; // Skip - covered by rowSpan
                                                    }

                                                    // Find entries for this slot and room across all applicable days
                                                    const entries = days.flatMap((day) => {
                                                        const entry = getEntry(day, slot.id, room.id);
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        return entry ? [{ ...entry, day: day as any }] : [];
                                                    });

                                                    // Check if this cell is the drop target
                                                    const isTarget = draggingEntry && targetCell?.slotId === slot.id && targetCell?.roomId === room.id;

                                                    if (entries.length === 0) {
                                                        return (
                                                            <TableCell
                                                                key={room.id}
                                                                className={`px-3 py-2 text-center transition-colors ${draggingEntry ? 'hover:bg-accent/50' : ''} ${isTarget ? 'bg-accent/50 ring-2 ring-inset ring-primary/20' : ''}`}
                                                                onDragOver={(e) => handleDragOver(e, slot.id, room.id)}
                                                                onDrop={(e) => handleDrop(e, dayGroup, slot.id, room.id)}
                                                            >
                                                                {isTarget && draggingEntry ? (
                                                                    <div className="rounded border border-dashed border-primary/50 bg-background/50 p-2 text-xs opacity-70">
                                                                        <div className="font-semibold truncate">
                                                                            {draggingEntry.academic_setup_subject?.parallel_display_code || draggingEntry.academic_setup_subject?.display_code || 'Subject'}
                                                                        </div>
                                                                        <div className="text-[10px] text-muted-foreground">
                                                                            Moving...
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">-</span>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    }

                                                    // Group entries by session_group_id to merge paired entries (M/W, T/TH)
                                                    const mergedEntries = entries.reduce((acc, entry) => {
                                                        const key = entry.session_group_id || `single-${entry.id}`;
                                                        if (!acc[key]) {
                                                            acc[key] = {
                                                                ...entry,
                                                                days: [entry.day],
                                                            };
                                                        } else {
                                                            // Add day to existing group
                                                            if (!acc[key].days.includes(entry.day)) {
                                                                acc[key].days.push(entry.day);
                                                            }
                                                            // Keep conflict info if any entry has conflict
                                                            if (entry.has_conflict) {
                                                                acc[key].has_conflict = true;
                                                                acc[key].conflict_reason = entry.conflict_reason;
                                                            }
                                                        }
                                                        return acc;
                                                    }, {} as Record<string, ScheduleEntry & { days: string[] }>);

                                                    // Calculate rowSpan for Friday entries
                                                    const firstEntry = Object.values(mergedEntries)[0];
                                                    const rowSpan = dayGroup === 'FRI'
                                                        ? (actualRowSpans[`${slotIndex}_${room.id}`] || firstEntry?.slots_span || 1)
                                                        : 1;

                                                    return (
                                                        <TableCell
                                                            key={room.id}
                                                            className={`px-1 py-1 align-top transition-colors ${draggingEntry ? 'hover:bg-accent/50' : ''} ${isTarget ? 'bg-accent/50 ring-2 ring-inset ring-primary/20' : ''}`}
                                                            rowSpan={rowSpan > 1 ? rowSpan : undefined}
                                                            onDragOver={(e) => handleDragOver(e, slot.id, room.id)}
                                                            onDrop={(e) => handleDrop(e, dayGroup, slot.id, room.id)}
                                                        >
                                                            {Object.values(mergedEntries).map((entry, idx) => {
                                                                // Get day display based on grouped days
                                                                const dayDisplay = entry.days.length > 1
                                                                    ? entry.days.map(d => d.substring(0, 1).toUpperCase()).join('/')
                                                                    : entry.days[0]?.substring(0, 3).toUpperCase() || '';

                                                                // Format custom time if available
                                                                const customTime = entry.custom_start_time && entry.custom_end_time
                                                                    ? `${formatTime(entry.custom_start_time)} - ${formatTime(entry.custom_end_time)}`
                                                                    : null;

                                                                // Calculate duration text for Friday spanning entries
                                                                const durationText = dayGroup === 'FRI' && (entry.slots_span || 1) > 1
                                                                    ? entry.is_lab_session ? '3hr' : '2hr'
                                                                    : null;

                                                                return (
                                                                    <div
                                                                        key={`${entry.id}-${idx}`}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, entry)}
                                                                        className={`rounded border p-2 text-xs h-full ${dayGroupColors[dayGroup]} ${Object.keys(mergedEntries).length > 1 ? 'mb-1' : ''} ${entry.has_conflict ? 'border-destructive! border-l-4!' : ''} cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity`}
                                                                        title={entry.has_conflict ? `Conflict: ${entry.conflict_reason}` : customTime ? `Actual time: ${customTime}` : undefined}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <div className="flex items-center gap-1 min-w-0">
                                                                                {entry.has_conflict && (
                                                                                    <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                                                                                )}
                                                                                <p className="font-semibold truncate">
                                                                                    {entry.academic_setup_subject?.parallel_display_code || entry.academic_setup_subject?.display_code || entry.academic_setup_subject?.subject?.code}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 shrink-0">
                                                                                <Badge variant={entry.is_lab_session ? 'secondary' : 'outline'} className="text-[9px] px-1 py-0 font-normal bg-background/80 backdrop-blur-sm">
                                                                                    {entry.is_lab_session ? 'LAB' : 'LEC'}
                                                                                </Badge>
                                                                                <Badge variant="secondary" className="text-[9px] px-1 py-0 font-normal">
                                                                                    {dayDisplay}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-[10px] truncate font-medium">
                                                                            {entry.custom_start_time && entry.custom_end_time ? (
                                                                                <>
                                                                                    {formatTime(entry.custom_start_time)} - {formatTime(entry.custom_end_time)}
                                                                                    <span className="text-muted-foreground ml-1 font-normal">
                                                                                        ({(() => {
                                                                                            const [sh, sm] = entry.custom_start_time.split(':').map(Number);
                                                                                            const [eh, em] = entry.custom_end_time.split(':').map(Number);
                                                                                            const d = (eh * 60 + em) - (sh * 60 + sm);
                                                                                            return d % 60 === 0 ? `${d / 60}hr` : `${Math.floor(d / 60)}hr ${d % 60}m`;
                                                                                        })()})
                                                                                    </span>
                                                                                </>
                                                                            ) : durationText ? (
                                                                                `${formatTime(slot.start_time)} - ${formatTime(addMinutesToTime(slot.start_time, entry.is_lab_session ? 180 : 120))} (${durationText})`
                                                                            ) : (
                                                                                slot.name
                                                                            )}
                                                                        </div>
                                                                        <div className="text-[10px] truncate text-muted-foreground" title={entry.faculty ? `${entry.faculty.fname} ${entry.faculty.lname}` : 'TBA'}>
                                                                            {entry.faculty
                                                                                ? `${entry.faculty.fname.charAt(0)}. ${entry.faculty.lname}`
                                                                                : 'TBA'}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {isTarget && draggingEntry && (
                                                                <div className="rounded border border-dashed border-primary/50 bg-background/50 p-2 text-xs opacity-70 mt-1">
                                                                    <div className="font-semibold truncate">
                                                                        {draggingEntry.academic_setup_subject?.parallel_display_code || draggingEntry.academic_setup_subject?.display_code || 'Subject'}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground">
                                                                        Moving...
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </TableCell>

                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div >
                    );
                })}

                {/* All Entries List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">All Schedule Entries</h2>
                    <div className="rounded-lg border">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="bg-muted/50 border-b hover:bg-muted/50">
                                    <TableHead className="px-4 py-2 text-left text-sm font-medium text-black">Subject</TableHead>
                                    <TableHead className="px-4 py-2 text-left text-sm font-medium text-black">Day</TableHead>
                                    <TableHead className="px-4 py-2 text-left text-sm font-medium text-black">Time</TableHead>
                                    <TableHead className="px-4 py-2 text-left text-sm font-medium text-black">Room</TableHead>
                                    <TableHead className="px-4 py-2 text-left text-sm font-medium text-black">Faculty</TableHead>
                                    <TableHead className="px-4 py-2 text-center text-sm font-medium text-black">Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedule.entries?.map((entry) => {
                                    const blockNumber = entry.academic_setup_subject?.block_number ?? 1;
                                    // Use parallel_display_code for parallel subjects (e.g., "CSC401/CSP1001")
                                    const displayCode = entry.academic_setup_subject?.parallel_display_code ||
                                        entry.academic_setup_subject?.display_code ||
                                        entry.academic_setup_subject?.subject?.code;

                                    return (
                                        <TableRow key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <TableCell className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{displayCode}</p>
                                                    {blockNumber > 1 && (
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                            Block {blockNumber}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground text-xs">{entry.academic_setup_subject?.subject?.name}</p>
                                            </TableCell>
                                            <TableCell className="px-4 py-2 capitalize">{entry.day}</TableCell>
                                            <TableCell className="px-4 py-2">
                                                <div>
                                                    <p>{entry.time_slot?.name}</p>
                                                    {entry.custom_start_time && entry.custom_end_time && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                                            Actual: {formatTime(entry.custom_start_time)} - {formatTime(entry.custom_end_time)}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-2">
                                                <p>{entry.room?.name}</p>
                                                <p className="text-muted-foreground text-xs">{entry.room?.building?.name}</p>
                                            </TableCell>
                                            <TableCell className="px-4 py-2">
                                                {entry.faculty
                                                    ? `${entry.faculty.fname}${entry.faculty.mname ? ' ' + entry.faculty.mname.charAt(0) + '.' : ''} ${entry.faculty.lname}`
                                                    : <span className="text-muted-foreground">TBA</span>}
                                            </TableCell>
                                            <TableCell className="px-4 py-2 text-center">
                                                <Badge variant={entry.is_lab_session ? 'secondary' : 'outline'}>
                                                    {entry.is_lab_session ? 'Lab' : 'Lecture'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div >

            {/* Regenerate Confirmation Dialog */}
            < Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerate Schedule?</DialogTitle>
                        <DialogDescription>
                            This will create a new schedule from scratch using the Genetic Algorithm.
                            The current schedule will remain until you delete it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Choose this option if:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                            <li>You've made significant changes to subjects or rooms</li>
                            <li>You want to try generating a better schedule</li>
                            <li>The current schedule has too many conflicts</li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRegenerate}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Go to Scheduling
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </AppLayout >
    );
}

