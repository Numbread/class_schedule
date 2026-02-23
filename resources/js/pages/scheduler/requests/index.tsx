import { Head, router } from '@inertiajs/react';
import { ArrowRight, Check, X, Calendar, Clock, MapPin, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';



interface RequestItem {
    id: number;
    user: { name: string; email: string; avatar?: string };
    schedule_entry: {
        day: string;
        time_slot: { start_time: string; end_time: string };
        room: { name: string };
        academic_setup_subject: {
            subject: { code: string; name: string };
            year_level?: { year_level: string };
            block_number?: string;
            display_code?: string;
        };
        custom_start_time?: string;
        custom_end_time?: string;
    };
    target_day: string;
    target_time_slot: { start_time: string; end_time: string };
    target_room: { name: string };
    reason: string;
    created_at: string;
    status: string;
    admin_notes?: string;
}

interface PageProps {
    requests: RequestItem[];
    history: RequestItem[];
}

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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '#' },
    { title: 'Schedule Requests', href: '/schedule-requests' },
];

export default function ScheduleRequestsIndex({ requests, history }: PageProps) {
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

    const handleApprove = (req: RequestItem) => {
        setSelectedRequest(req);
        setApproveDialogOpen(true);
    };

    const confirmApprove = () => {
        if (!selectedRequest) return;

        setProcessingId(selectedRequest.id);
        setActionType('approve');
        router.post(`/schedule-requests/${selectedRequest.id}/approve`, {}, {
            onFinish: () => {
                setProcessingId(null);
                setActionType(null);
                setApproveDialogOpen(false);
                setSelectedRequest(null);
            }
        });
    };

    const openRejectDialog = (req: RequestItem) => {
        setSelectedRequest(req);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    const handleReject = () => {
        if (!selectedRequest) return;

        setProcessingId(selectedRequest.id);
        setActionType('reject');
        router.post(`/schedule-requests/${selectedRequest.id}/reject`, {
            reason: rejectReason
        }, {
            onFinish: () => {
                setProcessingId(null);
                setActionType(null);
                setRejectDialogOpen(false);
                setSelectedRequest(null);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Change Requests" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Schedule Change Requests</h1>
                        <p className="text-muted-foreground">
                            Manage faculty requests for schedule modifications.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <TabsList>
                        <TabsTrigger value="pending">Pending Requests ({requests.length})</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Requests</CardTitle>
                                <CardDescription>
                                    Review the {requests.length} pending requests below.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {requests.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <Check className="h-10 w-10 mb-2 opacity-20" />
                                        <p>No pending requests. Good job!</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Requester</TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Current Schedule</TableHead>
                                                <TableHead></TableHead>
                                                <TableHead>Requested Change</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requests.map((request) => (
                                                <TableRow key={request.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{request.user.name}</span>
                                                            <span className="text-xs text-muted-foreground">{request.user.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <Badge variant="outline" className="w-fit font-mono text-[10px]">
                                                                {request.schedule_entry.academic_setup_subject.display_code || request.schedule_entry.academic_setup_subject.subject.code}
                                                            </Badge>
                                                            <span className="text-xs line-clamp-1 max-w-[150px]" title={request.schedule_entry.academic_setup_subject.subject.name}>
                                                                {request.schedule_entry.academic_setup_subject.subject.name}
                                                            </span>
                                                            {request.schedule_entry.academic_setup_subject.year_level && (
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {request.schedule_entry.academic_setup_subject.year_level.year_level}
                                                                    {request.schedule_entry.academic_setup_subject.block_number && ` | Blk ${request.schedule_entry.academic_setup_subject.block_number}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {(() => {
                                                                    const day = request.schedule_entry.day;
                                                                    const dayGroup = getDayGroup(day);
                                                                    const isPaired = dayGroup === 'MW' || dayGroup === 'TTH';

                                                                    return (
                                                                        <span className="capitalize">
                                                                            {day}
                                                                            {isPaired && (
                                                                                <span className="text-[10px] ml-1 opacity-70">
                                                                                    & {getPairedDay(day)}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {(() => {
                                                                    // Calculate original duration
                                                                    const start = request.schedule_entry.custom_start_time || request.schedule_entry.time_slot.start_time;
                                                                    const end = request.schedule_entry.custom_end_time || request.schedule_entry.time_slot.end_time;

                                                                    return (
                                                                        <span>
                                                                            {start.substring(0, 5)} - {end.substring(0, 5)}
                                                                            {(() => {
                                                                                // Optional: Show duration
                                                                                const [sH, sM] = start.split(':').map(Number);
                                                                                const [eH, eM] = end.split(':').map(Number);
                                                                                const mins = (eH * 60 + eM) - (sH * 60 + sM);
                                                                                const hrs = mins / 60;
                                                                                return <span className="ml-1 opacity-70">({hrs === 1 ? '1hr' : hrs + 'hrs'})</span>
                                                                            })()}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                <span>{request.schedule_entry.room.name}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1 text-xs font-medium">
                                                            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                                                <Calendar className="h-3 w-3" />
                                                                {(() => {
                                                                    const day = request.target_day;
                                                                    const dayGroup = getDayGroup(day);
                                                                    const isPaired = dayGroup === 'MW' || dayGroup === 'TTH';

                                                                    return (
                                                                        <span className="capitalize">
                                                                            {day}
                                                                            {isPaired && (
                                                                                <span className="text-[10px] font-normal ml-1 opacity-80">
                                                                                    & {getPairedDay(day)}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                                                <Clock className="h-3 w-3" />
                                                                {(() => {
                                                                    // Calculate NEW duration logic
                                                                    const originalDayGroup = getDayGroup(request.schedule_entry.day);
                                                                    const targetDayGroup = getDayGroup(request.target_day);

                                                                    // Get base time from target slot
                                                                    const targetStart = request.target_time_slot.start_time;
                                                                    let targetEnd = request.target_time_slot.end_time;

                                                                    // Calculate expected duration based on move type
                                                                    const start = request.schedule_entry.custom_start_time || request.schedule_entry.time_slot.start_time;
                                                                    const end = request.schedule_entry.custom_end_time || request.schedule_entry.time_slot.end_time;
                                                                    const [sH, sM] = start.split(':').map(Number);
                                                                    const [eH, eM] = end.split(':').map(Number);
                                                                    const originalMins = (eH * 60 + eM) - (sH * 60 + sM);

                                                                    let newMins = originalMins;
                                                                    let durationChanged = false;

                                                                    // Logic: Single (FRI/SAT/SUN) -> Paired (MW/TTH) = Halve duration
                                                                    if (['FRI', 'SAT', 'SUN'].includes(originalDayGroup) && ['MW', 'TTH'].includes(targetDayGroup)) {
                                                                        newMins = originalMins / 2;
                                                                        durationChanged = true;
                                                                    }
                                                                    // Logic: Paired -> Single = Double duration
                                                                    else if (['MW', 'TTH'].includes(originalDayGroup) && ['FRI', 'SAT', 'SUN'].includes(targetDayGroup)) {
                                                                        newMins = originalMins * 2;
                                                                        durationChanged = true;
                                                                    }

                                                                    // Recalculate end time for display if changed
                                                                    if (durationChanged) {
                                                                        const [tH, tM] = targetStart.split(':').map(Number);
                                                                        const totalMins = (tH * 60 + tM) + newMins;
                                                                        const newEH = Math.floor(totalMins / 60);
                                                                        const newEM = totalMins % 60;
                                                                        targetEnd = `${newEH.toString().padStart(2, '0')}:${newEM.toString().padStart(2, '0')}:00`;
                                                                    }

                                                                    const hrs = newMins / 60;

                                                                    return (
                                                                        <span>
                                                                            {targetStart.substring(0, 5)} - {targetEnd.substring(0, 5)}
                                                                            <span className={`ml-1 ${durationChanged ? 'font-bold underline' : 'opacity-70'}`}>
                                                                                ({hrs === 1 ? '1hr' : hrs + 'hrs'})
                                                                            </span>
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                                                <MapPin className="h-3 w-3" />
                                                                <span>{request.target_room.name}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-xs text-muted-foreground max-w-[200px] line-clamp-3" title={request.reason}>
                                                            {request.reason}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => openRejectDialog(request)}
                                                                disabled={processingId === request.id}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={() => handleApprove(request)}
                                                                disabled={processingId === request.id}
                                                            >
                                                                {processingId === request.id && actionType === 'approve' ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Check className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Request History</CardTitle>
                                <CardDescription>
                                    Past approved or rejected requests.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <div className="h-10 w-10 mb-2 opacity-20 bg-muted rounded-full" />
                                        <p>No history available.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Requester</TableHead>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Requested Change</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {history.map((request) => (
                                                <TableRow key={request.id}>
                                                    <TableCell>
                                                        <Badge variant={request.status === 'approved' ? 'default' : 'destructive'} className={request.status === 'approved' ? 'bg-green-600' : ''}>
                                                            {request.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{request.user.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs font-medium">
                                                            {request.schedule_entry.academic_setup_subject.display_code || request.schedule_entry.academic_setup_subject.subject.code}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                {(() => {
                                                                    const day = request.target_day;
                                                                    const dayGroup = getDayGroup(day);
                                                                    const isPaired = dayGroup === 'MW' || dayGroup === 'TTH';

                                                                    return (
                                                                        <span className="capitalize">
                                                                            {day}
                                                                            {isPaired && (
                                                                                <span className="text-[10px] ml-1 opacity-70">
                                                                                    & {getPairedDay(day)}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    );
                                                                })()}
                                                                <span>• {request.target_time_slot.start_time.substring(0, 5)}</span>
                                                            </div>
                                                            <span>{request.target_room.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {request.admin_notes && (
                                                            <p className="text-xs text-muted-foreground italic">"{request.admin_notes}"</p>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Request</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for rejecting this request. This will be visible to the faculty member.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="reason">Rejection Reason</Label>
                                <textarea
                                    id="reason"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g., Room is reserved for maintenance..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={!rejectReason || (processingId === selectedRequest?.id && actionType === 'reject')}
                            >
                                {processingId === selectedRequest?.id && actionType === 'reject' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Rejecting...
                                    </>
                                ) : (
                                    'Reject Request'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve Request</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to approve this request?
                                This will <strong>immediately update the official schedule</strong> and notify the faculty.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={confirmApprove}
                                disabled={processingId === selectedRequest?.id && actionType === 'approve'}
                            >
                                {processingId === selectedRequest?.id && actionType === 'approve' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Approving...
                                    </>
                                ) : (
                                    'Yes, Approve'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
