import { Head, router, useForm, usePage } from '@inertiajs/react';
import { DoorOpen, Edit, MoreHorizontal, Plus, Power, Trash2, Users } from 'lucide-react';
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
import { RoomTypeBadge } from '@/components/ui/status-badge';
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
    type ClassSettings,
    type PaginatedData,
    type Room,
    type User,
} from '@/types';

interface BuildingRecord {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
}

interface Props {
    rooms: PaginatedData<Room>;
    buildings: string[];
    buildingRecords: BuildingRecord[];
    filters: {
        search?: string;
        room_type?: string;
        building?: string;
        building_id?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Facilities', href: '#' },
    { title: 'Rooms', href: '/rooms' },
];

type ModalMode = 'create' | 'edit' | null;

const equipmentOptions = [
    'Projector',
    'Whiteboard',
    'Computer',
    'Air Conditioning',
    'Sound System',
    'Smart Board',
    'Lab Equipment',
];

export default function RoomsIndex({ rooms, buildings, buildingRecords = [], filters }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const isScheduler = auth.user.user_type === 'scheduler';
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        room: Room | null;
    }>({ open: false, room: null });

    const form = useForm<{
        name: string;
        building_id: number | null;
        building: string;
        floor: string;
        room_type: string;
        capacity: number;
        priority: number;
        equipment: string[];
        class_settings: ClassSettings;
        is_available: boolean;
        is_active: boolean;
    }>({
        name: '',
        building_id: null,
        building: '',
        floor: '',
        room_type: 'lecture',
        capacity: 30,
        priority: 5,
        equipment: [],
        class_settings: {
            allow_consecutive: true,
            max_daily_hours: 8,
            preferred_time_slots: [],
        },
        is_available: true,
        is_active: true,
    });

    const openCreateModal = () => {
        form.reset();
        form.setData({
            name: '',
            building_id: null,
            building: '',
            floor: '',
            room_type: 'lecture',
            capacity: 30,
            priority: 5,
            equipment: [],
            class_settings: {
                allow_consecutive: true,
                max_daily_hours: 8,
                preferred_time_slots: [],
            },
            is_available: true,
            is_active: true,
        });
        form.clearErrors();
        setSelectedRoom(null);
        setModalMode('create');
    };

    const openEditModal = (room: Room) => {
        form.setData({
            name: room.name,
            building_id: room.building_id || null,
            building: room.building?.name || '',
            floor: room.floor || '',
            room_type: room.room_type,
            capacity: room.capacity,
            priority: room.priority,
            equipment: room.equipment || [],
            class_settings: room.class_settings || {
                allow_consecutive: true,
                max_daily_hours: 8,
                preferred_time_slots: [],
            },
            is_available: room.is_available,
            is_active: room.is_active,
        });
        form.clearErrors();
        setSelectedRoom(room);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedRoom(null);
        form.reset();
    };

