import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Building2, DoorOpen, Edit, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';

interface Building {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    rooms_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    buildings: Building[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Facilities', href: '#' },
    { title: 'Buildings', href: '/buildings' },
];

type ModalMode = 'create' | 'edit' | null;

export default function BuildingsIndex({ buildings }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const isScheduler = auth.user.user_type === 'scheduler';
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        building: Building | null;
    }>({ open: false, building: null });

    const form = useForm<{
        code: string;
        name: string;
        description: string;
        is_active: boolean;
    }>({
        code: '',
        name: '',
        description: '',
        is_active: true,
    });

    const openCreateModal = () => {
        form.reset();
        form.setData({
            code: '',
            name: '',
            description: '',
            is_active: true,
        });
        form.clearErrors();
        setSelectedBuilding(null);
        setModalMode('create');
    };

    const openEditModal = (building: Building) => {
        form.setData({
            code: building.code,
            name: building.name,
            description: building.description || '',
            is_active: building.is_active,
        });
        form.clearErrors();
        setSelectedBuilding(building);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedBuilding(null);
        form.reset();
    };

    const handleSubmit = () => {
        if (modalMode === 'create') {
            form.post('/buildings', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else if (modalMode === 'edit' && selectedBuilding) {
            form.patch(`/buildings/${selectedBuilding.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (deleteDialog.building) {
            router.delete(`/buildings/${deleteDialog.building.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteDialog({ open: false, building: null }),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Building Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Building Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage buildings and their rooms
                        </p>
                    </div>
                    {!isScheduler && (
                        <Button onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Building
                        </Button>
                    )}
                </div>

                {/* Building Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {buildings.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
                            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                <Building2 className="text-muted-foreground h-6 w-6" />
                            </div>
                            <h3 className="mt-4 font-semibold">No buildings yet</h3>
                            <p className="text-muted-foreground text-center text-sm">
                                Add your first building to organize rooms
                            </p>
                            {!isScheduler && (
                                <Button className="mt-4" onClick={openCreateModal}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Building
                                </Button>
                            )}
                        </div>
                    ) : (
                        buildings.map((building) => (
                            <div
                                key={building.id}
                                className="group relative flex flex-col rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{building.code}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {building.name}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {!isScheduler && (
                                                <DropdownMenuItem onClick={() => openEditModal(building)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    router.get(`/buildings/${building.id}`)
                                                }
                                            >
                                                <DoorOpen className="mr-2 h-4 w-4" />
                                                {isScheduler ? 'View Rooms' : 'Manage Rooms'}
                                            </DropdownMenuItem>
                                            {!isScheduler && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() =>
                                                            setDeleteDialog({
                                                                open: true,
                                                                building,
                                                            })
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Description */}
                                {building.description && (
                                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                                        {building.description}
                                    </p>
                                )}

                                {/* Footer */}
                                <div className="mt-4 flex items-center justify-between border-t pt-4">
                                    <div className="flex items-center gap-2">
                                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {building.rooms_count} rooms
                                        </span>
                                    </div>
                                    <StatusBadge status={building.is_active} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <FormModal
                open={modalMode !== null}
                onOpenChange={(open) => !open && closeModal()}
                title={modalMode === 'create' ? 'Add New Building' : 'Edit Building'}
                description={
                    modalMode === 'create'
                        ? 'Create a new building to organize rooms'
                        : `Update information for ${selectedBuilding?.name}`
                }
                onSubmit={handleSubmit}
                submitLabel={modalMode === 'create' ? 'Create Building' : 'Save Changes'}
                isSubmitting={form.processing}
            >
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Building Code <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="code"
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                placeholder="HTF"
                                maxLength={20}
                            />
                            <p className="text-xs text-muted-foreground">
                                Short code for the building (e.g., HTF, LIB, MAIN)
                            </p>
                            <InputError message={form.errors.code} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Building Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="HTF Building"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => form.setData('description', e.target.value)}
                            placeholder="High Technology Facility - Main CCS Building"
                            rows={3}
                        />
                        <InputError message={form.errors.description} />
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog({ open, building: open ? deleteDialog.building : null })
                }
                title="Delete Building"
                description={
                    deleteDialog.building?.rooms_count && deleteDialog.building.rooms_count > 0 ? (
                        <>
                            Cannot delete <strong>{deleteDialog.building?.name}</strong> because it
                            has {deleteDialog.building?.rooms_count} rooms assigned. Please reassign
                            or delete the rooms first.
                        </>
                    ) : (
                        <>
                            Are you sure you want to delete{' '}
                            <strong>{deleteDialog.building?.name}</strong>? This action cannot be
                            undone.
                        </>
                    )
                }
                onConfirm={handleDelete}
                confirmLabel="Delete"
                variant="destructive"
            />
        </AppLayout>
    );
}

