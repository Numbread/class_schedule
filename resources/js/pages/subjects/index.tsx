import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, BookOpen, Building, CheckCircle2, ChevronDown, ChevronRight, Download, Edit, FileSpreadsheet, MoreHorizontal, Plus, Power, Search, Trash2, Upload, X } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { toast } from 'sonner';

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
    type Subject,
} from '@/types';

interface Props {
    subjects: PaginatedData<Subject>;
    departments: Department[];
    courses: Course[];
    allSubjects: Subject[];
    filters: {
        search?: string | string[];
        department_id?: string;
        course_id?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academics', href: '#' },
    { title: 'Subjects', href: '/subjects' },
];

type ModalMode = 'create' | 'edit' | null;

export default function SubjectsIndex({ subjects, departments, courses, allSubjects, filters }: Props) {
    // Parse search filters - can be string or array
    const parseSearchTerms = (search: string | string[] | undefined): string[] => {
        if (!search) return [];
        if (Array.isArray(search)) return search;
        return [search];
    };

    const [searchTerms, setSearchTerms] = useState<string[]>(parseSearchTerms(filters.search));
    const [searchInput, setSearchInput] = useState('');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        subject: Subject | null;
    }>({ open: false, subject: null });

    // Import modal state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importValidation, setImportValidation] = useState<{
        loading: boolean;
        validated: boolean;
        summary?: { total: number; valid: number; invalid: number };
        validRows?: Array<{ row: number; code: string; name: string; units: number; courses: string; warning?: string }>;
        invalidRows?: Array<{ row: number; code: string; name: string; errors: string[] }>;
        error?: string;
    }>({ loading: false, validated: false });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track which departments are expanded in the course selection
    const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());

    const toggleDeptExpanded = (deptId: number) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(deptId)) {
                next.delete(deptId);
            } else {
                next.add(deptId);
            }
            return next;
        });
    };

    // Track which departments are expanded in the prerequisite selection
    const [expandedPrereqDepts, setExpandedPrereqDepts] = useState<Set<number>>(new Set());

    const togglePrereqDeptExpanded = (deptId: number) => {
        setExpandedPrereqDepts(prev => {
            const next = new Set(prev);
            if (next.has(deptId)) {
                next.delete(deptId);
            } else {
                next.add(deptId);
            }
            return next;
        });
    };

    // Prerequisite search state
    const [prereqSearchInput, setPrereqSearchInput] = useState('');
    const [prereqSearchTags, setPrereqSearchTags] = useState<string[]>([]);

    // Derived state for filtered subjects
    const filteredAllSubjects = useMemo(() => {
        if (prereqSearchTags.length === 0 && !prereqSearchInput.trim()) {
            return allSubjects;
        }

        const terms = [...prereqSearchTags];
        if (prereqSearchInput.trim()) {
            terms.push(prereqSearchInput.trim());
        }

        const lowerTerms = terms.map(t => t.toLowerCase());

        return allSubjects.filter(subject => {
            const code = subject.code.toLowerCase();
            const name = subject.name.toLowerCase();
            return lowerTerms.some(term => code.includes(term) || name.includes(term));
        });
    }, [allSubjects, prereqSearchTags, prereqSearchInput]);

    // Subject categories for room assignment rules


    const form = useForm<{
        course_ids: number[];
        major_id: string;
        code: string;
        name: string;
        description: string;
        units: number;
        lecture_hours: number;
        lab_hours: number;
        category: string;
        is_active: boolean;
        prerequisite_ids: number[];
    }>({
        course_ids: [],
        major_id: '',
        code: '',
        name: '',
        description: '',
        units: 3,
        lecture_hours: 3,
        lab_hours: 0,
        category: '',
        is_active: true,
        prerequisite_ids: [],
    });

    // Toggle course selection
    const toggleCourse = (courseId: number) => {
        const currentIds = form.data.course_ids;
        if (currentIds.includes(courseId)) {
            form.setData('course_ids', currentIds.filter((id) => id !== courseId));
        } else {
            form.setData('course_ids', [...currentIds, courseId]);
        }
    };

    // Compute available majors based on selected courses (derived state)
    // Only show majors if exactly one course is selected
    // Use JSON.stringify to create a stable dependency since form.data.course_ids reference changes
    const courseIdsKey = JSON.stringify(form.data.course_ids);
    const availableMajors = useMemo(() => {
        const courseIds = JSON.parse(courseIdsKey) as number[];
        if (courseIds.length === 1) {
            const course = courses.find((c) => c.id === courseIds[0]);
            return course?.majors || [];
        }
        return [];
    }, [courseIdsKey, courses]);

    const openCreateModal = () => {
        form.reset();
        form.setData({
            course_ids: [],
            major_id: '',
            code: '',
            name: '',
            description: '',
            units: 3,
            lecture_hours: 3,
            lab_hours: 0,
            category: '',
            is_active: true,
            prerequisite_ids: [],
        });
        form.clearErrors();
        setSelectedSubject(null);
        setModalMode('create');
    };

    const openEditModal = (subject: Subject) => {
        // Extract prerequisite IDs from the subject
        const prerequisiteIds = subject.prerequisites?.map((p) => p.id) || [];

        // Get course IDs from the many-to-many relationship, fallback to legacy course_id
        const courseIds = subject.courses?.map((c) => c.id) ||
            (subject.course_id ? [subject.course_id] : []);

        form.setData({
            course_ids: courseIds,
            major_id: subject.major_id?.toString() || '',
            code: subject.code,
            name: subject.name,
            description: subject.description || '',
            units: subject.units,
            lecture_hours: subject.lecture_hours,
            lab_hours: subject.lab_hours,
            category: subject.category || '',
            is_active: subject.is_active,
            prerequisite_ids: prerequisiteIds,
        });
        form.clearErrors();
        setSelectedSubject(subject);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedSubject(null);
        form.reset();
    };

    const handleSubmit = () => {
        if (modalMode === 'create') {
            form.post('/subjects', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else if (modalMode === 'edit' && selectedSubject) {
            form.patch(`/subjects/${selectedSubject.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const addSearchTerm = () => {
        const term = searchInput.trim();
        if (term && !searchTerms.includes(term)) {
            const newTerms = [...searchTerms, term];
            setSearchTerms(newTerms);
            setSearchInput('');
            applySearch(newTerms);
        }
    };

    const removeSearchTerm = (termToRemove: string) => {
        const newTerms = searchTerms.filter((term) => term !== termToRemove);
        setSearchTerms(newTerms);
        applySearch(newTerms);
    };

    const clearAllSearchTerms = () => {
        setSearchTerms([]);
        setSearchInput('');
        applySearch([]);
    };

    const applySearch = (terms: string[]) => {
        const newFilters = { ...filters };
        if (terms.length > 0) {
            newFilters.search = terms;
        } else {
            delete newFilters.search;
        }
        router.get('/subjects', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSearchTerm();
        } else if (e.key === 'Backspace' && searchInput === '' && searchTerms.length > 0) {
            // Remove last term when backspace is pressed on empty input
            removeSearchTerm(searchTerms[searchTerms.length - 1]);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (value === 'all') {
            delete newFilters[key as keyof typeof newFilters];
        }
        router.get('/subjects', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToggleStatus = (subject: Subject) => {
        router.patch(
            `/subjects/${subject.id}/toggle-status`,
            {},
            { preserveScroll: true }
        );
    };

    const handleDelete = () => {
        if (deleteDialog.subject) {
            router.delete(`/subjects/${deleteDialog.subject.id}`, {
                preserveScroll: true,
                onSuccess: () => setDeleteDialog({ open: false, subject: null }),
            });
        }
    };

    // Handle file selection for import
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
            setImportValidation({ loading: false, validated: false });
        }
    };

    // Validate import file
    const validateImportFile = async () => {
        if (!importFile) return;

        setImportValidation({ loading: true, validated: false });

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const response = await axios.post('/subjects/validate-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setImportValidation({
                    loading: false,
                    validated: true,
                    summary: response.data.summary,
                    validRows: response.data.validRows,
                    invalidRows: response.data.invalidRows,
                });
            } else {
                setImportValidation({
                    loading: false,
                    validated: false,
                    error: response.data.message || 'Validation failed',
                });
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            setImportValidation({
                loading: false,
                validated: false,
                error: axiosError.response?.data?.message || 'Failed to validate file',
            });
        }
    };

    // Submit import
    const handleImportSubmit = () => {
        if (!importFile) return;

        const formData = new FormData();
        formData.append('file', importFile);

        router.post('/subjects/import', formData, {
            onSuccess: () => {
                setImportModalOpen(false);
                setImportFile(null);
                setImportValidation({ loading: false, validated: false });
            },
            onError: (errors) => {
                Object.values(errors).forEach((msg) => toast.error(String(msg)));
            },
        });
    };

    // Reset import modal
    const resetImportModal = () => {
        setImportFile(null);
        setImportValidation({ loading: false, validated: false });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subject Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Subject Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage subjects and course curriculum
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Import/Export Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Import / Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                    const params = new URLSearchParams();
                                    if (filters.department_id && filters.department_id !== 'all') {
                                        params.append('department_id', filters.department_id);
                                    }
                                    window.location.href = `/subjects/export?${params.toString()}`;
                                }}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Subjects
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.location.href = '/subjects/template'}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Download Template
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setImportModalOpen(true); resetImportModal(); }}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import from CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Subject
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2">
                        <div className="border-input bg-background flex min-h-[40px] w-full max-w-md flex-wrap items-center gap-1 rounded-md border px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            {searchTerms.map((term) => (
                                <Badge
                                    key={term}
                                    variant="secondary"
                                    className="gap-1 py-0.5 pr-1"
                                >
                                    {term}
                                    <button
                                        type="button"
                                        onClick={() => removeSearchTerm(term)}
                                        className="hover:bg-muted ml-0.5 rounded p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            <input
                                type="text"
                                placeholder={searchTerms.length === 0 ? "Search by code or name... (Press Enter to add)" : "Add another..."}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="placeholder:text-muted-foreground min-w-[120px] flex-1 bg-transparent text-sm outline-none"
                            />
                        </div>
                        {searchTerms.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllSearchTerms}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={filters.department_id || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('department_id', value)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                        {dept.code} - {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.course_id || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('course_id', value)
                            }
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {/* Filter courses by selected department if one is selected */}
                                {(filters.department_id && filters.department_id !== 'all'
                                    ? courses.filter(c => c.department_id.toString() === filters.department_id)
                                    : courses
                                ).map((course) => (
                                    <SelectItem key={course.id} value={course.id.toString()}>
                                        {course.code}
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
                                    Subject Name
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Course
                                </TableHead>
                                <TableHead className="px-4 py-3 text-center text-sm font-medium">
                                    Units
                                </TableHead>
                                <TableHead className="px-4 py-3 text-center text-sm font-medium">
                                    Hours (Lec/Lab)
                                </TableHead>
                                <TableHead className="px-4 py-3 text-left text-sm font-medium">
                                    Prerequisites
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
                            {subjects.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                                                <BookOpen className="text-muted-foreground h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    No subjects found
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    Add your first subject to get started
                                                </p>
                                            </div>
                                            <Button size="sm" onClick={openCreateModal}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Subject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                subjects.data.map((subject) => (
                                    <TableRow
                                        key={subject.id}
                                        className="hover:bg-muted/30 border-b transition-colors last:border-0"
                                    >
                                        <TableCell className="px-4 py-3">
                                            <span className="font-mono font-medium">
                                                {subject.code}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{subject.name}</p>
                                                {subject.description && (
                                                    <p className="text-muted-foreground line-clamp-1 text-xs">
                                                        {subject.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            {(subject.courses && subject.courses.length > 0) || subject.course ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {/* Show courses from many-to-many relationship */}
                                                    {subject.courses && subject.courses.length > 0 ? (
                                                        <>
                                                            {subject.courses.slice(0, 3).map((course) => (
                                                                <Badge
                                                                    key={course.id}
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {course.code}
                                                                </Badge>
                                                            ))}
                                                            {subject.courses.length > 3 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    +{subject.courses.length - 3}
                                                                </Badge>
                                                            )}
                                                        </>
                                                    ) : subject.course ? (
                                                        <Badge variant="outline" className="text-xs">
                                                            {subject.course.code}
                                                        </Badge>
                                                    ) : null}
                                                    {subject.major && (
                                                        <span className="text-muted-foreground text-xs block w-full mt-0.5">
                                                            {subject.major.name}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    GE
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <span className="font-medium">
                                                {subject.units}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-center">
                                            <span className="text-muted-foreground text-sm">
                                                {subject.lecture_hours} / {subject.lab_hours}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            {subject.prerequisites && subject.prerequisites.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {subject.prerequisites.slice(0, 2).map((prereq) => (
                                                        <Badge
                                                            key={prereq.id}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {prereq.code}
                                                        </Badge>
                                                    ))}
                                                    {subject.prerequisites.length > 2 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{subject.prerequisites.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
                                                    None
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <StatusBadge status={subject.is_active} />
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
                                                        onClick={() =>
                                                            openEditModal(subject)
                                                        }
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleToggleStatus(subject)
                                                        }
                                                    >
                                                        <Power className="mr-2 h-4 w-4" />
                                                        {subject.is_active
                                                            ? 'Deactivate'
                                                            : 'Activate'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() =>
                                                            setDeleteDialog({
                                                                open: true,
                                                                subject,
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
                {subjects.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            Showing {subjects.from} to {subjects.to} of {subjects.total}{' '}
                            subjects
                        </p>
                        <div className="flex items-center gap-2">
                            {subjects.links.map((link, index) => (
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
                title={modalMode === 'create' ? 'Create New Subject' : 'Edit Subject'}
                description={
                    modalMode === 'create'
                        ? 'Add a new subject to the curriculum'
                        : `Update information for ${selectedSubject?.code} - ${selectedSubject?.name}`
                }
                onSubmit={handleSubmit}
                submitLabel={
                    modalMode === 'create' ? 'Create Subject' : 'Save Changes'
                }
                isSubmitting={form.processing}
                size="xl"
            >
                <div className="space-y-6">
                    {/* Course Assignment */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Course Assignment</h4>
                            {form.data.course_ids.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {form.data.course_ids.length} course{form.data.course_ids.length > 1 ? 's' : ''} selected
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs -mt-2">
                            Select which courses this subject belongs to. Leave empty for General Education (GE) subjects.
                        </p>

                        <div className="rounded-lg border max-h-[300px] overflow-y-auto divide-y">
                            {departments.map((dept) => {
                                const deptCourses = courses.filter(c => c.department_id === dept.id);
                                if (deptCourses.length === 0) return null;

                                const isExpanded = expandedDepts.has(dept.id);
                                const selectedCount = deptCourses.filter(c => form.data.course_ids.includes(c.id)).length;
                                const hasSelection = selectedCount > 0;

                                return (
                                    <div key={dept.id} className="bg-card">
                                        <button
                                            type="button"
                                            onClick={() => toggleDeptExpanded(dept.id)}
                                            className="flex w-full items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{dept.code}</span>
                                                    <span className="text-muted-foreground text-xs">- {dept.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {hasSelection && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                        {selectedCount} selected
                                                    </Badge>
                                                )}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                                                {deptCourses.map((course) => {
                                                    const isSelected = form.data.course_ids.includes(course.id);
                                                    return (
                                                        <div
                                                            key={course.id}
                                                            className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${isSelected
                                                                ? 'border-primary bg-primary/10'
                                                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                                                }`}
                                                            onClick={() => toggleCourse(course.id)}
                                                        >
                                                            <div
                                                                className={`h-4 w-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center transition-colors ${isSelected
                                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                                    : 'border-input bg-background'
                                                                    }`}
                                                            >
                                                                {isSelected && (
                                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="font-medium text-sm truncate">{course.code}</p>
                                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                                        {course.years} Year{course.years !== 1 ? 's' : ''}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-muted-foreground text-xs truncate">{course.name}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <InputError message={form.errors.course_ids} />

                        {/* Major/Specialization - only show if exactly one course is selected */}
                        {form.data.course_ids.length === 1 && availableMajors.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="major_id">Major/Specialization</Label>
                                <Select
                                    value={form.data.major_id || 'none'}
                                    onValueChange={(value) =>
                                        form.setData('major_id', value === 'none' ? '' : value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select major" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">All majors / General</SelectItem>
                                        {availableMajors.map((major) => (
                                            <SelectItem key={major.id} value={major.id.toString()}>
                                                {major.code ? `${major.code} - ` : ''}{major.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.major_id} />
                            </div>
                        )}
                    </div>

                    {/* Subject Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Subject Information</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Subject Code <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="code"
                                    value={form.data.code}
                                    onChange={(e) =>
                                        form.setData('code', e.target.value.toUpperCase())
                                    }
                                    placeholder="CS 101"
                                    className="font-mono"
                                />
                                <InputError message={form.errors.code} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Subject Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="Introduction to Computer Science"
                                />
                                <InputError message={form.errors.name} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                placeholder="Brief description of the subject..."
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
                                    Active (subject can be assigned to schedules)
                                </Label>
                            </div>
                        )}
                    </div>

                    {/* Credit Hours */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Credit Hours</h4>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="units">
                                    Units <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="units"
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={form.data.units}
                                    onChange={(e) =>
                                        form.setData('units', parseInt(e.target.value) || 0)
                                    }
                                />
                                <InputError message={form.errors.units} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lecture_hours">
                                    Lecture Hours <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="lecture_hours"
                                    type="number"
                                    min={0}
                                    max={12}
                                    value={form.data.lecture_hours}
                                    onChange={(e) =>
                                        form.setData(
                                            'lecture_hours',
                                            parseInt(e.target.value) || 0
                                        )
                                    }
                                />
                                <InputError message={form.errors.lecture_hours} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lab_hours">
                                    Lab Hours <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="lab_hours"
                                    type="number"
                                    min={0}
                                    max={12}
                                    value={form.data.lab_hours}
                                    onChange={(e) =>
                                        form.setData(
                                            'lab_hours',
                                            parseInt(e.target.value) || 0
                                        )
                                    }
                                />
                                <InputError message={form.errors.lab_hours} />
                            </div>
                        </div>

                        {/* Category for Room Assignment Rules */}
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Subject Category (Room Assignment)
                            </Label>
                            <Select
                                value={form.data.category || 'none'}
                                onValueChange={(value) => form.setData('category', value === 'none' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (General)</SelectItem>
                                    <SelectItem value="CISCO">CISCO - Networking subjects (HF202)</SelectItem>
                                    <SelectItem value="BSCS_PURE">BSCS Pure - CS/CpE faculty only</SelectItem>
                                    <SelectItem value="LICT">LICT - CS/IT faculty</SelectItem>
                                    <SelectItem value="LIS">LIS - Library Science</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-muted-foreground text-xs">
                                Used to determine which rooms this subject can be assigned to during scheduling
                            </p>
                            <InputError message={form.errors.category} />
                        </div>
                    </div>

                    {/* Prerequisites */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Prerequisites</h4>
                            {form.data.prerequisite_ids.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {form.data.prerequisite_ids.length} selected
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs -mt-2">
                            Select subjects that must be completed before taking this subject.
                        </p>

                        {/* Search Bar */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search prerequisites (press Enter to tag)..."
                                    value={prereqSearchInput}
                                    onChange={(e) => setPrereqSearchInput(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (prereqSearchInput.trim()) {
                                                const term = prereqSearchInput.trim();
                                                if (!prereqSearchTags.includes(term)) {
                                                    setPrereqSearchTags([...prereqSearchTags, term]);
                                                }
                                                setPrereqSearchInput('');
                                            }
                                        }
                                    }}
                                />
                            </div>
                            {prereqSearchTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    {prereqSearchTags.map((tag, i) => (
                                        <Badge key={i} variant="outline" className="gap-1 px-2 py-0.5 text-xs font-normal">
                                            {tag}
                                            <button
                                                type="button"
                                                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                                onClick={() => setPrereqSearchTags(prereqSearchTags.filter((_, idx) => idx !== i))}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    <button
                                        type="button"
                                        className="text-[10px] text-muted-foreground hover:text-foreground underline px-1"
                                        onClick={() => {
                                            setPrereqSearchTags([]);
                                            setPrereqSearchInput('');
                                        }}
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border max-h-[300px] overflow-y-auto divide-y">
                            {/* Department-grouped Prerequisites */}
                            {departments.map((dept) => {
                                // Filter subjects that belong to this department (via courses)
                                const deptSubjects = filteredAllSubjects.filter(s => s.courses?.some(c => c.department_id === dept.id));
                                if (deptSubjects.length === 0) return null;

                                const isExpanded = expandedPrereqDepts.has(dept.id);
                                const selectedCount = deptSubjects.filter(s => form.data.prerequisite_ids.includes(s.id)).length;
                                const hasSelection = selectedCount > 0;
                                // Auto-expand if searching and matches found
                                const isSearching = prereqSearchTags.length > 0 || prereqSearchInput.trim().length > 0;
                                const shouldExpand = isExpanded || isSearching;

                                return (
                                    <div key={dept.id} className="bg-card">
                                        <button
                                            type="button"
                                            onClick={() => togglePrereqDeptExpanded(dept.id)}
                                            className="flex w-full items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {shouldExpand ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{dept.code}</span>
                                                    <span className="text-muted-foreground text-xs">- {dept.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {hasSelection && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                        {selectedCount} selected
                                                    </Badge>
                                                )}
                                            </div>
                                        </button>

                                        {shouldExpand && (
                                            <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                                                {deptSubjects.map((subject) => {
                                                    // Don't show current subject as prerequisite option (if editing)
                                                    if (modalMode === 'edit' && selectedSubject?.id === subject.id) return null;

                                                    const isSelected = form.data.prerequisite_ids.includes(subject.id);
                                                    return (
                                                        <div
                                                            key={subject.id}
                                                            className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${isSelected
                                                                ? 'border-primary bg-primary/10'
                                                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                                                }`}
                                                            onClick={() => {
                                                                const currentIds = form.data.prerequisite_ids;
                                                                if (isSelected) {
                                                                    form.setData('prerequisite_ids', currentIds.filter(id => id !== subject.id));
                                                                } else {
                                                                    form.setData('prerequisite_ids', [...currentIds, subject.id]);
                                                                }
                                                            }}
                                                        >
                                                            <div
                                                                className={`h-4 w-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center transition-colors ${isSelected
                                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                                    : 'border-input bg-background'
                                                                    }`}
                                                            >
                                                                {isSelected && (
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="font-medium text-sm truncate">{subject.code}</p>
                                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                                        {subject.units} Unit{subject.units !== 1 ? 's' : ''}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-muted-foreground text-xs truncate">{subject.name}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* General / Others Section */}
                            {(() => {
                                const generalSubjects = filteredAllSubjects.filter(s => !s.courses || s.courses.length === 0);
                                if (generalSubjects.length === 0) return null;

                                const isExpanded = expandedPrereqDepts.has(0); // Use 0 for General
                                const selectedCount = generalSubjects.filter(s => form.data.prerequisite_ids.includes(s.id)).length;
                                const hasSelection = selectedCount > 0;
                                const isSearching = prereqSearchTags.length > 0 || prereqSearchInput.trim().length > 0;
                                const shouldExpand = isExpanded || isSearching;

                                return (
                                    <div className="bg-card">
                                        <button
                                            type="button"
                                            onClick={() => togglePrereqDeptExpanded(0)}
                                            className="flex w-full items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {shouldExpand ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">General / Common</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {hasSelection && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                        {selectedCount} selected
                                                    </Badge>
                                                )}
                                            </div>
                                        </button>

                                        {shouldExpand && (
                                            <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                                                {generalSubjects.map((subject) => {
                                                    if (modalMode === 'edit' && selectedSubject?.id === subject.id) return null;

                                                    const isSelected = form.data.prerequisite_ids.includes(subject.id);
                                                    return (
                                                        <div
                                                            key={subject.id}
                                                            className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${isSelected
                                                                ? 'border-primary bg-primary/10'
                                                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                                                }`}
                                                            onClick={() => {
                                                                const currentIds = form.data.prerequisite_ids;
                                                                if (isSelected) {
                                                                    form.setData('prerequisite_ids', currentIds.filter(id => id !== subject.id));
                                                                } else {
                                                                    form.setData('prerequisite_ids', [...currentIds, subject.id]);
                                                                }
                                                            }}
                                                        >
                                                            <div
                                                                className={`h-4 w-4 shrink-0 rounded-[4px] border shadow-xs flex items-center justify-center transition-colors ${isSelected
                                                                    ? 'bg-primary border-primary text-primary-foreground'
                                                                    : 'border-input bg-background'
                                                                    }`}
                                                            >
                                                                {isSelected && (
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="font-medium text-sm truncate">{subject.code}</p>
                                                                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                                        {subject.units} Unit{subject.units !== 1 ? 's' : ''}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-muted-foreground text-xs truncate">{subject.name}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                        <InputError message={form.errors.prerequisite_ids} />
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog({
                        open,
                        subject: open ? deleteDialog.subject : null,
                    })
                }
                title="Delete Subject"
                description={
                    <>
                        Are you sure you want to delete{' '}
                        <strong>
                            {deleteDialog.subject?.code} - {deleteDialog.subject?.name}
                        </strong>
                        ? This action cannot be undone.
                    </>
                }
                onConfirm={handleDelete}
                confirmLabel="Delete"
                variant="destructive"
            />

            {/* Import Modal */}
            <FormModal
                open={importModalOpen}
                onOpenChange={(open) => {
                    setImportModalOpen(open);
                    if (!open) resetImportModal();
                }}
                title="Import Subjects from CSV"
                description="Upload a CSV file to import subjects. You can download a template to see the expected format."
                onSubmit={handleImportSubmit}
                submitLabel={importValidation.validated ? `Import ${importValidation.summary?.valid || 0} Subjects` : 'Validate File'}
                isSubmitting={importValidation.loading}
                submitDisabled={!importFile || (importValidation.validated && importValidation.summary?.valid === 0)}
                size="lg"
            >
                <div className="space-y-4">
                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="import-file">CSV File</Label>
                        <div className="flex gap-2">
                            <Input
                                id="import-file"
                                type="file"
                                accept=".csv,.txt"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="flex-1"
                            />
                            {importFile && !importValidation.validated && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={validateImportFile}
                                    disabled={importValidation.loading}
                                >
                                    {importValidation.loading ? 'Validating...' : 'Validate'}
                                </Button>
                            )}
                        </div>
                        {importFile && (
                            <p className="text-muted-foreground text-xs">
                                Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>

                    {/* Validation Error */}
                    {importValidation.error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                            <div className="flex items-center gap-2 text-red-500">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">{importValidation.error}</span>
                            </div>
                        </div>
                    )}

                    {/* Validation Summary */}
                    {importValidation.validated && importValidation.summary && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border p-3 text-center">
                                    <p className="text-muted-foreground text-xs">Total Rows</p>
                                    <p className="text-lg font-semibold">{importValidation.summary.total}</p>
                                </div>
                                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-center">
                                    <p className="text-xs text-green-600 dark:text-green-400">Valid</p>
                                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                        {importValidation.summary.valid}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center">
                                    <p className="text-xs text-red-600 dark:text-red-400">Invalid</p>
                                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                                        {importValidation.summary.invalid}
                                    </p>
                                </div>
                            </div>

                            {/* Valid Rows Preview */}
                            {importValidation.validRows && importValidation.validRows.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Valid Subjects (Preview)
                                    </div>
                                    <div className="max-h-32 overflow-auto rounded-lg border">
                                        <Table className="w-full text-xs">
                                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="px-2 py-1 text-left">Code</TableHead>
                                                    <TableHead className="px-2 py-1 text-left">Name</TableHead>
                                                    <TableHead className="px-2 py-1 text-center">Units</TableHead>
                                                    <TableHead className="px-2 py-1 text-left">Courses</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importValidation.validRows.map((row, i) => (
                                                    <TableRow key={i} className="border-t">
                                                        <TableCell className="px-2 py-1 font-mono">{row.code}</TableCell>
                                                        <TableCell className="px-2 py-1">{row.name}</TableCell>
                                                        <TableCell className="px-2 py-1 text-center">{row.units}</TableCell>
                                                        <TableCell className="px-2 py-1">
                                                            {row.courses}
                                                            {row.warning && (
                                                                <span className="text-amber-500 ml-1">⚠</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* Invalid Rows */}
                            {importValidation.invalidRows && importValidation.invalidRows.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                                        <AlertTriangle className="h-4 w-4" />
                                        Invalid Rows (Will be skipped)
                                    </div>
                                    <div className="max-h-32 overflow-auto rounded-lg border border-red-500/20">
                                        <Table className="w-full text-xs">
                                            <TableHeader className="bg-red-500/10 sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="px-2 py-1 text-left">Row</TableHead>
                                                    <TableHead className="px-2 py-1 text-left">Code</TableHead>
                                                    <TableHead className="px-2 py-1 text-left">Errors</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importValidation.invalidRows.map((row, i) => (
                                                    <TableRow key={i} className="border-t border-red-500/20">
                                                        <TableCell className="px-2 py-1">{row.row}</TableCell>
                                                        <TableCell className="px-2 py-1 font-mono">{row.code || '-'}</TableCell>
                                                        <TableCell className="px-2 py-1 text-red-500">
                                                            {row.errors.join(', ')}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Download Template Link */}
                    <div className="flex items-center justify-center gap-2 pt-2 border-t">
                        <span className="text-muted-foreground text-xs">Need the correct format?</span>
                        <a
                            href="/subjects/template"
                            className="text-xs text-primary hover:underline"
                        >
                            Download Template
                        </a>
                    </div>
                </div>
            </FormModal>
        </AppLayout>
    );
}
