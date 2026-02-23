import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, DoorOpen, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/form-modal';
import { RoomTypeBadge, StatusBadge } from '@/components/ui/status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Room, type User } from '@/types';

interface Building {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    rooms: Room[];
    created_at: string;
    updated_at: string;
}

interface Props {
    building: Building;
}

export default function BuildingShow({ building }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const isScheduler = auth.user.user_type === 'scheduler';
    const [unassignDialog, setUnassignDialog] = useState<{
        open: boolean;
        room: Room | null;
    }>({ open: false, room: null });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Buildings', href: '/buildings' },
        { title: building.code, href: `/buildings/${building.id}` },
    ];

    const handleUnassignRoom = () => {
        if (unassignDialog.room) {
            router.delete(`/buildings/${building.id}/rooms/${unassignDialog.room.id}`, {
                preserveScroll: true,
                onSuccess: () => setUnassignDialog({ open: false, room: null }),
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
            <Head title={`${building.name} - Building Details`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.get('/buildings')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {building.name}
                                </h1>
                                <p className="text-muted-foreground">
                                    {building.code} • {building.rooms.length} rooms
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={building.is_active} />
                    </div>
                </div>

                {/* Description */}
                {building.description && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">{building.description}</p>
                    </div>
                )}

                {/* Rooms Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Rooms in this Building</h2>
                    </div>

                    {building.rooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
                            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                <DoorOpen className="text-muted-foreground h-6 w-6" />
                            </div>
                            <h3 className="mt-4 font-semibold">No rooms assigned</h3>
                            <p className="text-muted-foreground text-center text-sm">
                                Assign rooms to this building from the Rooms page
                            </p>
                            <Button
                                className="mt-4"
                                variant="outline"
                                onClick={() => router.get('/rooms')}
                            >
                                <DoorOpen className="mr-2 h-4 w-4" />
                                Go to Room Management
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-b hover:bg-muted/50">
                                            <TableHead className="px-4 py-3 text-left text-sm font-medium h-auto text-foreground">
                                                Room
                                            </TableHead>
                                            <TableHead className="px-4 py-3 text-left text-sm font-medium h-auto text-foreground">
                                                Type
                                            </TableHead>
                                            <TableHead className="px-4 py-3 text-center text-sm font-medium h-auto text-foreground">
                                                Capacity
                                            </TableHead>
                                            <TableHead className="px-4 py-3 text-left text-sm font-medium h-auto text-foreground">
                                                Priority
                                            </TableHead>
                                            <TableHead className="px-4 py-3 text-left text-sm font-medium h-auto text-foreground">
                                                Status
                                            </TableHead>
                                            {!isScheduler && (
                                                <TableHead className="px-4 py-3 text-right text-sm font-medium h-auto text-foreground">
                                                    Actions
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {building.rooms.map((room) => (
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
                                                <TableCell className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <StatusBadge status={room.is_active} />
                                                        {room.is_active && (
                                                            <StatusBadge
                                                                status={room.is_available}
                                                                activeLabel="Available"
                                                                inactiveLabel="Unavailable"
                                                            />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                {!isScheduler && (
                                                    <TableCell className="px-4 py-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                setUnassignDialog({
                                                                    open: true,
                                                                    room,
                                                                })
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Unassign Confirmation Modal */}
            <ConfirmModal
                open={unassignDialog.open}
                onOpenChange={(open) =>
                    setUnassignDialog({ open, room: open ? unassignDialog.room : null })
                }
                title="Remove Room from Building"
                description={
                    <>
                        Are you sure you want to remove{' '}
                        <strong>{unassignDialog.room?.name}</strong> from{' '}
                        <strong>{building.name}</strong>? The room will still exist but won't
                        be associated with this building.
                    </>
                }
                onConfirm={handleUnassignRoom}
                confirmLabel="Remove"
                variant="destructive"
            />
        </AppLayout>
    );
}

