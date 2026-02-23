import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Edit, MoreHorizontal, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { StatusBadge, UserTypeBadge } from '@/components/ui/status-badge';
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
    type Department,
    type PaginatedData,
    type User,
} from '@/types';

interface Props {
    users: PaginatedData<User>;
    departments: Department[];
    filters: {
        search?: string;
        user_type?: string;
        status?: string;
        approval_status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Management', href: '#' },
    { title: 'Users', href: '/users' },
];

type ModalMode = 'create' | 'edit' | null;

export default function UsersIndex({ users, departments, filters }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        user: User | null;
    }>({ open: false, user: null });

    const [rejectDialog, setRejectDialog] = useState<{
        open: boolean;
        user: User | null;
    }>({ open: false, user: null });
    const [rejectReason, setRejectReason] = useState('');

    // Form for create/edit
    const form = useForm({
        fname: '',
        mname: '',
        lname: '',
        email: '',
        password: '',
        password_confirmation: '',
        user_type: 'faculty',
        department_id: '',
    });

    const openCreateModal = () => {
        form.reset();
        form.clearErrors();
        setSelectedUser(null);
        setModalMode('create');
    };

    const openEditModal = (user: User) => {
        form.setData({
            fname: user.fname,
            mname: user.mname || '',
            lname: user.lname,
            email: user.email,
            password: '',
            password_confirmation: '',
            user_type: user.user_type,
            department_id: user.department_id?.toString() || '',
        });
        form.clearErrors();
        setSelectedUser(user);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedUser(null);
        form.reset();
    };

