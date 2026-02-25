import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Circle,
    Download,
    FileSpreadsheet,
    MoreHorizontal,
    Play,
    Plus,
    Settings,
    Trash2,
    Upload,
} from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { ConfirmModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    type SharedData,
} from '@/types';

interface Props {
    setups: PaginatedData<AcademicSetup>;
    academicYears: string[];
    filters: {
        academic_year?: string;
        semester?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academics', href: '#' },
    { title: 'Schedule Plan', href: '/academic-setup' },
];

export default function AcademicSetupIndex({ setups, academicYears, filters }: Props) {
    const { csrf_token } = usePage<SharedData>().props;
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        setup: AcademicSetup | null;
    }>({ open: false, setup: null });

    // Selection state for bulk export
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Import dialog state - simplified flow that creates new setup from CSV
    const [importDialog, setImportDialog] = useState<{
        open: boolean;
        step: 'upload' | 'preview' | 'importing';
        file: File | null;
        parsedInfo: {
            department: string;
            courses: string;
            curriculum: string;
            academic_year: string;
            semester: string;
            subjects_count: number;
            faculty_count: number;
        } | null;
        validationResult: {
            success: boolean;
            summary: {
                total_subjects: number;
                valid_subjects: number;
                invalid_subjects: number;
                total_faculty: number;
                valid_faculty: number;
                invalid_faculty: number;
                assignment_warnings: number;
            };
            warnings: {
                subjects: Array<{ code: string; name: string; year_level: string; reason: string }>;
                faculty: Array<{ email: string; name: string; reason: string }>;
                assignments: Array<{ subject_code: string; faculty_email: string; faculty_name: string; year_level: string; reason: string }>;
            };
        } | null;
        error: string | null;
        createMissingFaculty: boolean;
        createMissingSubjects: boolean;
    }>({
        open: false,
        step: 'upload',
        file: null,
        parsedInfo: null,
        validationResult: null,
        error: null,
        createMissingFaculty: false,
        createMissingSubjects: false,
    });

