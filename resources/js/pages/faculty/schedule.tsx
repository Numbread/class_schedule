import { Head, router, usePage } from '@inertiajs/react';
import { ArrowRight, Check, Calendar, Clock, MapPin, Loader2, ChevronsUpDown, AlertCircle, Edit } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import {
    type BreadcrumbItem,
    type ScheduleEntry,
    type TimeSlot,
} from '@/types';

// Format time string (HH:mm:ss) to display format (h:mm AM/PM)
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




interface FacultyScheduleProps {
    schedules: Array<{
        id: number;
        name: string;
        status: string;
        department?: string;
        academic_year?: string;
        semester?: string;
        created_at: string;
    }>;
    selectedSchedule?: {
        id: number;
        name: string;
        status: string;
    };
    entries: ScheduleEntry[];
    timeSlots: TimeSlot[];
    rooms: Array<{ id: number; name: string; room_type?: string }>;
    pendingRequests: Array<{
        id: number;
        schedule_entry_id: number;
        target_time_slot_id: number;
        target_room_id: number;
        target_day: string;
        user_id: number;
        schedule_entry?: ScheduleEntry;
        status: string;
    }>;
    requestHistory: Array<{
        id: number;
        status: string;
        target_day: string;
        target_room: { name: string };
        target_time_slot: { start_time: string; end_time: string };
        schedule_entry: { academic_setup_subject: { subject: { code: string; name: string } } };
        admin_notes?: string;
        reason?: string;
        created_at: string;
        updated_at: string;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '#' },
    { title: 'My Schedule', href: '/faculty/schedule' },
];

const DAYS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
];

