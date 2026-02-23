import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Calendar, Eye, FileText, Loader2, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmModal, FormModal } from '@/components/ui/form-modal';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
    type AcademicSetup,
    type BreadcrumbItem,
    type PaginatedData,
    type Room,
    type Schedule,
    type SharedData,
    type TimeSlot,
} from '@/types';
import { formatForUser } from '@/utils/timezone';

interface Props {
    academicSetups: AcademicSetup[];
    schedules: PaginatedData<Schedule>;
    rooms: Room[];
    timeSlots: TimeSlot[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scheduling', href: '#' },
    { title: 'Scheduling', href: '/scheduling' },
];

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    published: 'default',
    archived: 'outline',
};

interface ProgressState {
    progress: number;
    message: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'not_found';
    schedule_id: number | null;
}

export default function SchedulingIndex({ academicSetups, schedules, rooms, timeSlots }: Props) {
    const { auth, csrf_token } = usePage<SharedData>().props;
    const [generateModal, setGenerateModal] = useState(false);
    const [progressModal, setProgressModal] = useState(false);
    const [progressState, setProgressState] = useState<ProgressState>({
        progress: 0,
        message: 'Initializing...',
        status: 'pending',
        schedule_id: null,
    });
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        schedule: Schedule | null;
    }>({ open: false, schedule: null });
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const jobKeyRef = useRef<string | null>(null);

    const generateForm = useForm({
        academic_setup_id: '',
        population_size: 200,
        max_generations: 100,
        mutation_rate: 0.5,
        included_days: ['MW', 'TTH', 'FRI'] as string[], // Default: exclude SAT and SUN
        target_fitness_min: 0 as number | null,
        target_fitness_max: 100 as number | null,
    });

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const pollProgress = (jobKey: string) => {
        pollingRef.current = setInterval(async () => {
            try {
                const response = await fetch(`/scheduling/progress?job_key=${jobKey}`, {
                    headers: { 'Accept': 'application/json' }
                });
                const data = await response.json();

                setProgressState(data);

                if (data.status === 'completed') {
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                    // Redirect to the generated schedule after a short delay
                    setTimeout(() => {
                        if (data.schedule_id) {
                            router.visit(`/scheduling/${data.schedule_id}`);
                        } else {
                            setProgressModal(false);
                            router.reload();
                        }
                    }, 1000);
                } else if (data.status === 'failed') {
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                }
            } catch (error) {
                console.error('Error polling progress:', error);
            }
        }, 500); // Poll every 500ms
    };

    const handleGenerate = async () => {
        setGenerateModal(false);
        setProgressModal(true);
        setProgressState({
            progress: 0,
            message: 'Starting generation...',
            status: 'pending',
            schedule_id: null,
        });

        try {
            const response = await fetch('/scheduling/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrf_token,
                },
                body: JSON.stringify(generateForm.data)
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                throw { response: { data } };
            }

            if (data.job_key) {
                jobKeyRef.current = data.job_key;
                // Check progress immediately (job may have completed synchronously)
                const progressResponse = await fetch(`/scheduling/progress?job_key=${data.job_key}`, {
                    headers: { 'Accept': 'application/json' }
                });
                const progressData = await progressResponse.json();
                setProgressState(progressData);

                if (progressData.status === 'completed' && progressData.schedule_id) {
                    // Job completed synchronously, redirect directly
                    setTimeout(() => {
                        router.visit(`/scheduling/${progressData.schedule_id}`);
                    }, 1000);
                } else if (progressData.status !== 'failed') {
                    // Start polling for async jobs
                    pollProgress(data.job_key);
                }
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to start generation. Please try again.';
            setProgressState({
                progress: 0,
                message: errorMessage,
                status: 'failed',
                schedule_id: null,
            });
        }
    };

    const handleCancelProgress = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setProgressModal(false);
        generateForm.reset();
    };

    const handleDelete = () => {
        if (deleteDialog.schedule) {
            router.delete(`/scheduling/${deleteDialog.schedule.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteDialog({ open: false, schedule: null }),
            });
        }
    };

    const handlePublish = (schedule: Schedule) => {
        router.patch(`/scheduling/${schedule.id}/publish`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Scheduling" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Schedule Generation</h1>
                        <p className="text-muted-foreground">
                            Generate and manage class schedules using Genetic Algorithm
                        </p>
                    </div>
                    <Button onClick={() => setGenerateModal(true)} disabled={academicSetups.length === 0}>
                        <Play className="mr-2 h-4 w-4" />
                        Generate Schedule
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Available Setups</p>
                        <p className="text-2xl font-bold">{academicSetups.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Total Rooms</p>
                        <p className="text-2xl font-bold">{rooms.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Time Slots</p>
                        <p className="text-2xl font-bold">{timeSlots.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-muted-foreground text-sm">Generated Schedules</p>
                        <p className="text-2xl font-bold">{schedules.total}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <div className="rounded-lg border">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="bg-muted/50 border-b hover:bg-muted/50">
                                    <TableHead className="px-4 py-3 text-left text-sm font-medium text-black h-auto">Schedule</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-sm font-medium text-black h-auto">Curriculum</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-sm font-medium text-black h-auto">Department</TableHead>
                                    <TableHead className="px-4 py-3 text-center text-sm font-medium text-black h-auto">Entries</TableHead>
                                    <TableHead className="px-4 py-3 text-center text-sm font-medium text-black h-auto">Fitness Score</TableHead>
                                    <TableHead className="px-4 py-3 text-center text-sm font-medium text-black h-auto">Generations</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-sm font-medium text-black h-auto">Status</TableHead>
                                    <TableHead className="px-4 py-3 text-left text-sm font-medium text-black h-auto">Created</TableHead>
                                    <TableHead className="px-4 py-3 text-right text-sm font-medium text-black h-auto">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedules.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                                    <Calendar className="text-muted-foreground h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">No schedules generated</p>
                                                    <p className="text-sm">
                                                        Generate your first schedule using the Genetic Algorithm
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setGenerateModal(true)}
                                                    disabled={academicSetups.length === 0}
                                                >
                                                    <Play className="mr-2 h-4 w-4" />
                                                    Generate Schedule
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    schedules.data.map((schedule) => (
                                        <TableRow
                                            key={schedule.id}
                                            className="hover:bg-muted/30 border-b transition-colors last:border-0"
                                        >
                                            <TableCell className="px-4 py-3">
                                                <p className="font-medium">
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
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {schedule.academic_setup?.curriculum_name || 'N/A'}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {schedule.academic_setup?.semester} Sem - {schedule.academic_setup?.academic_year}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <p className="text-sm">
                                                    {schedule.academic_setup?.department?.name || 'N/A'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <span className="font-medium">{schedule.entries_count || 0}</span>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <Badge
                                                    variant={
                                                        (schedule.fitness_score || 0) >= 0
                                                            ? 'default'
                                                            : (schedule.fitness_score || 0) > -100
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                >
                                                    {schedule.fitness_score ?? 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-center">
                                                <span className="text-muted-foreground">{schedule.generation ?? 'N/A'}</span>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <Badge variant={statusColors[schedule.status] || 'secondary'}>
                                                    {schedule.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-4 py-3">
                                                <p className="text-muted-foreground text-sm">
                                                    {formatForUser(
                                                        schedule.created_at,
                                                        auth.user?.timezone || null,
                                                        {
                                                            year: 'numeric',
                                                            month: 'numeric',
                                                            day: 'numeric',
                                                        }
                                                    )}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/scheduling/${schedule.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Schedule
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {schedule.status === 'draft' && (
                                                            <DropdownMenuItem onClick={() => handlePublish(schedule)}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Publish
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/scheduling/${schedule.id}/export`}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Export
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setDeleteDialog({ open: true, schedule })}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                {schedules.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Showing {schedules.from} to {schedules.to} of {schedules.total} schedules
                        </p>
                        <div className="flex items-center gap-2">
                            {schedules.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Generate Schedule Modal */}
            <FormModal
                open={generateModal}
                onOpenChange={setGenerateModal}
                title="Generate Schedule"
                description="Configure the Genetic Algorithm parameters and generate a new schedule"
                onSubmit={handleGenerate}
                submitLabel="Generate"
                isSubmitting={generateForm.processing}
                size="2xl"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Academic Setup *</Label>
                        <Select
                            value={generateForm.data.academic_setup_id}
                            onValueChange={(value) => generateForm.setData('academic_setup_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an academic setup" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicSetups.map((setup) => {
                                    return (
                                        <SelectItem key={setup.id} value={setup.id.toString()}>
                                            {setup.curriculum_name || 'N/A'} - {setup.semester} Sem ({setup.academic_year})
                                            {setup.configured_years && ` [${setup.configured_years}]`}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <InputError message={generateForm.errors.academic_setup_id} />
                    </div>

                    {/* Day Selection */}
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <h4 className="mb-3 text-sm font-medium">Schedule Days</h4>
                        <p className="text-muted-foreground text-xs mb-3">
                            Select which day groups to include in the schedule
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { value: 'MW', label: 'Mon/Wed' },
                                { value: 'TTH', label: 'Tue/Thu' },
                                { value: 'FRI', label: 'Friday' },
                                { value: 'SAT', label: 'Saturday' },
                                { value: 'SUN', label: 'Sunday' },
                            ].map((day) => (
                                <div key={day.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`day-${day.value}`}
                                        checked={generateForm.data.included_days.includes(day.value)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                generateForm.setData('included_days', [
                                                    ...generateForm.data.included_days,
                                                    day.value,
                                                ]);
                                            } else {
                                                generateForm.setData(
                                                    'included_days',
                                                    generateForm.data.included_days.filter((d) => d !== day.value)
                                                );
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`day-${day.value}`} className="text-sm font-normal cursor-pointer">
                                        {day.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <InputError message={generateForm.errors.included_days} />
                    </div>

                    {/* Genetic Algorithm Parameters section removed - using default values from backend */}

                    {/* Target Fitness Score section removed - using default values: min=0, max=100 */}

                    {/* <div className="rounded-lg border border-amber-200/50 bg-linear-to-r from-amber-50/50 to-amber-50/30 p-4 text-amber-900 dark:border-amber-800/50 dark:from-amber-950/40 dark:to-amber-950/20 dark:text-amber-100">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium mb-1 text-amber-900 dark:text-amber-100">Note</p>
                                <p className="text-sm text-amber-800/90 dark:text-amber-200/80">
                                    Schedule generation may take a few seconds depending on the parameters.
                                    The algorithm will try to find an optimal room allocation based on time slot priorities.
                                </p>
                            </div>
                        </div>
                    </div> */}
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, schedule: open ? deleteDialog.schedule : null })}
                title="Delete Schedule"
                description={
                    <>
                        Are you sure you want to delete <strong>{deleteDialog.schedule?.name}</strong>?
                        This action cannot be undone.
                    </>
                }
                onConfirm={handleDelete}
                confirmLabel="Delete"
                variant="destructive"
            />

            {/* Progress Modal */}
            <Dialog open={progressModal} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {progressState.status === 'running' || progressState.status === 'pending' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : progressState.status === 'completed' ? (
                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            )}
                            Generating Schedule
                        </DialogTitle>
                        <DialogDescription>
                            {progressState.status === 'completed'
                                ? 'Schedule generated successfully! Redirecting...'
                                : progressState.status === 'failed'
                                    ? 'Schedule generation failed.'
                                    : 'Please wait while the genetic algorithm optimizes your schedule.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Progress value={progressState.progress} className="h-3" />

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{progressState.message}</span>
                            <span className="font-medium">{Math.round(progressState.progress)}%</span>
                        </div>

                        {progressState.status === 'running' && (
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground">
                                    The genetic algorithm is evolving candidate solutions to find the optimal
                                    schedule with minimal conflicts and maximum efficiency.
                                </p>
                            </div>
                        )}
                    </div>

                    {(progressState.status === 'failed' || progressState.status === 'not_found') && (
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCancelProgress}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                setProgressModal(false);
                                setGenerateModal(true);
                            }}>
                                Try Again
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