    const handleSubmit = () => {
        if (modalMode === 'create') {
            form.post('/rooms', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else if (modalMode === 'edit' && selectedRoom) {
            form.patch(`/rooms/${selectedRoom.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const toggleEquipment = (item: string) => {
        if (form.data.equipment.includes(item)) {
            form.setData(
                'equipment',
                form.data.equipment.filter((e) => e !== item)
            );
        } else {
            form.setData('equipment', [...form.data.equipment, item]);
        }
    };

    const handleSearch = () => {
        router.get(
            '/rooms',
            { ...filters, search: searchValue },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (value === 'all') {
            delete newFilters[key as keyof typeof newFilters];
        }
        router.get('/rooms', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToggleStatus = (room: Room) => {
        router.patch(
            `/rooms/${room.id}/toggle-status`,
            {},
            { preserveScroll: true }
        );
    };

    const handleToggleAvailability = (room: Room) => {
        router.patch(
            `/rooms/${room.id}/toggle-availability`,
            {},
            { preserveScroll: true }
        );
    };

    const handleDelete = () => {
        if (deleteDialog.room) {
            router.delete(`/rooms/${deleteDialog.room.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteDialog({ open: false, room: null }),
            });
        }
    };

    const getPriorityBadge = (priority: number) => {
        const colors =
            priority >= 8
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                : priority >= 5
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
            <Head title="Room Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Room Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage classrooms and their settings
                        </p>
                    </div>
                    {!isScheduler && (
                        <Button onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Room
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2">
                        <Input
                            placeholder="Search by room name or building..."
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
                            value={filters.room_type || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('room_type', value)
                            }
                        >
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Room Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="lecture">Lecture</SelectItem>
                                <SelectItem value="laboratory">Laboratory</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                        </Select>

                        {(buildingRecords.length > 0 || buildings.length > 0) && (
                            <Select
                                value={filters.building_id || filters.building || 'all'}
                                onValueChange={(value) => {
                                    // Check if value is a building record ID
                                    const isNumeric = !isNaN(parseInt(value));
                                    if (isNumeric) {
                                        handleFilterChange('building_id', value);
                                    } else {
                                        handleFilterChange('building', value);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Building" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Buildings</SelectItem>
                                    {buildingRecords.map((b) => (
                                        <SelectItem key={`rec-${b.id}`} value={b.id.toString()}>
                                            {b.code}
                                        </SelectItem>
                                    ))}
                                    {buildings.filter(b => !buildingRecords.some(br => br.code === b)).map((building) => (
                                        <SelectItem key={`leg-${building}`} value={building}>
                                            {building}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

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
                                    Room
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Building
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Type
                                </TableHead>
                                <TableHead className="px-4 py-3 text-center text-sm font-medium">
                                    Capacity
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Priority
                                </TableHead>
                                {!isScheduler && (
                                    <TableHead className="px-4 py-3 text-right text-sm font-medium">
                                        Actions
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rooms.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                                <DoorOpen className="text-muted-foreground h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium">No rooms found</p>
                                                <p className="text-muted-foreground text-sm">
                                                    Add your first room to get started
                                                </p>
                                            </div>
                                            <Button size="sm" onClick={openCreateModal}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Room
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rooms.data.map((room) => (
                                    <TableRow
                                        key={room.id}
                                        className="hover:bg-muted/30 border-b transition-colors last:border-0"
                                    >
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
                                                    <DoorOpen className="text-primary h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{room.name}</p>
                                                    {room.floor && (
                                                        <p className="text-muted-foreground text-xs">
                                                            Floor {room.floor}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                            {room.building?.code || room.building?.name || '-'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <RoomTypeBadge type={room.room_type} />
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="text-muted-foreground h-4 w-4" />
                                                <span className="font-medium">
                                                    {room.capacity}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            {getPriorityBadge(room.priority)}
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
                                                            onClick={() => openEditModal(room)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleToggleAvailability(room)
                                                            }
                                                        >
                                                            <Power className="mr-2 h-4 w-4" />
                                                            {room.is_available
                                                                ? 'Mark Unavailable'
                                                                : 'Mark Available'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                handleToggleStatus(room)
                                                            }
                                                        >
                                                            <Power className="mr-2 h-4 w-4" />
                                                            {room.is_active
                                                                ? 'Deactivate'
                                                                : 'Activate'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() =>
                                                                setDeleteDialog({
                                                                    open: true,
                                                                    room,
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
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {rooms.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Showing {rooms.from} to {rooms.to} of {rooms.total} rooms
                        </p>
                        <div className="flex items-center gap-2">
                            {rooms.links.map((link, index) => (
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
                title={modalMode === 'create' ? 'Create New Room' : 'Edit Room'}
                description={
                    modalMode === 'create'
                        ? 'Add a new classroom or laboratory'
                        : `Update information for ${selectedRoom?.name}${selectedRoom?.building?.name ? ` - ${selectedRoom.building.name}` : ''}`
                }
                onSubmit={handleSubmit}
                submitLabel={modalMode === 'create' ? 'Create Room' : 'Save Changes'}
                isSubmitting={form.processing}
                size="xl"
            >
                <div className="space-y-6">
                    {/* Room Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Room Information</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Room Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Room 101"
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="building_id">Building</Label>
                                {buildingRecords.length > 0 ? (
                                    <Select
                                        value={form.data.building_id?.toString() || ''}
                                        onValueChange={(value) =>
                                            form.setData('building_id', value ? parseInt(value) : null)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select building" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {buildingRecords.map((b) => (
                                                <SelectItem key={b.id} value={b.id.toString()}>
                                                    {b.code} - {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id="building"
                                        value={form.data.building}
                                        onChange={(e) =>
                                            form.setData('building', e.target.value)
                                        }
                                        placeholder="Main Building"
                                        list="buildings-list"
                                    />
                                )}
                                <datalist id="buildings-list">
                                    {buildings.map((b) => (
                                        <option key={b} value={b} />
                                    ))}
                                </datalist>
                                <InputError message={form.errors.building_id || form.errors.building} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="floor">Floor</Label>
                                <Input
                                    id="floor"
                                    value={form.data.floor}
                                    onChange={(e) => form.setData('floor', e.target.value)}
                                    placeholder="1st Floor"
                                />
                                <InputError message={form.errors.floor} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="room_type">
                                    Room Type <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.data.room_type}
                                    onValueChange={(value) =>
                                        form.setData('room_type', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select room type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lecture">Lecture Room</SelectItem>
                                        <SelectItem value="laboratory">Laboratory</SelectItem>
                                        <SelectItem value="hybrid">
                                            Hybrid (Lecture + Lab)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.room_type} />
                            </div>
                        </div>

                        {modalMode === 'edit' && (
                            <div className="space-y-2">
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
                                        Active (room can be used in scheduling)
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_available"
                                        checked={form.data.is_available}
                                        onCheckedChange={(checked) =>
                                            form.setData('is_available', checked as boolean)
                                        }
                                    />
                                    <Label
                                        htmlFor="is_available"
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        Currently available for new schedules
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Capacity & Priority */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Capacity & Priority</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="capacity">
                                    Capacity <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={form.data.capacity}
                                    onChange={(e) =>
                                        form.setData(
                                            'capacity',
                                            parseInt(e.target.value) || 1
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    Maximum number of students
                                </p>
                                <InputError message={form.errors.capacity} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">
                                    Priority (1-10){' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={form.data.priority}
                                    onChange={(e) =>
                                        form.setData(
                                            'priority',
                                            parseInt(e.target.value) || 1
                                        )
                                    }
                                />
                                <p className="text-muted-foreground text-xs">
                                    Higher priority rooms are assigned first
                                </p>
                                <InputError message={form.errors.priority} />
                            </div>
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Equipment & Facilities</h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {equipmentOptions.map((item) => (
                                <div key={item} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`equipment-${item}`}
                                        checked={form.data.equipment.includes(item)}
                                        onCheckedChange={() => toggleEquipment(item)}
                                    />
                                    <Label
                                        htmlFor={`equipment-${item}`}
                                        className="cursor-pointer text-sm font-normal"
                                    >
                                        {item}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scheduling Settings */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Scheduling Settings</h4>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allow_consecutive"
                                checked={form.data.class_settings.allow_consecutive}
                                onCheckedChange={(checked) =>
                                    form.setData('class_settings', {
                                        ...form.data.class_settings,
                                        allow_consecutive: checked as boolean,
                                    })
                                }
                            />
                            <Label
                                htmlFor="allow_consecutive"
                                className="cursor-pointer text-sm font-normal"
                            >
                                Allow consecutive class sessions in this room
                            </Label>
                        </div>

                        <div className="max-w-xs space-y-2">
                            <Label htmlFor="max_daily_hours">
                                Maximum Daily Usage (hours)
                            </Label>
                            <Input
                                id="max_daily_hours"
                                type="number"
                                min={1}
                                max={12}
                                value={form.data.class_settings.max_daily_hours || 8}
                                onChange={(e) =>
                                    form.setData('class_settings', {
                                        ...form.data.class_settings,
                                        max_daily_hours: parseInt(e.target.value) || 8,
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog({ open, room: open ? deleteDialog.room : null })
                }
                title="Delete Room"
                description={
                    <>
                        Are you sure you want to delete{' '}
                        <strong>
                            {deleteDialog.room?.name}
                            {deleteDialog.room?.building?.name &&
                                ` - ${deleteDialog.room.building.name}`}
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
