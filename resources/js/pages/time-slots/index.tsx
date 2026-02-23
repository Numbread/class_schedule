import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Clock, Edit, MoreHorizontal, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmModal, FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
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
    type DayGroup,
    type PaginatedData,
    type TimeSlot,
    type User,
} from '@/types';

interface Props {
    timeSlots: PaginatedData<TimeSlot>;
    filters: {
        search?: string;
        day_group?: string;
        status?: string;
    };
    dayGroups: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Facilities', href: '#' },
    { title: 'Time Slots', href: '/time-slots' },
];

type ModalMode = 'create' | 'edit' | null;

const DAY_GROUP_LABELS: Record<string, string> = {
    MW: 'Monday / Wednesday',
    TTH: 'Tuesday / Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
    SUN: 'Sunday',
};

export default function TimeSlotsIndex({ timeSlots, filters, dayGroups }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const isScheduler = auth.user.user_type === 'scheduler';
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        timeSlot: TimeSlot | null;
    }>({ open: false, timeSlot: null });

    const form = useForm<{
        day_group: DayGroup;
        start_time: string;
        end_time: string;
        priority: number;
        name: string;
        is_active: boolean;
    }>({
        day_group: 'MW',
        start_time: '',
        end_time: '',
        priority: 1,
        name: '',
        is_active: true,
    });

    const openCreateModal = () => {
        form.reset();
        form.setData({
            day_group: 'MW',
            start_time: '08:00',
            end_time: '09:30',
            priority: 1,
            name: '',
            is_active: true,
        });
        form.clearErrors();
        setSelectedTimeSlot(null);
        setModalMode('create');
    };

    const openEditModal = (timeSlot: TimeSlot) => {
        // Parse time strings to HH:mm format properly if they come with seconds
        const formatTime = (timeStr: string) => {
            if (!timeStr) return '';
            return timeStr.substring(0, 5);
        };

        form.setData({
            day_group: timeSlot.day_group,
            start_time: formatTime(timeSlot.start_time),
            end_time: formatTime(timeSlot.end_time),
            priority: timeSlot.priority,
            name: timeSlot.name,
            is_active: timeSlot.is_active,
        });
        form.clearErrors();
        setSelectedTimeSlot(timeSlot);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedTimeSlot(null);
        form.reset();
    };

    const handleSubmit = () => {
        if (modalMode === 'create') {
            form.post('/time-slots', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else if (modalMode === 'edit' && selectedTimeSlot) {
            form.patch(`/time-slots/${selectedTimeSlot.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleSearch = () => {
        router.get(
            '/time-slots',
            { ...filters, search: searchValue },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (value === 'all') {
            delete newFilters[key as keyof typeof newFilters];
        }
        router.get('/time-slots', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToggleStatus = (timeSlot: TimeSlot) => {
        router.patch(
            `/time-slots/${timeSlot.id}/toggle-status`,
            {},
            { preserveScroll: true }
        );
    };

    const handleDelete = () => {
        if (deleteDialog.timeSlot) {
            router.delete(`/time-slots/${deleteDialog.timeSlot.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteDialog({ open: false, timeSlot: null }),
            });
        }
    };

    const getPriorityBadge = (priority: number) => {
        const colors =
            priority <= 5
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                : priority <= 15
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                  : 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';

        return (
            <Badge variant="outline" className={colors}>
                Priority {priority}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Time Slot Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Time Slot Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage class schedules and time periods
                        </p>
                    </div>
                    {!isScheduler && (
                        <Button onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Time Slot
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2">
                        <Input
                            placeholder="Search by name or day group..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="max-w-sm"
                        />
                        <Button variant="secondary" onClick={handleSearch}>
                            Search
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={filters.day_group || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('day_group', value)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Day Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Day Groups</SelectItem>
                                {dayGroups.map((group) => (
                                    <SelectItem key={group} value={group}>
                                        {group} - {DAY_GROUP_LABELS[group] || group}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('status', value)
                            }
                        >
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-muted/50 border-b hover:bg-muted/50">
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Day Group / Name
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Time Period
                                </TableHead>
                                <TableHead className="px-4 py-3 text-center text-sm font-medium">
                                    Duration
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Priority
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Status
                                </TableHead>
                                {!isScheduler && (
                                    <TableHead className="px-4 py-3 text-right text-sm font-medium">
                                        Actions
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timeSlots.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isScheduler ? 5 : 6} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                                <Clock className="text-muted-foreground h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium">No time slots found</p>
                                                <p className="text-muted-foreground text-sm">
                                                    Add your first time slot to get started
                                                </p>
                                            </div>
                                            <Button size="sm" onClick={openCreateModal}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Time Slot
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                timeSlots.data.map((slot, index) => {
                                    const prevSlot = index > 0 ? timeSlots.data[index - 1] : null;
                                    const showHeader = !prevSlot || prevSlot.day_group !== slot.day_group;

                                    return (
                                        <>
                                            {showHeader && (
                                                <TableRow key={`header-${slot.day_group}-${slot.id}`} className="bg-muted/40 hover:bg-muted/40">
                                                    <TableCell colSpan={isScheduler ? 5 : 6} className="px-4 py-2 text-sm font-semibold text-primary border-b border-t first:border-t-0">
                                                        {DAY_GROUP_LABELS[slot.day_group] || slot.day_group}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow
                                                key={slot.id}
                                                className="hover:bg-muted/30 border-b transition-colors last:border-0"
                                            >
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                                                            <Clock className="text-primary h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{slot.day_group}</p>
                                                            <p className="text-muted-foreground text-xs">
                                                                {slot.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                                    {slot.start_time ? slot.start_time.substring(0, 5) : ''} - {slot.end_time ? slot.end_time.substring(0, 5) : ''}
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-center text-sm">
                                                    {slot.duration_minutes} min
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    {getPriorityBadge(slot.priority)}
                                                </TableCell>
                                                <TableCell className="px-4 py-3">
                                                    <StatusBadge status={slot.is_active} />
                                                </TableCell>
                                                {!isScheduler && (
                                                    <TableCell className="px-4 py-3 text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => openEditModal(slot)}
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleToggleStatus(slot)
                                                                    }
                                                                >
                                                                    <Power className="mr-2 h-4 w-4" />
                                                                    {slot.is_active
                                                                        ? 'Deactivate'
                                                                        : 'Activate'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() =>
                                                                        setDeleteDialog({
                                                                            open: true,
                                                                            timeSlot: slot,
                                                                        })
                                                                    }
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        </>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {timeSlots.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Showing {timeSlots.from} to {timeSlots.to} of {timeSlots.total} time slots
                        </p>
                        <div className="flex items-center gap-2">
                            {timeSlots.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.get(link.url, {}, { preserveScroll: true })
                                    }
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <FormModal
                open={modalMode !== null}
                onOpenChange={(open) => !open && closeModal()}
                title={modalMode === 'create' ? 'Create New Time Slot' : 'Edit Time Slot'}
                description={
                    modalMode === 'create'
                        ? 'Add a new time period provided for classes'
                        : `Update information for ${selectedTimeSlot?.name}`
                }
                onSubmit={handleSubmit}
                submitLabel={modalMode === 'create' ? 'Create Time Slot' : 'Save Changes'}
                isSubmitting={form.processing}
                size="lg"
            >
                <div className="space-y-6">
                    {/* Time Slot Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Time Slot Information</h4>
                        
                        <div className="space-y-2">
                             <Label htmlFor="day_group">
                                 Day Group <span className="text-destructive">*</span>
                             </Label>
                             <Select
                                 value={form.data.day_group}
                                 onValueChange={(value) =>
                                     form.setData('day_group', value as DayGroup)
                                 }
                             >
                                 <SelectTrigger>
                                     <SelectValue placeholder="Select day group" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     {dayGroups.map((group) => (
                                         <SelectItem key={group} value={group}>
                                             {group} - {DAY_GROUP_LABELS[group] || group}
                                         </SelectItem>
                                     ))}
                                 </SelectContent>
                             </Select>
                             <InputError message={form.errors.day_group} />
                         </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="start_time">
                                    Start Time <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="start_time"
                                    type="time"
                                    value={form.data.start_time}
                                    onChange={(e) => form.setData('start_time', e.target.value)}
                                />
                                <InputError message={form.errors.start_time} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end_time">
                                    End Time <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="end_time"
                                    type="time"
                                    value={form.data.end_time}
                                    onChange={(e) => form.setData('end_time', e.target.value)}
                                />
                                <InputError message={form.errors.end_time} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="priority">
                                    Priority (1 - Highest){' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    min={1}
                                    value={form.data.priority}
                                    onChange={(e) =>
                                        form.setData(
                                            'priority',
                                            parseInt(e.target.value) || 1
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    Lower number = Higher priority
                                </p>
                                <InputError message={form.errors.priority} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Name (Optional)</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Morning Block 1"
                                />
                                <p className="text-muted-foreground text-xs">
                                    Defaults to time range if empty
                                </p>
                                <InputError message={form.errors.name} />
                            </div>
                        </div>

                        {modalMode === 'edit' && (
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={form.data.is_active}
                                        onCheckedChange={(checked) =>
                                            form.setData('is_active', checked as boolean)
                                        }
                                    />
                                    <Label
                                        htmlFor="is_active"
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        Active (can be used in scheduling)
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog({ open, timeSlot: open ? deleteDialog.timeSlot : null })
                }
                title="Delete Time Slot"
                description={
                    <>
                        Are you sure you want to delete{' '}
                        <strong>
                            {deleteDialog.timeSlot?.name} ({deleteDialog.timeSlot?.day_group})
                        </strong>
                        ? This action cannot be undone.
                    </>
                }
                onConfirm={handleDelete}
                confirmLabel="Delete"
                variant="destructive"
            />
        </AppLayout>
    );
}