    // Add program dialog state
    const [addProgramDialog, setAddProgramDialog] = useState<{
        open: boolean;
        setup: AcademicSetup | null;
        compatibleCourses: any[];
        loading: boolean;
        selectedCourseId: string;
        selectionMode: 'year' | 'subject';
        subjects: any[];
        loadingSubjects: boolean;
        blockCounts: Record<string, number>;
        submitting: boolean;
    }>({
        open: false,
        setup: null,
        compatibleCourses: [],
        loading: false,
        selectedCourseId: '',
        selectionMode: 'year',
        subjects: [],
        loadingSubjects: false,
        blockCounts: {
            '1st': 1,
            '2nd': 1,
            '3rd': 1,
            '4th': 1,
            '5th': 1,
        },
        submitting: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const openAddProgramDialog = async (setup: AcademicSetup) => {
        setAddProgramDialog(prev => ({
            ...prev,
            open: true,
            setup,
            loading: true,
            selectedCourseId: '',
            selectionMode: 'year',
            subjects: [],
            blockCounts: {
                '1st': 1, '2nd': 1, '3rd': 1, '4th': 1, '5th': 1,
            }
        }));
        try {
            const response = await fetch(`/academic-setup/${setup.id}/compatible-courses`);
            const data = await response.json();
            if (data.success) {
                setAddProgramDialog(prev => ({
                    ...prev,
                    compatibleCourses: data.courses,
                    loading: false
                }));
            }
        } catch (error) {
            console.error('Failed to fetch compatible courses', error);
            setAddProgramDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const fetchSubjects = async (courseId: string) => {
        if (!addProgramDialog.setup || !courseId) return;

        setAddProgramDialog(prev => ({ ...prev, loadingSubjects: true, subjects: [], blockCounts: {} }));
        try {
            const response = await fetch(`/academic-setup/${addProgramDialog.setup.id}/subjects/${courseId}`);
            const data = await response.json();
            if (data.success) {
                const initialCounts: Record<string, number> = {};
                data.subjects.forEach((s: any) => { initialCounts[s.id] = 1; });

                setAddProgramDialog(prev => ({
                    ...prev,
                    subjects: data.subjects,
                    blockCounts: prev.selectionMode === 'subject' ? initialCounts : {
                        '1st': 1, '2nd': 1, '3rd': 1, '4th': 1, '5th': 1,
                    },
                    loadingSubjects: false
                }));
            }
        } catch (error) {
            console.error('Failed to fetch subjects', error);
            setAddProgramDialog(prev => ({ ...prev, loadingSubjects: false }));
        }
    };

    const handleAddProgramSubmit = () => {
        if (!addProgramDialog.setup || !addProgramDialog.selectedCourseId) return;

        setAddProgramDialog(prev => ({ ...prev, submitting: true }));
        router.post(`/academic-setup/${addProgramDialog.setup.id}/add-programs`, {
            course_ids: [parseInt(addProgramDialog.selectedCourseId)],
            selection_mode: addProgramDialog.selectionMode,
            block_counts: addProgramDialog.blockCounts,
        }, {
            onSuccess: () => {
                setAddProgramDialog({
                    open: false,
                    setup: null,
                    compatibleCourses: [],
                    loading: false,
                    selectedCourseId: '',
                    selectionMode: 'year',
                    subjects: [],
                    loadingSubjects: false,
                    blockCounts: {
                        '1st': 1, '2nd': 1, '3rd': 1, '4th': 1, '5th': 1,
                    },
                    submitting: false,
                });
            },
            onFinish: () => setAddProgramDialog(prev => ({ ...prev, submitting: false })),
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (value === 'all') {
            delete newFilters[key as keyof typeof newFilters];
        }
        router.get('/academic-setup', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (deleteDialog.setup) {
            router.delete(`/academic-setup/${deleteDialog.setup.id}`, {
                onSuccess: () => setDeleteDialog({ open: false, setup: null }),
            });
        }
    };

    const handleActivate = (setup: AcademicSetup) => {
        router.patch(`/academic-setup/${setup.id}/activate`);
    };

    // Toggle selection
    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    // Select all
    const toggleSelectAll = () => {
        if (selectedIds.length === setups.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(setups.data.map(s => s.id));
        }
    };

    // Export selected setups
    const exportSelected = async () => {
        if (selectedIds.length === 0) return;

        if (selectedIds.length === 1) {
            // Single export - direct download
            window.location.href = `/academic-setup/${selectedIds[0]}/export-csv`;
        } else {
            // Bulk export - create form and submit
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/academic-setup/export-bulk';
            form.style.display = 'none';

            // CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            // Add setup IDs
            selectedIds.forEach(id => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'setup_ids[]';
                input.value = id.toString();
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        }

        // Clear selection after export
        setSelectedIds([]);
    };

    // Handle file selection for import
    const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportDialog(prev => ({
            ...prev,
            file,
            step: 'preview',
            error: null,
            parsedInfo: null,
            validationResult: null,
        }));

        // Validate the file using the new import endpoint
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/academic-setup/validate-new-import', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf_token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            if (response.status === 419) {
                window.location.reload();
                return;
            }

            const result = await response.json();

            if (result.success) {
                setImportDialog(prev => ({
                    ...prev,
                    parsedInfo: result.parsed_info,
                    validationResult: result,
                }));
            } else {
                setImportDialog(prev => ({
                    ...prev,
                    error: result.message || 'Failed to validate file',
                }));
            }
        } catch {
            setImportDialog(prev => ({
                ...prev,
                error: 'Failed to validate file. Please check the file format.',
            }));
        }
    };

    // Perform the actual import - creates a new setup
    const performImport = async () => {
        if (!importDialog.file) return;

        setImportDialog(prev => ({ ...prev, step: 'importing' }));

        const formData = new FormData();
        formData.append('file', importDialog.file);
        formData.append('skip_invalid', 'true');
        formData.append('create_missing_faculty', importDialog.createMissingFaculty ? '1' : '0');
        formData.append('create_missing_subjects', importDialog.createMissingSubjects ? '1' : '0');


        try {
            const response = await fetch('/academic-setup/import-new', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf_token,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (response.status === 419) {
                window.location.reload();
                return;
            }

            const result = await response.json();

            if (response.ok && result.success) {
                // Redirect to configure page for the new setup
                router.visit(`/academic-setup/${result.setup_id}/configure?year=1st`);
            } else {
                setImportDialog(prev => ({
                    ...prev,
                    step: 'preview',
                    error: result.message || 'Import failed. Please try again.',
                }));
            }
        } catch {
            setImportDialog(prev => ({
                ...prev,
                step: 'preview',
                error: 'Import failed. Please check your connection and try again.',
            }));
        }
    };

    // Reset import dialog
    const resetImportDialog = () => {
        setImportDialog({
            open: false,
            step: 'upload',
            file: null,
            parsedInfo: null,
            validationResult: null,
            error: null,
            createMissingFaculty: false,
            createMissingSubjects: false,
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Plan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Schedule Plan</h1>
                        <p className="text-muted-foreground">
                            Setup the subjects and faculty for each semester across all year levels
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Export button - enabled when items are selected */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportSelected}
                            disabled={selectedIds.length === 0}
                            title={selectedIds.length === 0 ? 'Select items to export' : `Export ${selectedIds.length} selected`}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </Button>
                        {/* Import button - always enabled */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImportDialog(prev => ({ ...prev, open: true }))}
                            title="Import from CSV"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button asChild>
                            <Link href="/academic-setup/create">
                                <Plus className="mr-2 h-4 w-4" />
                                New Setup
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                    <Select
                        value={filters.academic_year || 'all'}
                        onValueChange={(value) => handleFilterChange('academic_year', value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Academic Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {academicYears.map((year) => (
                                <SelectItem key={year} value={year}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.semester || 'all'}
                        onValueChange={(value) => handleFilterChange('semester', value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Semester" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            <SelectItem value="1st">1st Semester</SelectItem>
                            <SelectItem value="2nd">2nd Semester</SelectItem>
                            <SelectItem value="summer">Summer</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) => handleFilterChange('status', value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="configuring">Configuring</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={setups.data.length > 0 && selectedIds.length === setups.data.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Curriculum</TableHead>
                                <TableHead>Semester</TableHead>
                                <TableHead>Year Levels</TableHead>
                                <TableHead>Progress</TableHead>
                                {/* <TableHead>Status</TableHead> */}
                                <TableHead className="w-[80px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {setups.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No academic setups found. Create one to get started or import from CSV.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                setups.data.map((setup) => (
                                    <TableRow key={setup.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(setup.id)}
                                                onCheckedChange={() => toggleSelection(setup.id)}
                                                aria-label={`Select ${setup.curriculum_name}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {setup.department && (
                                                <span className="font-medium text-primary text-sm">
                                                    {setup.department.name}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 min-w-[250px]">
                                                {setup.courses && setup.courses.length > 0 ? (
                                                    setup.courses.map((c) => (
                                                        <div key={c.id} className="leading-tight">
                                                            <div className="font-medium">{c.name}</div>
                                                            <div className="text-muted-foreground text-xs">({c.code})</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    setup.course && (
                                                        <div className="leading-tight">
                                                            <div className="font-medium">{setup.course.name}</div>
                                                            <div className="text-muted-foreground text-xs">({setup.course.code})</div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{setup.curriculum_name}</span>
                                                <span className="text-muted-foreground text-xs">{setup.academic_year}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {setup.semester} Sem
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {setup.year_levels?.map((yl) => (
                                                    <div
                                                        key={yl.id}
                                                        className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs ${yl.is_configured
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        {yl.is_configured ? (
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        ) : (
                                                            <Circle className="h-3 w-3" />
                                                        )}
                                                        {yl.year_level}
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="w-32">
                                                <Progress value={setup.progress_percentage} className="h-2" />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {setup.progress_percentage}% complete
                                                </p>
                                            </div>
                                        </TableCell>
                                        {/* <TableCell>
                                            <Badge variant={statusColors[setup.status] || 'secondary'}>
                                                {setup.status}
                                            </Badge>
                                        </TableCell> */}
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/academic-setup/${setup.id}/configure?year=${setup.year_levels?.find((yl) => !yl.is_configured)?.year_level ||
                                                                setup.year_levels?.[0]?.year_level || '1st'
                                                                }`}
                                                        >
                                                            <Settings className="mr-2 h-4 w-4" />
                                                            Setting
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            window.location.href = `/academic-setup/${setup.id}/export-csv`;
                                                        }}
                                                    >
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Export CSV
                                                    </DropdownMenuItem>
                                                    {setup.status === 'configuring' && (
                                                        <DropdownMenuItem onClick={() => handleActivate(setup)}>
                                                            <Play className="mr-2 h-4 w-4" />
                                                            Activate
                                                        </DropdownMenuItem>
                                                    )}
                                                    {setup.status === 'active' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/scheduling?setup=${setup.id}`}>
                                                                <Calendar className="mr-2 h-4 w-4" />
                                                                Generate Schedule
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => openAddProgramDialog(setup)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add Program
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteDialog({ open: true, setup })}
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
                {setups.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {setups.from} to {setups.to} of {setups.total} results
                        </p>
                        <div className="flex gap-2">
                            {setups.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, setup: open ? deleteDialog.setup : null })}
                title="Delete Academic Setup"
                description={
                    <>
                        Are you sure you want to delete the setup for{' '}
                        <strong>
                            {deleteDialog.setup?.courses && deleteDialog.setup.courses.length > 0
                                ? deleteDialog.setup.courses.map((c) => c.code).join(', ')
                                : deleteDialog.setup?.course?.code}
                        </strong>?
                        This will also delete all configured subjects, faculty assignments, and generated schedules.
                    </>
                }
                onConfirm={handleDelete}
                confirmLabel="Delete"
                variant="destructive"
            />

            {/* Import Dialog */}
            <Dialog open={importDialog.open} onOpenChange={(open) => {
                if (!open) resetImportDialog();
                else setImportDialog(prev => ({ ...prev, open }));
            }}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Import Academic Setup from CSV
                        </DialogTitle>
                        <DialogDescription>
                            Import a previously exported CSV file to create a new academic setup with all subjects and faculty.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step 1: Upload File */}
                    {importDialog.step === 'upload' && (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    Select a CSV file exported from Academic Setup
                                </p>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleImportFileSelect}
                                    className="max-w-xs mx-auto"
                                />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p><strong>Note:</strong> The CSV file should be exported from an Academic Setup using the Export button.</p>
                                <p>A new academic setup will be created with the imported data.</p>
                                <p>Missing subjects or faculty will be reported before import.</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {importDialog.step === 'preview' && (
                        <div className="space-y-4">
                            {importDialog.error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-destructive">Error</p>
                                        <p className="text-sm text-muted-foreground">{importDialog.error}</p>
                                    </div>
                                </div>
                            )}

                            {importDialog.parsedInfo && (
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <p className="font-medium mb-3">Setup Information from CSV</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Courses</p>
                                            <p className="font-medium">{importDialog.parsedInfo.courses}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Curriculum</p>
                                            <p className="font-medium">{importDialog.parsedInfo.curriculum}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Academic Year</p>
                                            <p className="font-medium">{importDialog.parsedInfo.academic_year}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Semester</p>
                                            <p className="font-medium">{importDialog.parsedInfo.semester}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {importDialog.validationResult && (
                                <>
                                    {/* Summary */}
                                    <div className="bg-muted/30 rounded-lg p-4">
                                        <p className="font-medium mb-2">Import Summary</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Subjects</p>
                                                <p className="font-medium">
                                                    {importDialog.validationResult.summary.valid_subjects} of {importDialog.validationResult.summary.total_subjects} valid
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Faculty</p>
                                                <p className="font-medium">
                                                    {importDialog.validationResult.summary.valid_faculty} of {importDialog.validationResult.summary.total_faculty} valid
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warnings - Subjects */}
                                    {importDialog.validationResult.warnings.subjects.length > 0 && (
                                        <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                <p className="font-medium text-yellow-600">
                                                    {importDialog.validationResult.warnings.subjects.length} Subject(s) Not Found
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                These subjects will be skipped during import:
                                            </p>
                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                {importDialog.validationResult.warnings.subjects.map((warning, idx) => (
                                                    <div key={idx} className="text-sm flex items-center justify-between bg-background/50 rounded px-2 py-1">
                                                        <span className="font-mono">{warning.code}</span>
                                                        <span className="text-muted-foreground text-xs">{warning.year_level} Year</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex items-start gap-2 pt-4 border-t border-yellow-500/20">
                                                <Checkbox
                                                    id="create-missing-subjects"
                                                    checked={importDialog.createMissingSubjects}
                                                    onCheckedChange={(checked) => setImportDialog(prev => ({ ...prev, createMissingSubjects: !!checked }))}
                                                    className="mt-0.5"
                                                />
                                                <div className="space-y-1">
                                                    <label
                                                        htmlFor="create-missing-subjects"
                                                        className="text-sm font-medium leading-none cursor-pointer"
                                                    >
                                                        Create these missing subjects?
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        New subjects will be created with default values (3 units, 3 lec hours). You can edit them later.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Warnings - Faculty */}
                                    {importDialog.validationResult.warnings.faculty.length > 0 && (
                                        <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                <p className="font-medium text-yellow-600">
                                                    {importDialog.validationResult.warnings.faculty.length} Faculty Not Found
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                These faculty will be skipped during import:
                                            </p>
                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                {importDialog.validationResult.warnings.faculty.map((warning, idx) => (
                                                    <div key={idx} className="text-sm flex items-center justify-between bg-background/50 rounded px-2 py-1">
                                                        <span>{warning.name}</span>
                                                        <span className="text-muted-foreground text-xs">{warning.email}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex items-start gap-2 pt-4 border-t border-yellow-500/20">
                                                <Checkbox
                                                    id="create-missing"
                                                    checked={importDialog.createMissingFaculty}
                                                    onCheckedChange={(checked) => setImportDialog(prev => ({ ...prev, createMissingFaculty: !!checked }))}
                                                    className="mt-0.5"
                                                />
                                                <div className="space-y-1">
                                                    <label
                                                        htmlFor="create-missing"
                                                        className="text-sm font-medium leading-none cursor-pointer"
                                                    >
                                                        Create accounts for these missing faculty?
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        New accounts will be created with default password 'password' and assigned to this department.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* No warnings - all good! */}
                                    {importDialog.validationResult.warnings.subjects.length === 0 &&
                                        importDialog.validationResult.warnings.faculty.length === 0 &&
                                        importDialog.validationResult.warnings.assignments.length === 0 && (
                                            <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-4 flex items-center gap-3">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-green-600">All data is valid!</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        All subjects and faculty in the file exist in the database.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                </>
                            )}

                            {!importDialog.validationResult && !importDialog.error && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="ml-3 text-muted-foreground">Validating file...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Importing */}
                    {importDialog.step === 'importing' && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-3 text-muted-foreground">Creating setup and importing data...</span>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={resetImportDialog}>
                            Cancel
                        </Button>
                        {importDialog.step === 'preview' && importDialog.validationResult && importDialog.parsedInfo && (
                            <Button onClick={performImport}>
                                <Upload className="mr-1 h-4 w-4" />
                                Create Setup & Import
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Program Dialog */}
            <Dialog
                open={addProgramDialog.open}
                onOpenChange={(open) => setAddProgramDialog(prev => ({ ...prev, open }))}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Program to Setup</DialogTitle>
                        <DialogDescription>
                            Select a program to add to this academic setup and specify block counts.
                        </DialogDescription>
                    </DialogHeader>

                    {addProgramDialog.loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Program</Label>
                                <Select
                                    value={addProgramDialog.selectedCourseId}
                                    onValueChange={(value) => {
                                        setAddProgramDialog(prev => ({ ...prev, selectedCourseId: value }));
                                        fetchSubjects(value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {addProgramDialog.compatibleCourses.map(course => (
                                            <SelectItem key={course.id} value={course.id.toString()}>
                                                {course.code} - {course.name}
                                            </SelectItem>
                                        ))}
                                        {addProgramDialog.compatibleCourses.length === 0 && (
                                            <SelectItem value="none" disabled>No compatible courses found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {addProgramDialog.selectedCourseId && (
                                <Tabs
                                    value={addProgramDialog.selectionMode}
                                    onValueChange={(val) => setAddProgramDialog(prev => ({
                                        ...prev,
                                        selectionMode: val as 'year' | 'subject',
                                        blockCounts: val === 'year' ? {
                                            '1st': 1, '2nd': 1, '3rd': 1, '4th': 1, '5th': 1,
                                        } : Object.fromEntries(prev.subjects.map(s => [s.id, 1]))
                                    }))}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Block Count Strategy</Label>
                                        <TabsList className="grid grid-cols-2 w-[240px]">
                                            <TabsTrigger value="year">By Year Level</TabsTrigger>
                                            <TabsTrigger value="subject">By Subject</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    {addProgramDialog.selectionMode === 'year' ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-4 border rounded-md p-4 bg-muted/30">
                                                {['1st', '2nd', '3rd', '4th', '5th'].map(year => (
                                                    <div key={year} className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-medium">{year} Year</span>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="20"
                                                            className="w-20"
                                                            value={addProgramDialog.blockCounts[year] || 1}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                const val = parseInt(e.target.value);
                                                                setAddProgramDialog(prev => ({
                                                                    ...prev,
                                                                    blockCounts: {
                                                                        ...prev.blockCounts,
                                                                        [year]: isNaN(val) ? 1 : val
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {addProgramDialog.loadingSubjects ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                                    <span className="text-xs text-muted-foreground">Loading subjects...</span>
                                                </div>
                                            ) : (
                                                <div className="border rounded-md max-h-[250px] overflow-y-auto">
                                                    <div className="p-0 border-b bg-muted/30 grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-2">
                                                        <div className="col-span-3">Code</div>
                                                        <div className="col-span-7">Subject</div>
                                                        <div className="col-span-2 text-right">Blocks</div>
                                                    </div>
                                                    {addProgramDialog.subjects.length > 0 ? (
                                                        addProgramDialog.subjects.map(subject => (
                                                            <div key={subject.id} className="grid grid-cols-12 items-center gap-2 px-4 py-2 border-b last:border-0 hover:bg-muted/50">
                                                                <div className="col-span-3 text-xs font-mono">{subject.code}</div>
                                                                <div className="col-span-7">
                                                                    <div className="text-xs font-medium truncate">{subject.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground">{subject.year_level} Year</div>
                                                                </div>
                                                                <div className="col-span-2 flex justify-end">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        max="20"
                                                                        className="w-16 h-8 text-xs"
                                                                        value={addProgramDialog.blockCounts[subject.id] || 1}
                                                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                            const val = parseInt(e.target.value);
                                                                            setAddProgramDialog(prev => ({
                                                                                ...prev,
                                                                                blockCounts: {
                                                                                    ...prev.blockCounts,
                                                                                    [subject.id]: isNaN(val) ? 1 : val
                                                                                }
                                                                            }));
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                                            No subjects found for the current semester.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Tabs>
                            )}

                            <p className="text-[10px] text-muted-foreground mt-1">
                                Specifying blocks will automatically populate subjects from the latest prospectus.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAddProgramDialog(prev => ({ ...prev, open: false }))}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddProgramSubmit}
                            disabled={!addProgramDialog.selectedCourseId || addProgramDialog.submitting || addProgramDialog.loading}
                        >
                            {addProgramDialog.submitting ? 'Adding...' : 'Add Program'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
