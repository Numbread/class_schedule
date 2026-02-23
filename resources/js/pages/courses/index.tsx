import { Head, router, useForm } from '@inertiajs/react';
import {
    Edit,
    GraduationCap,
    MoreHorizontal,
    Plus,
    Power,
    Trash2,
    X,
} from 'lucide-react';
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
    type Course,
    type Department,
    type PaginatedData,
} from '@/types';

interface Props {
    courses: PaginatedData<Course>;
    departments: Department[];
    filters: {
        search?: string;
        department_id?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academics', href: '#' },
    { title: 'Courses', href: '/courses' },
];

type ModalMode = 'create' | 'edit' | null;

interface MajorEntry {
    id?: number;
    code: string;
    name: string;
    description: string;
    is_active: boolean;
}

export default function CoursesIndex({ courses, departments, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        course: Course | null;
    }>({ open: false, course: null });

    const form = useForm<{
        department_id: string;
        code: string;
        name: string;
        description: string;
        years: number;
        is_active: boolean;
        majors: MajorEntry[];
    }>({
        department_id: '',
        code: '',
        name: '',
        description: '',
        years: 4,
        is_active: true,
        majors: [],
    });

    const [newMajorCode, setNewMajorCode] = useState('');
    const [newMajorName, setNewMajorName] = useState('');

    const openCreateModal = () => {
        form.reset();
        form.setData({
            department_id: departments[0]?.id?.toString() || '',
            code: '',
            name: '',
            description: '',
            years: 4,
            is_active: true,
            majors: [],
        });
        form.clearErrors();
        setSelectedCourse(null);
        setModalMode('create');
    };

    const openEditModal = (course: Course) => {
        const majors: MajorEntry[] =
            course.majors?.map((m) => ({
                id: m.id,
                code: m.code || '',
                name: m.name,
                description: m.description || '',
                is_active: m.is_active,
            })) || [];

        form.setData({
            department_id: course.department_id.toString(),
            code: course.code,
            name: course.name,
            description: course.description || '',
            years: course.years,
            is_active: course.is_active,
            majors,
        });
        form.clearErrors();
        setSelectedCourse(course);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedCourse(null);
        form.reset();
        setNewMajorCode('');
        setNewMajorName('');
    };

    const handleSubmit = () => {
        if (modalMode === 'create') {
            form.post('/courses', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else if (modalMode === 'edit' && selectedCourse) {
            form.patch(`/courses/${selectedCourse.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const addMajor = () => {
        if (!newMajorName.trim()) return;

        form.setData('majors', [
            ...form.data.majors,
            {
                code: newMajorCode.toUpperCase(),
                name: newMajorName,
                description: '',
                is_active: true,
            },
        ]);
        setNewMajorCode('');
        setNewMajorName('');
    };

    const removeMajor = (index: number) => {
        form.setData(
            'majors',
            form.data.majors.filter((_, i) => i !== index)
        );
    };

    const handleSearch = () => {
        router.get(
            '/courses',
            { ...filters, search: searchValue },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (value === 'all') {
            delete newFilters[key as keyof typeof newFilters];
        }
        router.get('/courses', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToggleStatus = (course: Course) => {
        router.patch(
            `/courses/${course.id}/toggle-status`,
            {},
            { preserveScroll: true }
        );
    };

    const handleDelete = () => {
        if (deleteDialog.course) {
            router.delete(`/courses/${deleteDialog.course.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteDialog({ open: false, course: null }),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Course Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Course Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage academic programs and their specializations
                        </p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Course
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
                            value={filters.department_id || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('department_id', value)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                        {dept.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

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
                                    Course Name
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Department
                                </TableHead>
                                <TableHead className="px-4 py-3 text-center text-sm font-medium">
                                    Years
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Majors
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
                            {courses.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                                <GraduationCap className="text-muted-foreground h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium">No courses found</p>
                                                <p className="text-muted-foreground text-sm">
                                                    Add your first course to get started
                                                </p>
                                            </div>
                                            <Button size="sm" onClick={openCreateModal}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Course
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                courses.data.map((course) => (
                                    <TableRow
                                        key={course.id}
                                        className="hover:bg-muted/30 border-b transition-colors last:border-0"
                                    >
                                        <TableCell className="px-4 py-3">
                                            <span className="font-mono font-medium">
                                                {course.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{course.name}</p>
                                                {course.description && (
                                                    <p className="text-muted-foreground line-clamp-1 text-xs">
                                                        {course.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant="outline">
                                                {course.department?.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <span className="font-medium">{course.years}</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            {course.majors && course.majors.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {course.majors.slice(0, 2).map((major) => (
                                                        <Badge
                                                            key={major.id}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {major.code || major.name}
                                                        </Badge>
                                                    ))}
                                                    {course.majors.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{course.majors.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
                                                    No majors
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <StatusBadge status={course.is_active} />
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
                                                        onClick={() => openEditModal(course)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(course)}
                                                    >
                                                        <Power className="mr-2 h-4 w-4" />
                                                        {course.is_active ? 'Deactivate' : 'Activate'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() =>
                                                            setDeleteDialog({
                                                                open: true,
                                                                course,
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
                {courses.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Showing {courses.from} to {courses.to} of {courses.total} courses
                        </p>
                        <div className="flex items-center gap-2">
                            {courses.links.map((link, index) => (
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
                title={modalMode === 'create' ? 'Create New Course' : 'Edit Course'}
                description={
                    modalMode === 'create'
                        ? 'Add a new academic program'
                        : `Update information for ${selectedCourse?.code} - ${selectedCourse?.name}`
                }
                onSubmit={handleSubmit}
                submitLabel={modalMode === 'create' ? 'Create Course' : 'Save Changes'}
                isSubmitting={form.processing}
                size="xl"
            >
                <div className="space-y-6">
                    {/* Course Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Course Information</h4>

                        <div className="space-y-2">
                            <Label htmlFor="department_id">
                                Department <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={form.data.department_id}
                                onValueChange={(value) => form.setData('department_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                            {dept.code} - {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.department_id} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Course Code <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={form.data.code}
                                    onChange={(e) =>
                                        form.setData('code', e.target.value.toUpperCase())
                                    }
                                    placeholder="BSCS"
                                    className="font-mono"
                                />
                                <InputError message={form.errors.code} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="years">
                                    Program Duration (Years){' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="years"
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={form.data.years}
                                    onChange={(e) =>
                                        form.setData('years', parseInt(e.target.value) || 4)
                                    }
                                />
                                <InputError message={form.errors.years} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Course Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="Bachelor of Science in Computer Science"
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder="Brief description of the course..."
                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                                    Active (course can have active subjects)
                                </Label>
                            </div>
                        )}
                    </div>

                    {/* Majors/Specializations */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">
                            Majors / Specializations (Optional)
                        </h4>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-2">
                                <Label>Code</Label>
                                <Input
                                    value={newMajorCode}
                                    onChange={(e) =>
                                        setNewMajorCode(e.target.value.toUpperCase())
                                    }
                                    placeholder="SE"
                                    className="w-[80px] font-mono"
                                />
                            </div>

                            <div className="flex-1 space-y-2">
                                <Label>Major Name</Label>
                                <Input
                                    value={newMajorName}
                                    onChange={(e) => setNewMajorName(e.target.value)}
                                    placeholder="Software Engineering"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={addMajor}
                                disabled={!newMajorName.trim()}
                            >
                                <Plus className="mr-1 h-4 w-4" />
                                Add
                            </Button>
                        </div>

                        {form.data.majors.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {form.data.majors.map((major, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="gap-1 py-1 pr-1"
                                    >
                                        {major.code ? `${major.code} - ` : ''}
                                        {major.name}
                                        <button
                                            type="button"
                                            onClick={() => removeMajor(index)}
                                            className="hover:bg-muted ml-1 rounded p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog({
                        open,
                        course: open ? deleteDialog.course : null,
                    })
                }
                title="Delete Course"
                description={
                    <>
                        Are you sure you want to delete{' '}
                        <strong>
                            {deleteDialog.course?.code} - {deleteDialog.course?.name}
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