    const handleSubmit = () => {
        if (modalMode === 'create') {
            form.post('/users', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else if (modalMode === 'edit' && selectedUser) {
            form.patch(`/users/${selectedUser.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleSearch = () => {
        router.get(
            '/users',
            { ...filters, search: searchValue },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (value === 'all') {
            delete newFilters[key as keyof typeof newFilters];
        }
        router.get('/users', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToggleStatus = (user: User) => {
        router.patch(
            `/users/${user.id}/toggle-status`,
            {},
            { preserveScroll: true }
        );
    };

    const handleDelete = () => {
        if (deleteDialog.user) {
            router.delete(`/users/${deleteDialog.user.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteDialog({ open: false, user: null }),
            });
        }
    };

    const handleApprove = (user: User) => {
        router.post(`/users/${user.id}/approve`, {}, { preserveScroll: true });
    };

    const handleReject = () => {
        if (rejectDialog.user && rejectReason) {
            router.post(`/users/${rejectDialog.user.id}/reject`, {
                reason: rejectReason,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectDialog({ open: false, user: null });
                    setRejectReason('');
                },
            });
        }
    };

    const getApprovalBadge = (status: string | null | undefined) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Pending</span>;
            case 'approved':
                return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Rejected</span>;
            default:
                return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">N/A</span>;
        }
    };

    const getUserDisplayName = (user: User) => {
        const middleInitial = user.mname
            ? ` ${user.mname.charAt(0).toUpperCase()}.`
            : '';
        return `${user.fname}${middleInitial} ${user.lname}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            User Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage system users and their access permissions
                        </p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2">
                        <Input
                            placeholder="Search by name or email..."
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
                            value={filters.user_type || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('user_type', value)
                            }
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="User Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="scheduler">Scheduler</SelectItem>
                                <SelectItem value="faculty">Faculty</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('status', value)
                            }
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

                        <Select
                            value={filters.approval_status || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('approval_status', value)
                            }
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Approval" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Approvals</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
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
                                    Name
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Email
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Role
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Department
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Approval
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
                            {users.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-muted-foreground px-4 py-8 text-center"
                                    >
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.data.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        className="hover:bg-muted/30 border-b transition-colors last:border-0"
                                    >
                                        <TableCell className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
                                                    <span className="text-primary text-sm font-medium">
                                                        {user.fname.charAt(0)}
                                                        {user.lname.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {getUserDisplayName(user)}
                                                    </p>
                                                    {user.id === auth.user.id && (
                                                        <span className="text-muted-foreground text-xs">
                                                            (You)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                            {user.email}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <UserTypeBadge type={user.user_type} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                                            {user.department?.code || '-'}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            {getApprovalBadge(user.approval_status)}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <StatusBadge status={user.is_active} />
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
                                                        onClick={() => openEditModal(user)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {user.id !== auth.user.id && (
                                                        <>
                                                            {/* Approval Actions for Pending Users */}
                                                            {user.approval_status === 'pending' && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleApprove(user)}
                                                                        className="text-green-600 focus:text-green-600"
                                                                    >
                                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                                        Approve
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            setRejectDialog({
                                                                                open: true,
                                                                                user,
                                                                            })
                                                                        }
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        <UserX className="mr-2 h-4 w-4" />
                                                                        Reject
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleToggleStatus(user)
                                                                }
                                                            >
                                                                {user.is_active ? (
                                                                    <>
                                                                        <UserX className="mr-2 h-4 w-4" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() =>
                                                                    setDeleteDialog({
                                                                        open: true,
                                                                        user,
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
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Showing {users.from} to {users.to} of {users.total} users
                        </p>
                        <div className="flex items-center gap-2">
                            {users.links.map((link, index) => (
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
                title={modalMode === 'create' ? 'Create New User' : 'Edit User'}
                description={
                    modalMode === 'create'
                        ? 'Add a new user to the system'
                        : `Update information for ${selectedUser ? getUserDisplayName(selectedUser) : ''}`
                }
                onSubmit={handleSubmit}
                submitLabel={modalMode === 'create' ? 'Create User' : 'Save Changes'}
                isSubmitting={form.processing}
                size="xl"
            >
                <div className="space-y-4">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Personal Information</h4>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="fname">
                                    First Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="fname"
                                    value={form.data.fname}
                                    onChange={(e) => form.setData('fname', e.target.value)}
                                    placeholder="Juan"
                                />
                                <InputError message={form.errors.fname} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mname">Middle Name</Label>
                                <Input
                                    id="mname"
                                    value={form.data.mname}
                                    onChange={(e) => form.setData('mname', e.target.value)}
                                    placeholder="Dela"
                                />
                                <InputError message={form.errors.mname} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lname">
                                    Last Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="lname"
                                    value={form.data.lname}
                                    onChange={(e) => form.setData('lname', e.target.value)}
                                    placeholder="Cruz"
                                />
                                <InputError message={form.errors.lname} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                placeholder="juan.delacruz@mu.edu.ph"
                            />
                            <InputError message={form.errors.email} />
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div className="space-y-4 pt-4">
                        <h4 className="text-sm font-medium">Account Settings</h4>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="user_type">
                                    User Role <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.data.user_type}
                                    onValueChange={(value) => form.setData('user_type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="faculty">Faculty</SelectItem>
                                        <SelectItem value="scheduler">Scheduler</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.user_type} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department_id">
                                    Department
                                </Label>
                                <Select
                                    value={form.data.department_id}
                                    onValueChange={(value) => form.setData('department_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name} ({dept.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.department_id} />
                            </div>
                        </div>

                        {modalMode === 'edit' && (
                            <p className="text-muted-foreground text-xs">
                                Leave password fields empty to keep the current password
                            </p>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {modalMode === 'create' ? (
                                        <>
                                            Password <span className="text-destructive">*</span>
                                        </>
                                    ) : (
                                        'New Password'
                                    )}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                                <InputError message={form.errors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">
                                    {modalMode === 'create' ? (
                                        <>
                                            Confirm Password{' '}
                                            <span className="text-destructive">*</span>
                                        </>
                                    ) : (
                                        'Confirm New Password'
                                    )}
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={(e) =>
                                        form.setData('password_confirmation', e.target.value)
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog({ open, user: open ? deleteDialog.user : null })
                }
                title="Delete User"
                description={
                    <>
                        Are you sure you want to delete{' '}
                        <strong>
                            {deleteDialog.user && getUserDisplayName(deleteDialog.user)}
                        </strong>
                        ? This action cannot be undone.
                    </>
                }
                onConfirm={handleDelete}
                confirmLabel="Delete"
                variant="destructive"
            />

            {/* Reject User Modal */}
            <FormModal
                open={rejectDialog.open}
                onOpenChange={(open) => {
                    setRejectDialog({ open, user: open ? rejectDialog.user : null });
                    if (!open) setRejectReason('');
                }}
                title="Reject User Registration"
                description={
                    rejectDialog.user
                        ? `Reject the registration request from ${getUserDisplayName(rejectDialog.user)}? Please provide a reason.`
                        : 'Reject registration request'
                }
                onSubmit={handleReject}
                submitLabel="Reject"
                isSubmitting={false}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reject-reason">
                            Reason for Rejection <span className="text-destructive">*</span>
                        </Label>
                        <textarea
                            id="reject-reason"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter the reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                </div>
            </FormModal>
        </AppLayout>
    );
}