export default function FacultySchedule({
    schedules,
    selectedSchedule,
    entries,
    timeSlots,
    rooms,
    pendingRequests,
    requestHistory,
}: FacultyScheduleProps) {
    const [selectedScheduleId] = useState<string>(
        selectedSchedule?.id.toString() || ''
    );
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

    const currentSchedule = useMemo(() =>
        schedules.find(s => s.id.toString() === selectedScheduleId) || schedules[0],
        [schedules, selectedScheduleId]
    );

    const handleScheduleChange = (value: string) => {
        router.get(
            '/faculty/schedule',
            { schedule_id: value },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Extract unique start times for grid rows
    const uniqueStartTimes = useMemo(() => {
        const times = new Set<string>();
        timeSlots.forEach((slot) => {
            // Ensure we format or take the substring to match consistently
            const time = slot.start_time.substring(0, 5); // HH:mm
            times.add(time);
        });
        return Array.from(times).sort();
    }, [timeSlots]);

    // Helper to find entry for a specific cell
    const getEntry = (day: string, startTime: string) => {
        return entries.find((e) => {
            const entryTime = e.time_slot?.start_time.substring(0, 5);
            return (
                e.day.toLowerCase() === day.toLowerCase() &&
                entryTime === startTime
            );
        });
    };

    // Helper to find ending time for a start time (for display label)
    const getTimeLabel = (startTime: string) => {
        const slot = timeSlots.find(
            (s) => s.start_time.substring(0, 5) === startTime
        );
        if (slot) {
            return `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
        }
        return formatTime(startTime);
    };

    // Change Request State
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [checkingConflict, setCheckingConflict] = useState(false);
    const [conflictResult, setConflictResult] = useState<{ has_conflict: boolean; conflicts: string[] } | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

    const [requestData, setRequestData] = useState<{
        schedule_entry_id: number;
        target_day: string;
        target_time_slot_id: string;
        target_room_id: string;
        reason: string;
    }>({
        schedule_entry_id: 0,
        target_day: '',
        target_time_slot_id: '',
        target_room_id: '',
        reason: '',
    });
    const [processing, setProcessing] = useState(false);

    // Cancellation State
    const [cancelRequestId, setCancelRequestId] = useState<number | null>(null);
    const [processingCancel, setProcessingCancel] = useState(false);

    // Helper to determine day group from a day name
    const getDayGroup = (day: string): 'MW' | 'TTH' | 'FRI' | 'SAT' | 'SUN' => {
        const dayLower = day.toLowerCase();
        if (dayLower === 'monday' || dayLower === 'wednesday') return 'MW';
        if (dayLower === 'tuesday' || dayLower === 'thursday') return 'TTH';
        if (dayLower === 'friday') return 'FRI';
        if (dayLower === 'saturday') return 'SAT';
        return 'SUN';
    };

    // Helper to get the paired day for MW/TTH schedules
    const getPairedDay = (targetDay: string): string | null => {
        const dayLower = targetDay.toLowerCase();
        if (dayLower === 'monday') return 'wednesday';
        if (dayLower === 'wednesday') return 'monday';
        if (dayLower === 'tuesday') return 'thursday';
        if (dayLower === 'thursday') return 'tuesday';
        return null;
    };

    // Calculate expected duration when moving between day groups
    // MW/TTH: Meets 2x per week with shorter duration per day
    // FRI: Meets 1x per week with longer duration
    // Duration ratio: FRI = 2x of MW/TTH
    const calculateDurationChange = (entry: ScheduleEntry, targetDay: string) => {
        if (!entry) return null;

        const originalDay = entry.day;
        const originalGroup = getDayGroup(originalDay);
        const targetGroup = getDayGroup(targetDay);

        // Same group = no change
        if (originalGroup === targetGroup) return null;

        // Get original duration in minutes
        let originalMinutes = 0;
        if (entry.custom_start_time && entry.custom_end_time) {
            const [startH, startM] = entry.custom_start_time.split(':').map(Number);
            const [endH, endM] = entry.custom_end_time.split(':').map(Number);
            originalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        } else if (entry.time_slot) {
            const [startH, startM] = entry.time_slot.start_time.split(':').map(Number);
            const [endH, endM] = entry.time_slot.end_time.split(':').map(Number);
            originalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        }

        if (originalMinutes <= 0) return null;

        let newMinutes = originalMinutes;
        let direction: 'expand' | 'contract' = 'expand';

        // Moving from MW/TTH to FRI/SAT/SUN: duration doubles (since only meets once)
        if ((originalGroup === 'MW' || originalGroup === 'TTH') && (targetGroup === 'FRI' || targetGroup === 'SAT' || targetGroup === 'SUN')) {
            newMinutes = originalMinutes * 2;
            direction = 'expand';
        }
        // Moving from FRI/SAT/SUN to MW/TTH: duration halves (since meets twice)
        else if ((originalGroup === 'FRI' || originalGroup === 'SAT' || originalGroup === 'SUN') && (targetGroup === 'MW' || targetGroup === 'TTH')) {
            newMinutes = originalMinutes / 2;
            direction = 'contract';
        }
        // MW <-> TTH: no duration change, just different days
        else if ((originalGroup === 'MW' && targetGroup === 'TTH') || (originalGroup === 'TTH' && targetGroup === 'MW')) {
            return null; // Same duration pattern
        }

        const formatDuration = (minutes: number) => {
            const hrs = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            if (hrs === 0) return `${mins} min`;
            if (mins === 0) return `${hrs} hr`;
            return `${hrs} hr ${mins} min`;
        };

        return {
            original: formatDuration(originalMinutes),
            new: formatDuration(newMinutes),
            direction,
            isLab: entry.is_lab_session,
            pairedDay: targetGroup === 'MW' ? (targetDay === 'monday' ? 'Wednesday' : 'Monday')
                : targetGroup === 'TTH' ? (targetDay === 'tuesday' ? 'Thursday' : 'Tuesday')
                    : null,
        };
    };

    const openRequestDialog = (entry: ScheduleEntry, targetDay?: string, targetSlotId?: number) => {
        const day = targetDay || entry.day.toLowerCase();
        const slotId = targetSlotId ? targetSlotId.toString() : entry.time_slot_id.toString();
        const roomId = entry.room_id.toString();

        const newData = {
            schedule_entry_id: entry.id,
            target_day: day,
            target_time_slot_id: slotId,
            target_room_id: roomId,
            reason: '',
        };

        setSelectedEntry(entry);
        setRequestData(newData);
        setConflictResult(null);
        setIsRequestDialogOpen(true);

        if (targetDay && targetSlotId) {
            // Auto-check if dropped
            checkConflict(newData);
        }
    };

    const { flash } = usePage<{ flash: { conflict_check?: { has_conflict: boolean; conflicts: string[] } } }>().props;

    useEffect(() => {
        if (flash?.conflict_check) {
            // Avoid setting state synchronously during render by using setTimeout
            setTimeout(() => {
                if (flash.conflict_check) {
                    setConflictResult(flash.conflict_check);
                    setCheckingConflict(false);
                }
            }, 0);
        }
    }, [flash]);

    const checkConflict = (overrideData?: typeof requestData) => {
        const dataToCheck = overrideData || requestData;
        if (!dataToCheck.target_day || !dataToCheck.target_time_slot_id || !dataToCheck.target_room_id) return;

        setCheckingConflict(true);
        router.post('/faculty/schedule/check-conflict', {
            schedule_entry_id: dataToCheck.schedule_entry_id,
            target_day: dataToCheck.target_day,
            target_time_slot_id: dataToCheck.target_time_slot_id,
            target_room_id: dataToCheck.target_room_id,
        }, {
            preserveState: true,
            preserveScroll: true,
            onError: () => {
                setCheckingConflict(false);
                // Handle error
            }
        });
    };

    // Drag preview state - tracks which entry is being dragged and where
    const [draggingEntry, setDraggingEntry] = useState<ScheduleEntry | null>(null);
    const [dragPreview, setDragPreview] = useState<{
        targetDay: string;
        targetSlotId: number;
    } | null>(null);

    const handleDragStart = (e: React.DragEvent, entry: ScheduleEntry) => {
        e.dataTransfer.setData('entry_id', entry.id.toString());
        e.dataTransfer.effectAllowed = 'move';
        setDraggingEntry(entry);
    };

    const handleDragOver = (e: React.DragEvent, day: string, slotId: number) => {
        e.preventDefault();
        // Only update if we have a dragging entry and the target has changed
        if (draggingEntry && (!dragPreview || dragPreview.targetDay !== day || dragPreview.targetSlotId !== slotId)) {
            setDragPreview({
                targetDay: day,
                targetSlotId: slotId,
            });
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Only clear if we're leaving the cell entirely (not entering a child element)
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setDragPreview(null);
        }
    };

    const handleDragEnd = () => {
        setDraggingEntry(null);
        setDragPreview(null);
    };

    const handleDrop = (e: React.DragEvent, day: string, slotId: number) => {
        e.preventDefault();
        setDragPreview(null);
        const entryId = e.dataTransfer.getData('entry_id');
        if (!entryId) return;

        const entry = entries.find(e => e.id.toString() === entryId);
        if (entry) {
            openRequestDialog(entry, day, slotId);
        }
    };

    const submitRequest = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/faculty/schedule/change-request', requestData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsRequestDialogOpen(false);
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            }
        });
    };

    const cancelRequest = (requestId: number) => {
        setCancelRequestId(requestId);
    };

    const confirmCancel = () => {
        if (!cancelRequestId) return;

        setProcessingCancel(true);
        router.delete(`/faculty/schedule/change-request/${cancelRequestId}`, {
            preserveScroll: true,
            onFinish: () => {
                setProcessingCancel(false);
                setCancelRequestId(null);
            }
        });
    };



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Schedule" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            My Teaching Schedule
                        </h1>
                        <p className="text-muted-foreground">
                            View your assigned classes and teaching load
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(true)}>
                            <Clock className="mr-2 h-4 w-4" />
                            History
                        </Button>
                        {(() => {
                            const current = schedules.find(s => s.id === Number(selectedScheduleId)) || schedules[0];
                            if (!current) return null;

                            return (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-auto py-2 px-3 flex flex-col items-end gap-1 min-w-[200px] border-dashed hover:border-solid hover:bg-accent/50 transition-all text-right"
                                        >
                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
                                                {current.status === 'published' ? (
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
                                                    {current.department || 'General'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                {current.academic_year} {current.semester} Sem
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
                                                    {schedule.id === current.id && <Check className="h-4 w-4 text-primary" />}
                                                </div>
                                                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                                                    <span>{schedule.department || 'General'}</span>
                                                    <Badge variant={schedule.status === 'published' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                                        {schedule.status}
                                                    </Badge>
                                                </div>
                                                {schedule.status === 'draft' && (
                                                    <p className="text-[10px] text-muted-foreground/50">
                                                        {schedule.name}
                                                    </p>
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            );
                        })()}

                        {/* Placeholder for export/print if needed later */}
                        {/* <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                        </Button> */}
                    </div>
                </div>

                {entries.length === 0 ? (
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle>No Classes Found</CardTitle>
                            <CardDescription>
                                You don't have any assigned classes in the selected schedule.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="rounded-md border shadow-sm overflow-hidden bg-background">
                        <Table className="border-collapse">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 top-0 z-20 bg-muted/50 border-b border-r px-4 py-3 text-center text-sm font-semibold w-24 min-w-[100px] h-auto text-foreground">
                                        Time
                                    </TableHead>
                                    {DAYS.map((day) => (
                                        <TableHead
                                            key={day.value}
                                            className="min-w-[160px] border-b border-r px-4 py-3 text-center text-sm font-semibold last:border-r-0 bg-muted/50 h-auto text-foreground"
                                        >
                                            {day.label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uniqueStartTimes.map((startTime) => (
                                    <TableRow key={startTime} className="divide-x divide-border border-b last:border-b-0 hover:bg-transparent">
                                        <TableCell className="sticky left-0 z-10 bg-background px-2 py-3 text-xs font-medium text-center whitespace-nowrap p-0 align-middle">
                                            {getTimeLabel(startTime)}
                                        </TableCell>
                                        {DAYS.map((day) => {
                                            const slot = timeSlots.find(s => s.start_time.substring(0, 5) === startTime);
                                            if (!slot) return <TableCell key={`${day.value}-empty`}></TableCell>;

                                            const entry = getEntry(
                                                day.value,
                                                startTime
                                            );

                                            // Find pending request targeting this slot (direct)
                                            const pendingReq = pendingRequests.find(r =>
                                                r.target_day === day.value &&
                                                r.target_time_slot_id.toString() === slot.id.toString()
                                            );

                                            // Also check if this is the PAIRED day of a pending request
                                            // (e.g., if request targets Tuesday, Thursday should also show pending)
                                            const pairedPendingReq = pendingRequests.find(r => {
                                                if (r.target_time_slot_id.toString() !== slot.id.toString()) return false;

                                                // Check if this is the paired day of the target
                                                const targetGroup = getDayGroup(r.target_day);
                                                const currentDayPaired = getPairedDay(r.target_day);

                                                // Only show paired if:
                                                // 1. Request is moving from FRI to MW/TTH (need to create paired entry)
                                                // 2. OR request is moving within MW/TTH (paired entry should also be updated)
                                                // 3. This cell's day is the paired day of the target
                                                if (currentDayPaired === day.value) {
                                                    const originalEntry = r.schedule_entry;
                                                    if (originalEntry) {
                                                        const originalGroup = getDayGroup(originalEntry.day);
                                                        // FRI -> MW/TTH means we need a paired entry
                                                        if (originalGroup === 'FRI' && (targetGroup === 'MW' || targetGroup === 'TTH')) {
                                                            return true;
                                                        }
                                                        // MW/TTH -> same group (e.g., TTH -> TTH) means paired day should also update
                                                        if ((originalGroup === 'MW' || originalGroup === 'TTH') &&
                                                            (targetGroup === 'MW' || targetGroup === 'TTH')) {
                                                            return true;
                                                        }
                                                    }
                                                }
                                                return false;
                                            });

                                            // Use the direct pending request or the paired one
                                            const effectivePendingReq = pendingReq || pairedPendingReq;
                                            const isPairedPending = !!pairedPendingReq && !pendingReq;

                                            const isPendingSource = entry && pendingRequests.some(r => {
                                                // Direct match
                                                if (r.schedule_entry_id === entry.id) return true;

                                                // Paired match (e.g. if Monday is moved, Wednesday should also be pending)
                                                const reqEntry = r.schedule_entry;
                                                if (reqEntry &&
                                                    reqEntry.schedule_id === entry.schedule_id &&
                                                    reqEntry.academic_setup_subject_id === entry.academic_setup_subject_id &&
                                                    // Use session_group_id if available to link pairs, or fallback to properties
                                                    (reqEntry.session_group_id === entry.session_group_id || (
                                                        reqEntry.is_lab_session === entry.is_lab_session &&
                                                        reqEntry.time_slot_id === entry.time_slot_id // Usually pairs share time slots
                                                    ))
                                                ) {
                                                    const reqGroup = getDayGroup(reqEntry.day);
                                                    const currentGroup = getDayGroup(entry.day);

                                                    // If they are in the same pair group (MW or TTH) but different days
                                                    if (reqGroup === currentGroup && (reqGroup === 'MW' || reqGroup === 'TTH') && reqEntry.day !== entry.day) {
                                                        return true;
                                                    }
                                                }
                                                return false;
                                            });

                                            // Check if this cell is being drag-hovered (direct or paired day)
                                            const isDragTarget = draggingEntry && dragPreview &&
                                                dragPreview.targetSlotId === slot.id &&
                                                dragPreview.targetDay === day.value;

                                            // Check if this is a PAIRED day that should also show preview
                                            // When moving from FRI to TTH (e.g., drag to Tuesday), Thursday should also show
                                            // When moving from FRI to MW (e.g., drag to Monday), Wednesday should also show

                                            const isPairedDayTarget = draggingEntry && dragPreview &&
                                                dragPreview.targetSlotId === slot.id &&
                                                getPairedDay(dragPreview.targetDay) === day.value &&
                                                // Show paired if:
                                                // 1. Changing day groups (e.g., FRI -> TTH) - need to create paired entry
                                                // 2. OR staying within MW/TTH groups - the paired day already exists and should be updated
                                                (getDayGroup(draggingEntry.day) !== getDayGroup(dragPreview.targetDay) ||
                                                    (getDayGroup(dragPreview.targetDay) === 'MW' || getDayGroup(dragPreview.targetDay) === 'TTH'));

                                            // Combined: show preview on direct target OR paired day
                                            const showDragPreview = isDragTarget || isPairedDayTarget;

                                            return (
                                                <TableCell
                                                    key={`${day.value}-${slot.id}`}
                                                    className={`border p-2 min-h-[130px] h-[130px] align-top relative transition-all ${showDragPreview
                                                        ? (isPairedDayTarget ? 'bg-blue-500/10 ring-2 ring-blue-400/50 ring-inset' : 'bg-primary/10 ring-2 ring-primary/50 ring-inset')
                                                        : 'hover:bg-muted/5'
                                                        }`}
                                                    onDragOver={(e) => {
                                                        if (!isPendingSource && draggingEntry) {
                                                            e.preventDefault();
                                                            handleDragOver(e, day.value, slot.id);
                                                        }
                                                    }}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, day.value, slot.id)}
                                                >
                                                    {entry ? (
                                                        (() => {
                                                            // Check if this entry is part of a paired session (MW or TTH)
                                                            const dayGroup = entry.time_slot?.day_group;

                                                            const isFriday = dayGroup === 'FRI';
                                                            const dayBadge = dayGroup === 'MW' ? 'M/W' : dayGroup === 'TTH' ? 'T/TH' : isFriday ? 'FRI' : null;

                                                            return (
                                                                <div
                                                                    draggable={!isPendingSource && currentSchedule?.status !== 'published'}
                                                                    onDragStart={(e) => {
                                                                        if (!isPendingSource) {
                                                                            handleDragStart(e, entry);
                                                                            setDragPreview({ targetDay: day.value, targetSlotId: slot.id });
                                                                        }
                                                                    }}
                                                                    onDragEnd={handleDragEnd}
                                                                    className={`flex h-full w-full flex-col gap-1 rounded-md border p-2 shadow-sm ${!isPendingSource && currentSchedule?.status !== 'published' ? 'cursor-grab active:cursor-grabbing' : ''} ${isPendingSource ? 'bg-muted/40 opacity-70 grayscale' : 'bg-card'}`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-1 flex-wrap">
                                                                        <div className="flex items-center gap-1 flex-wrap">
                                                                            <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                                                                                {entry.academic_setup_subject?.parallel_display_code || entry.academic_setup_subject?.display_code || entry.academic_setup_subject?.subject?.code}
                                                                            </Badge>

                                                                            {/* Day group badge for paired sessions */}
                                                                            {dayBadge && (
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className={`text-[9px] px-1 py-0 h-4 ${isFriday ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}
                                                                                >
                                                                                    {dayBadge}
                                                                                </Badge>
                                                                            )}

                                                                            {entry.is_lab_session && (
                                                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                                                                                    LAB
                                                                                </Badge>
                                                                            )}
                                                                        </div>

                                                                        {currentSchedule?.status !== 'published' && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-5 w-5 ml-auto text-muted-foreground hover:text-primary"
                                                                                onClick={() => openRequestDialog(entry)}
                                                                                disabled={isPendingSource}
                                                                                title={isPendingSource ? "Pending Change Request" : "Request Change"}
                                                                            >
                                                                                <Edit className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>

                                                                    {entry.academic_setup_subject?.year_level && (
                                                                        <Badge variant="secondary" className="shrink-0 text-xs px-1.5 py-0 h-5 flex items-center gap-1 font-normal whitespace-nowrap w-fit">
                                                                            <span>{entry.academic_setup_subject.year_level.year_level}</span>
                                                                            {entry.academic_setup_subject.block_number && (
                                                                                <>
                                                                                    <span className="text-muted-foreground/50 mx-0.5">|</span>
                                                                                    <span>Blk {entry.academic_setup_subject.block_number}</span>
                                                                                </>
                                                                            )}
                                                                        </Badge>
                                                                    )}

                                                                    <p className="text-xs font-medium line-clamp-2 mt-1" title={entry.academic_setup_subject?.subject?.name}>
                                                                        {entry.academic_setup_subject?.subject?.name}
                                                                    </p>

                                                                    <div className="mt-auto pt-2 flex flex-col gap-1">
                                                                        {/* Custom time display with duration indicator */}
                                                                        {entry.custom_start_time && entry.custom_end_time && (
                                                                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                                                <Clock className="h-3 w-3" />
                                                                                <span>
                                                                                    {formatTime(entry.custom_start_time)} - {formatTime(entry.custom_end_time)}
                                                                                </span>
                                                                                {/* Show duration */}
                                                                                {(() => {
                                                                                    const start = entry.custom_start_time.split(':').map(Number);
                                                                                    const end = entry.custom_end_time.split(':').map(Number);
                                                                                    const mins = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
                                                                                    const hrs = Math.floor(mins / 60);
                                                                                    const m = mins % 60;
                                                                                    return (
                                                                                        <span className="text-[10px] opacity-75">
                                                                                            ({hrs > 0 ? `${hrs}hr` : ''}{m > 0 ? `${m}m` : ''})
                                                                                        </span>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                            <MapPin className="h-3 w-3" />
                                                                            <span>
                                                                                {entry.room?.name}
                                                                                {entry.room?.room_type === 'laboratory' && ' (Lab)'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[10px] text-muted-foreground font-medium">
                                                                            {(() => {
                                                                                const subject = entry.academic_setup_subject as unknown as { courses?: { code: string }[]; course?: { code: string } };
                                                                                if (subject?.courses && subject.courses.length > 0) {
                                                                                    return subject.courses.map((c) => c.code).join(' / ');
                                                                                }
                                                                                return subject?.course?.code || '';
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()
                                                    ) : (
                                                        <>
                                                            {/* Empty Slot - show drag preview if hovering (direct or paired) */}
                                                            {showDragPreview && draggingEntry ? (
                                                                <div className="absolute inset-1 z-20">
                                                                    {(() => {
                                                                        const previewEntry = draggingEntry;
                                                                        const durationChange = calculateDurationChange(previewEntry, day.value);
                                                                        const targetGroup = getDayGroup(day.value);
                                                                        const newDayBadge = targetGroup === 'MW' ? 'M/W' : targetGroup === 'TTH' ? 'T/TH' : targetGroup === 'FRI' ? 'FRI' : null;

                                                                        // Different styling for paired day (secondary target)
                                                                        const borderColor = isPairedDayTarget ? 'border-blue-400/60' : 'border-primary/60';
                                                                        const bgColor = isPairedDayTarget ? 'bg-blue-500/5' : 'bg-primary/5';

                                                                        return (
                                                                            <div className={`flex h-full w-full flex-col gap-1 rounded-md border-2 border-dashed ${borderColor} ${bgColor} p-2 shadow-lg animate-pulse`}>
                                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                                    {isPairedDayTarget && (
                                                                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-blue-100 text-blue-700 border-blue-200">
                                                                                            Paired
                                                                                        </Badge>
                                                                                    )}
                                                                                    <Badge variant="outline" className={`font-mono text-[10px] shrink-0 ${isPairedDayTarget ? 'bg-blue-50/80 border-blue-300' : 'bg-primary/10 border-primary/30'}`}>
                                                                                        {previewEntry.academic_setup_subject?.parallel_display_code || previewEntry.academic_setup_subject?.display_code || previewEntry.academic_setup_subject?.subject?.code}
                                                                                    </Badge>
                                                                                    {newDayBadge && (
                                                                                        <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 ${targetGroup === 'FRI' ? 'bg-purple-100/80 text-purple-700' : 'bg-blue-100/80 text-blue-700'}`}>
                                                                                            {newDayBadge}
                                                                                        </Badge>
                                                                                    )}
                                                                                    {previewEntry.is_lab_session && (
                                                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-green-50/80 text-green-700 border-green-200">
                                                                                            LAB
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-xs font-medium text-foreground/80 line-clamp-2">
                                                                                    {previewEntry.academic_setup_subject?.subject?.name}
                                                                                </p>

                                                                                {/* Duration change preview */}
                                                                                {durationChange && (
                                                                                    <div className="mt-auto pt-1 border-t border-primary/20">
                                                                                        <div className="flex items-center gap-1 text-[10px]">
                                                                                            <Clock className="h-3 w-3 text-primary" />
                                                                                            <span className="font-mono">{durationChange.original}</span>
                                                                                            <ArrowRight className="h-2.5 w-2.5" />
                                                                                            <span className={`font-mono font-semibold ${durationChange.direction === 'contract' ? 'text-amber-600' : 'text-green-600'}`}>
                                                                                                {durationChange.new}
                                                                                            </span>
                                                                                        </div>
                                                                                        {durationChange.pairedDay && (
                                                                                            <p className="text-[9px] text-muted-foreground mt-0.5">
                                                                                                + {durationChange.pairedDay}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            ) : (
                                                                <div className="h-full w-full rounded opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="text-xs text-muted-foreground font-dashed border-2 border-dashed p-2 rounded-full">+</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Drag Preview Overlay on existing entry (slot occupied warning) */}
                                                    {showDragPreview && draggingEntry && entry && draggingEntry.id !== entry.id && (
                                                        <div className="absolute inset-0 z-30 bg-red-500/20 border-2 border-red-400 border-dashed rounded-md flex items-center justify-center">
                                                            <div className="bg-red-100 dark:bg-red-900/80 px-2 py-1 rounded text-xs font-medium text-red-700 dark:text-red-200">
                                                                Slot occupied
                                                            </div>
                                                        </div>
                                                    )}

                                                    {effectivePendingReq && effectivePendingReq.schedule_entry && (
                                                        <div className={`absolute inset-0 m-1 ${isPairedPending ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'} border rounded-md p-2 shadow-sm z-10 flex flex-col gap-1 group`}>
                                                            <div className="flex items-start justify-between gap-1">
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    <Badge className={`${isPairedPending ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'} text-[10px] h-5 px-1.5`}>
                                                                        {isPairedPending ? 'Paired' : 'Pending'}
                                                                    </Badge>

                                                                    <Badge variant="outline" className={`font-mono text-[10px] shrink-0 bg-white/50 ${isPairedPending ? 'border-blue-200 text-blue-900' : 'border-amber-200 text-amber-900'}`}>
                                                                        {effectivePendingReq.schedule_entry.academic_setup_subject?.parallel_display_code || effectivePendingReq.schedule_entry.academic_setup_subject?.display_code || effectivePendingReq.schedule_entry.academic_setup_subject?.subject?.code}
                                                                    </Badge>

                                                                    {effectivePendingReq.schedule_entry.academic_setup_subject?.year_level && (
                                                                        <Badge variant="secondary" className={`shrink-0 text-xs px-1.5 py-0 h-5 flex items-center gap-1 font-normal whitespace-nowrap ${isPairedPending ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}>
                                                                            <span>{effectivePendingReq.schedule_entry.academic_setup_subject.year_level.year_level}</span>
                                                                            {effectivePendingReq.schedule_entry.academic_setup_subject.block_number && (
                                                                                <>
                                                                                    <span className={`${isPairedPending ? 'text-blue-600/50' : 'text-amber-600/50'} mx-0.5`}>|</span>
                                                                                    <span>Blk {effectivePendingReq.schedule_entry.academic_setup_subject.block_number}</span>
                                                                                </>
                                                                            )}
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                {!isPairedPending && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); cancelRequest(effectivePendingReq.id); }}
                                                                        className={`${isPairedPending ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'} hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0`}
                                                                        title="Cancel Request"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <p className={`text-xs font-medium ${isPairedPending ? 'text-blue-900 dark:text-blue-100' : 'text-amber-900 dark:text-amber-100'} line-clamp-2 mt-0.5`}>
                                                                {effectivePendingReq.schedule_entry.academic_setup_subject?.subject?.name}
                                                            </p>

                                                            <div className="mt-auto flex flex-col gap-0.5">
                                                                {(() => {
                                                                    const entry = effectivePendingReq.schedule_entry;
                                                                    if (!entry) return null;

                                                                    const targetSlot = timeSlots.find(ts => ts.id === effectivePendingReq.target_time_slot_id);
                                                                    if (!targetSlot) return null;

                                                                    // Calculate Duration
                                                                    let durationMins = 60;
                                                                    if (entry.custom_start_time && entry.custom_end_time) {
                                                                        const [sH, sM] = entry.custom_start_time.split(':').map(Number);
                                                                        const [eH, eM] = entry.custom_end_time.split(':').map(Number);
                                                                        durationMins = (eH * 60 + eM) - (sH * 60 + sM);
                                                                    } else {
                                                                        // Fallback to time_slot if available or lookup
                                                                        const srcSlot = entry.time_slot || timeSlots.find(ts => ts.id === entry.time_slot_id);
                                                                        if (srcSlot) {
                                                                            const [sH, sM] = srcSlot.start_time.split(':').map(Number);
                                                                            const [eH, eM] = srcSlot.end_time.split(':').map(Number);
                                                                            durationMins = (eH * 60 + eM) - (sH * 60 + sM);
                                                                        }
                                                                    }

                                                                    // Apply Combine/Split Logic
                                                                    const originalGroup = getDayGroup(entry.day);
                                                                    const targetGroup = getDayGroup(effectivePendingReq.target_day);

                                                                    // Combine: Paired -> Single (Double Duration)
                                                                    if ((originalGroup === 'MW' || originalGroup === 'TTH') && ['FRI', 'SAT', 'SUN'].includes(targetGroup)) {
                                                                        durationMins *= 2;
                                                                    }
                                                                    // Split: Single -> Paired (Halve Duration)
                                                                    else if (['FRI', 'SAT', 'SUN'].includes(originalGroup) && ['MW', 'TTH'].includes(targetGroup)) {
                                                                        durationMins /= 2;
                                                                    }

                                                                    // Calculate New End Time
                                                                    const [tH, tM] = targetSlot.start_time.split(':').map(Number);
                                                                    const newEndMins = (tH * 60 + tM) + durationMins;
                                                                    const newEH = Math.floor(newEndMins / 60);
                                                                    const newEM = newEndMins % 60;

                                                                    const startTimeStr = formatTime(targetSlot.start_time);
                                                                    // Construct HH:mm:ss for formatTime to consume, or just use simpler formatting
                                                                    // formatTime expects "HH:mm:ss" string probably.
                                                                    const endTimeString = `${newEH.toString().padStart(2, '0')}:${newEM.toString().padStart(2, '0')}:00`;
                                                                    const endTimeStr = formatTime(endTimeString);

                                                                    const durationStr = durationMins >= 60
                                                                        ? (durationMins / 60).toFixed(1).replace('.0', '') + 'hr'
                                                                        : durationMins + 'm';

                                                                    return (
                                                                        <div className={`text-[10px] ${isPairedPending ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'} flex items-center gap-1 font-medium`}>
                                                                            <Clock className="h-3 w-3" />
                                                                            {startTimeStr} - {endTimeStr}
                                                                            <span className="opacity-70 ml-0.5">({durationStr})</span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                                <div className={`text-[10px] ${isPairedPending ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'} flex items-center gap-1`}>
                                                                    <MapPin className="h-3 w-3" />
                                                                    {rooms.find(r => r.id === effectivePendingReq.target_room_id)?.name || 'Room ' + effectivePendingReq.target_room_id}
                                                                </div>
                                                                <div className={`text-[10px] ${isPairedPending ? 'text-blue-800/80' : 'text-amber-800/80'} font-medium`}>
                                                                    {(() => {
                                                                        const s = effectivePendingReq.schedule_entry.academic_setup_subject as unknown as { courses?: { code: string }[]; course?: { code: string } };
                                                                        if (s?.courses && s.courses.length > 0) {
                                                                            return s.courses.map((c) => c.code).join(' / ');
                                                                        }
                                                                        return s?.course?.code || '';
                                                                    })()}
                                                                </div>
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
                )}

                {/* Teaching Load Summary Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Teaching Load Summary</CardTitle>
                        <CardDescription>Total units and hours based on the selected schedule</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            // Calculate total units by summing units from all entries and dividing by 2
                            // This accounts for paired schedules (MW/TTH) where each subject appears twice
                            const totalUnitsRaw = entries.reduce((sum, entry) => {
                                return sum + (entry.academic_setup_subject?.subject?.units || 0);
                            }, 0);
                            // Divide by 2 since each subject has 2 entries (MW or TTH paired schedules)
                            const totalUnits = Math.round(totalUnitsRaw / 2);

                            // Count unique session groups for total "subject assignments"
                            // Each session_group_id represents one teaching assignment (subject + block combo)
                            const uniqueSessionGroups = new Set<string>();
                            entries.forEach(entry => {
                                const groupKey = entry.session_group_id ||
                                    `${entry.academic_setup_subject_id}_${entry.is_lab_session ? 'lab' : 'lec'}`;
                                uniqueSessionGroups.add(groupKey);
                            });
                            // Divide by 2 to get unique teaching assignments (since MW/TTH pairs share same session_group_id but different entries)
                            // Note: session_group_id groups paired entries, so we just count the set size
                            const totalSubjects = uniqueSessionGroups.size;

                            // Calculate total teaching hours per week
                            let totalMinutes = 0;
                            entries.forEach(entry => {
                                if (entry.custom_start_time && entry.custom_end_time) {
                                    const start = entry.custom_start_time.split(':').map(Number);
                                    const end = entry.custom_end_time.split(':').map(Number);
                                    const startMins = start[0] * 60 + start[1];
                                    const endMins = end[0] * 60 + end[1];
                                    totalMinutes += (endMins - startMins);
                                } else {
                                    totalMinutes += (entry.time_slot?.duration_minutes || 90);
                                }
                            });
                            const totalHours = (totalMinutes / 60).toFixed(1);

                            return (
                                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="flex flex-col gap-1 rounded-lg border p-3">
                                        <dt className="text-sm font-medium text-muted-foreground">Total Subjects</dt>
                                        <dd className="text-2xl font-bold">{totalSubjects}</dd>
                                    </div>
                                    <div className="flex flex-col gap-1 rounded-lg border p-3">
                                        <dt className="text-sm font-medium text-muted-foreground">Total Units</dt>
                                        <dd className="text-2xl font-bold">{totalUnits}</dd>
                                    </div>
                                    <div className="flex flex-col gap-1 rounded-lg border p-3">
                                        <dt className="text-sm font-medium text-muted-foreground">Total Hours/Week</dt>
                                        <dd className="text-2xl font-bold">{totalHours}</dd>
                                    </div>
                                </dl>
                            );
                        })()}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Request Schedule Change</DialogTitle>
                        <DialogDescription>
                            Propose a new time or room. The scheduler must approve this request.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitRequest} className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Day</Label>
                                <Select
                                    value={requestData.target_day}
                                    onValueChange={(val) => setRequestData({ ...requestData, target_day: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map(d => (
                                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Time Slot</Label>
                                <Select
                                    value={requestData.target_time_slot_id}
                                    onValueChange={(val) => setRequestData({ ...requestData, target_time_slot_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.map(slot => (
                                            <SelectItem key={slot.id} value={slot.id.toString()}>
                                                {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Duration Change Preview */}
                        {selectedEntry && requestData.target_day && (() => {
                            const durationChange = calculateDurationChange(selectedEntry, requestData.target_day);
                            if (!durationChange) return null;

                            return (
                                <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-3 text-sm">
                                    <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                        <Clock className="h-4 w-4" />
                                        Duration Adjustment Preview
                                    </div>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                            <span className="font-medium">Session Type:</span>
                                            <Badge variant="outline" className={durationChange.isLab ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200'}>
                                                {durationChange.isLab ? 'Laboratory' : 'Lecture'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Current duration:</span>
                                            <span className="font-mono font-semibold">{durationChange.original}</span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            <span className={`font-mono font-semibold ${durationChange.direction === 'contract' ? 'text-amber-600' : 'text-green-600'}`}>
                                                {durationChange.new}
                                            </span>
                                            <span className="text-muted-foreground">per session</span>
                                        </div>
                                        {durationChange.pairedDay && (
                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>This will also meet on <strong>{durationChange.pairedDay}</strong> at the same time</span>
                                            </div>
                                        )}
                                        {durationChange.direction === 'contract' && (
                                            <p className="text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Duration will be split across two days (MW or TTH)
                                            </p>
                                        )}
                                        {durationChange.direction === 'expand' && (
                                            <p className="text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                                <Check className="h-3 w-3" />
                                                Full duration in a single Friday session
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex flex-col gap-2">
                            <Label>Room</Label>
                            <Select
                                value={requestData.target_room_id}
                                onValueChange={(val) => setRequestData({ ...requestData, target_room_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select room" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms && rooms.map(room => (
                                        <SelectItem key={room.id} value={room.id.toString()}>
                                            {room.name} {room.room_type === 'laboratory' ? '(Lab)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => checkConflict()}
                                disabled={checkingConflict}
                            >
                                {checkingConflict ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Check Conflict
                            </Button>
                        </div>

                        {conflictResult && (
                            <div className={`rounded-md p-3 text-sm ${conflictResult.has_conflict ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {conflictResult.has_conflict ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <AlertCircle className="h-4 w-4" />
                                            Conflict Found
                                        </div>
                                        <ul className="list-disc pl-5 text-xs space-y-0.5">
                                            {conflictResult.conflicts.map((c, i) => (
                                                <li key={i}>{c}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Check className="h-4 w-4" />
                                        No Conflict Found
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Label>Reason for Change</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={requestData.reason}
                                onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                                placeholder="Please explain why update is needed..."
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || (conflictResult?.has_conflict ?? false)}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Request'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!cancelRequestId} onOpenChange={(open) => !open && setCancelRequestId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Cancel Change Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this Pending Request? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setCancelRequestId(null)}
                            disabled={processingCancel}
                        >
                            Keep Request
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmCancel}
                            disabled={processingCancel}
                        >
                            {processingCancel ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Yes, Cancel Request'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Request History</DialogTitle>
                        <DialogDescription>
                            Your past schedule change requests.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {requestHistory && requestHistory.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Change To</TableHead>
                                        <TableHead>Admin Notes</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requestHistory.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell>
                                                <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'outline'} className={req.status === 'approved' ? 'bg-green-600' : ''}>
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {req.schedule_entry?.academic_setup_subject?.subject?.code}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs text-muted-foreground">
                                                    <span className="capitalize">{req.target_day} • {req.target_time_slot?.start_time.substring(0, 5)}</span>
                                                    <span>{req.target_room?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {req.admin_notes ? (
                                                    <span className="text-xs italic text-muted-foreground">"{req.admin_notes}"</span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <Clock className="h-10 w-10 mb-2 opacity-20" />
                                <p>No history found.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout >
    );
}
