import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Edit, MoreHorizontal, Plus, Power, Trash2 } from 'lucide-react';
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
import { type BreadcrumbItem, type Department, type PaginatedData } from '@/types';

interface Props {
    departments: PaginatedData<Department>;
    filters: {
        search?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academics', href: '#' },
    { title: 'Departments', href: '/departments' },
];

type ModalMode = 'create' | 'edit' | null;

export default function DepartmentsIndex({ departments, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        department: Department | null;
    }>({ open: false, department: null });

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
        setSelectedDepartment(null);
        setModalMode('create');
    };

    const openEditModal = (department: Department) => {
        form.setData({
            code: department.code,
            name: department.name,
            description: department.description || '',
            is_active: department.is_active,
        });
        form.clearErrors();
        setSelectedDepartment(department);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedDepartment(null);
        form.reset();
    };

    const handleSubmit = () => {
        if (modalMode === 'create') {
            form.post('/departments', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else if (modalMode === 'edit' && selectedDepartment) {
            form.patch(`/departments/${selectedDepartment.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleSearch = () => {
        router.get(
            '/departments',
            { ...filters, search: searchValue },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (value === 'all') {
            delete newFilters[key as keyof typeof newFilters];
        }
        router.get('/departments', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToggleStatus = (department: Department) => {
        router.patch(
            `/departments/${department.id}/toggle-status`,
            {},
            { preserveScroll: true }
        );
    };

    const handleDelete = () => {
        if (deleteDialog.department) {
            router.delete(`/departments/${deleteDialog.department.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteDialog({ open: false, department: null }),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Department Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Department Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage academic departments and colleges
                        </p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2">
                        <Input
                            placeholder="Search by code or name..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="max-w-sm"
                        />
                        <Button variant="secondary" onClick={handleSearch}>
                            Search
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) => handleFilterChange('status', value)}
                        >
                            <SelectTrigger className="w-[140px]">
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
                                    Code
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Department Name
                                </TableHead>
                                <TableHead className="px-4 py-3 text-center text-sm font-medium">
                                    Courses
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Status
                                </TableHead>
                                <TableHead className="px-4 py-3 text-right text-sm font-medium">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                                <Building2 className="text-muted-foreground h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    No departments found
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    Add your first department to get started
                                                </p>
                                            </div>
                                            <Button size="sm" onClick={openCreateModal}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Department
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                departments.data.map((department) => (
                                    <TableRow
                                        key={department.id}
                                        className="hover:bg-muted/30 border-b transition-colors last:border-0"
                                    >
                                        <TableCell className="px-4 py-3">
                                            <span className="font-mono font-medium">
                                                {department.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{department.name}</p>
                                                {department.description && (
                                                    <p className="text-muted-foreground line-clamp-1 text-xs">
                                                        {department.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <Badge variant="outline">
                                                {department.courses_count || 0} courses
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <StatusBadge status={department.is_active} />
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => openEditModal(department)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(department)}
                                                    >
                                                        <Power className="mr-2 h-4 w-4" />
                                                        {department.is_active ? 'Deactivate' : 'Activate'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() =>
                                                            setDeleteDialog({
                                                                open: true,
                                                                department,
                                                            })
                                                        }
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

                {/* Pagination */}
                {departments.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Showing {departments.from} to {departments.to} of {departments.total}{' '}
                            departments
                        </p>
                        <div className="flex items-center gap-2">
                            {departments.links.map((link, index) => (
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
                title={modalMode === 'create' ? 'Create New Department' : 'Edit Department'}
                description={
                    modalMode === 'create'
                        ? 'Add a new academic department or college'
                        : `Update information for ${selectedDepartment?.name}`
                }
                onSubmit={handleSubmit}
                submitLabel={modalMode === 'create' ? 'Create Department' : 'Save Changes'}
                isSubmitting={form.processing}
            >
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Department Code <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="code"
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                placeholder="CCS"
                                className="font-mono"
                            />
                            <InputError message={form.errors.code} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Department Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="College of Computer Studies"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder="Brief description of the department..."
                            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <InputError message={form.errors.description} />
                    </div>

                    {modalMode === 'edit' && (
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
                                Active (department can have active courses)
                            </Label>
                        </div>
                    )}
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog({
                        open,
                        department: open ? deleteDialog.department : null,
                    })
                }
                title="Delete Department"
                description={
                    <>
                        Are you sure you want to delete{' '}
                        <strong>{deleteDialog.department?.name}</strong>? This action cannot be
                        undone.
                    </>
                }
                onConfirm={handleDelete}
                confirmLabel="Delete"
                variant="destructive"
            />
        </AppLayout>
    );
}

