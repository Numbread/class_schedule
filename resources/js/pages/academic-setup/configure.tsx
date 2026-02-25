import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Book,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Circle,
    // Copy,
    Download,
    FileSpreadsheet,
    Link2,
    Plus,
    Search,
    Trash2,
    Unlink,
    Upload,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import {
    type AcademicSetup,
    type AcademicSetupYearLevel,
    type BreadcrumbItem,
    type Building,
    type Course,
    type Room,
    type SharedData,
    type Subject,
    type User,
    type YearLevel,
} from '@/types';

// Helper to generate block code (e.g., CSC4 + Block 1 = CSC401, Block 2 = CSC402)
// Block number is padded to 2 digits (01, 02, etc.) regardless of year level
const generateBlockCode = (
    subjectCode: string,
    _yearLevel: YearLevel,
    blockNumber: number,
): string => {
    const baseCode = subjectCode.replace(/\s+/g, '');
    const paddedBlock = blockNumber.toString().padStart(2, '0');
    return `${baseCode}${paddedBlock}`;
};

interface ProspectusSubject {
    id: number;
    code: string;
    name: string;
    units: number;
    lecture_hours: number;
    lab_hours: number;
    year_level: string;
    semester: string;
    sort_order: number;
}

interface Prospectus {
    id: number;
    name: string;
    academic_year: string;
    course_id: number;
    course_code: string;
    subjects: ProspectusSubject[];
}

interface Props {
    setup: AcademicSetup;
    currentYearLevel: AcademicSetupYearLevel;
    subjects: Subject[];
    faculty: User[];
    subjectsInOtherYears: Record<number, string>; // subject_id -> year_level
    buildings?: Building[];
    rooms?: Room[];
    prospectuses?: Prospectus[];
    prospectusYears?: string[];
}

export default function ConfigureAcademicSetup({
    setup,
    currentYearLevel,
    subjects,
    faculty,
    subjectsInOtherYears,
    buildings = [],
    rooms = [],
    prospectuses = [],
    prospectusYears = [],
}: Props) {
    const { csrf_token } = usePage<SharedData>().props;
    // Get course codes for display - prefer multiple courses, fallback to single
    const courseCodes =
        setup.courses && setup.courses.length > 0
            ? setup.courses.map((c) => c.code).join(', ')
            : (setup.course?.code ?? 'N/A');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Academic Setup', href: '/academic-setup' },
        {
            title: `${courseCodes} - ${currentYearLevel.year_level} Year`,
            href: '#',
        },
    ];

    // Toggle to show/hide the Available Subjects section (set to true to re-enable)
    const showAvailableSubjects = false;

    // Scroll tracking for floating header
    const [showFloatingHeader, setShowFloatingHeader] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            // Show floating header after scrolling past 200px (header height approx)
            setShowFloatingHeader(scrollY > 200);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [activeTab, setActiveTab] = useState('subjects');
    const [subjectSearch, setSubjectSearch] = useState('');
    const [facultySearch, setFacultySearch] = useState('');

    // Prospectus selection state
    const [selectedProspectusYears, setSelectedProspectusYears] = useState<string[]>([]);
    const [expandedYearSections, setExpandedYearSections] = useState<Record<string, boolean>>({});

    // Parallel selection mode state
    const [parallelSelectionMode, setParallelSelectionMode] = useState(false);
    const [parallelSelectionItems, setParallelSelectionItems] = useState<Array<{
        subject: ProspectusSubject;
        prospectus: Prospectus;
    }>>([]);

    // Toggle for minor subjects visibility (default: false/hidden)
    const [showMinorSubjects, setShowMinorSubjects] = useState(false);

    // Dialog state for adding shared subjects
    const [addSubjectDialog, setAddSubjectDialog] = useState<{
        open: boolean;
        subject: Subject | null;
        selectedCourseIds: number[];
        fusionMode: 'separate' | 'fused';
    }>({
        open: false,
        subject: null,
        selectedCourseIds: [],
        fusionMode: 'separate',
    });

    // Dialog state for subjects with same title but different codes (parallel subject detection)
    // selectedItems uses composite keys "subjectId-prospectusId" to handle same subject appearing in multiple prospectuses
    const [parallelSubjectDialog, setParallelSubjectDialog] = useState<{
        open: boolean;
        clickedSubject: ProspectusSubject | null;
        clickedProspectus: Prospectus | null;
        matchingSubjects: Array<{
            subject: ProspectusSubject;
            prospectus: Prospectus;
        }>;
        selectedItems: string[]; // Composite keys "subjectId-prospectusId" of items to include
        mode: 'parallel' | 'separate';
    }>({
        open: false,
        clickedSubject: null,
        clickedProspectus: null,
        matchingSubjects: [],
        selectedItems: [],
        mode: 'separate',
    });

    // Import dialog state
    const [importDialog, setImportDialog] = useState<{
        open: boolean;
        step: 'upload' | 'preview' | 'importing';
        file: File | null;
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
    }>({
        open: false,
        step: 'upload',
        file: null,
        validationResult: null,
        error: null,
    });

    // Subject form - now includes course_ids (array) for fused course support
    // parallel_subject_ids stores IDs of subjects with different codes that are taught together
    const subjectForm = useForm<{
        section_count: number;
        subjects: Array<{
            subject_id: number;
            course_ids: number[]; // Multiple courses can be fused in one block
            block_number: number;
            expected_students: number;
            needs_lab: boolean;
            preferred_lecture_room_id: number | null;
            preferred_lab_room_id: number | null;
            parallel_subject_ids?: number[]; // IDs of other subjects taught in parallel (different codes, same content)
        }>;
    }>({
        section_count: currentYearLevel.section_count || 1,
        subjects:
            currentYearLevel.subjects?.map((s) => ({
                subject_id: s.subject_id,
                // Use courses relationship if available, fallback to single course_id
                course_ids:
                    s.courses?.map((c) => c.id) ||
                    (s.course_id ? [s.course_id] : []),
                block_number: s.block_number ?? 1,
                expected_students: s.expected_students,
                needs_lab: s.needs_lab,
                preferred_lecture_room_id: s.preferred_lecture_room_id ?? null,
                preferred_lab_room_id: s.preferred_lab_room_id ?? null,
                // Load parallel_subject_ids from backend if available
                parallel_subject_ids: s.parallel_subject_ids || [],
            })) || [],
    });

    // Get available rooms based on selected buildings/rooms in Facilities tab
    const getAvailableRooms = () => {
        // If specific rooms are selected, use those
        const selectedRoomIds = setup.selected_rooms?.map(r => r.id) || [];
        if (selectedRoomIds.length > 0) {
            return rooms.filter(r => selectedRoomIds.includes(r.id));
        }

        // If buildings are selected, filter rooms by those buildings
        const selectedBuildingIds = setup.buildings?.map(b => b.id) || [];
        if (selectedBuildingIds.length > 0) {
            return rooms.filter(r => r.building_id && selectedBuildingIds.includes(r.building_id));
        }

        // Fallback to all rooms
        return rooms;
    };

    const availableRooms = getAvailableRooms();

    // Filter rooms by type from available rooms
    const lectureRooms = availableRooms.filter(r => r.room_type === 'lecture' || r.room_type === 'hybrid');
    const labRooms = availableRooms.filter(r => r.room_type === 'laboratory' || r.room_type === 'hybrid');

    // Check if a subject is shared (GE or belongs to multiple courses)
    const isSharedSubject = (subject: Subject): boolean => {
        // Subject has a direct course_id - it's specific to one course
        if (subject.course_id) {
            return false;
        }
        // Subject has exactly one course via many-to-many - it's still specific
        if (subject.courses && subject.courses.length === 1) {
            return false;
        }
        // Subject has multiple courses OR no course at all (GE) - it's shared
        return true;
    };

    // Get available courses for a subject (either from courses relationship or from setup)
    const getCoursesForSubject = (subject: Subject): Course[] => {
        if (subject.courses && subject.courses.length > 0) {
            // Return only courses that are in this setup
            const setupCourseIds = setup.courses?.map((c) => c.id) || [];
            return subject.courses.filter((c) => setupCourseIds.includes(c.id));
        }
        // GE subject - available for all courses in the setup
        return setup.courses || [];
    };

    // Generate a course group code (e.g., "CS" for BSCS, "CS+IT" for BSCS+BSIT)
    const getCourseGroupCode = (courseIds: number[]): string => {
        if (courseIds.length === 0) return '';
        const courses = (setup.courses || []).filter((c) =>
            courseIds.includes(c.id),
        );
        const codes = courses.map((c) => {
            // Extract suffix: BSCS -> CS, BSIT -> IT, BLIS -> IS
            const match = c.code.match(/^(BS|BA|B)?(.+)$/i);
            return match ? match[2] : c.code;
        });
        const uniqueCodes = [...new Set(codes)].sort();
        return uniqueCodes.join('+');
    };

    // Generate display code for a subject block
    // For separate blocks (single course), include course suffix to differentiate
    // For parallel blocks (multiple courses), just use the base code
    const generateDisplayCode = (
        subject: Subject,
        courseIds: number[],
        blockNumber: number,
    ): string => {
        const baseCode = subject.code.replace(/\s+/g, '');
        const paddedBlock = blockNumber.toString().padStart(2, '0');

        // Add course suffix for separate blocks (single course assignment)
        if (courseIds.length === 1) {
            const courseGroupCode = getCourseGroupCode(courseIds);
            return `${baseCode}${courseGroupCode}${paddedBlock}`;
        }
        return `${baseCode}${paddedBlock}`;
    };

    // Faculty form (for the entire setup)
    const facultyForm = useForm<{
        faculty: Array<{
            user_id: number;
            max_units: number;
            preferred_day_off: string | null;
            preferred_day_off_time: 'morning' | 'afternoon' | 'wholeday' | null;
            preferred_time_period: string | null;
        }>;
    }>({
        faculty:
            setup.faculty?.map((f) => ({
                user_id: f.user_id,
                max_units: f.max_units,
                preferred_day_off: f.preferred_day_off || null,
                preferred_day_off_time: f.preferred_day_off_time as 'morning' | 'afternoon' | 'wholeday' | null || 'wholeday',
                preferred_time_period: f.preferred_time_period || null,
            })) || [],
    });

    // Assignment form
    const assignmentForm = useForm<{
        assignments: Array<{
            academic_setup_subject_id: number;
            user_id: number;
        }>;
    }>({
        assignments:
            currentYearLevel.subjects?.flatMap(
                (s) =>
                    s.faculty_assignments?.map((a) => ({
                        academic_setup_subject_id: s.id,
                        user_id: a.user_id,
                    })) || [],
            ) || [],
    });

    // Reset forms when year level changes
    useEffect(() => {
        // Reset subject form with new year level data
        const newSubjects =
            currentYearLevel.subjects?.map((s) => ({
                subject_id: s.subject_id,
                course_ids:
                    s.courses?.map((c) => c.id) ||
                    (s.course_id ? [s.course_id] : []),
                block_number: s.block_number ?? 1,
                expected_students: s.expected_students,
                needs_lab: s.needs_lab,
                preferred_lecture_room_id: s.preferred_lecture_room_id ?? null,
                preferred_lab_room_id: s.preferred_lab_room_id ?? null,
            })) || [];

        subjectForm.setData({
            section_count: currentYearLevel.section_count || 1,
            subjects: newSubjects
        });
        subjectForm.reset('subjects');

        // Reset assignment form with new year level data
        const newAssignments =
            currentYearLevel.subjects?.flatMap(
                (s) =>
                    s.faculty_assignments?.map((a) => ({
                        academic_setup_subject_id: s.id,
                        user_id: a.user_id,
                    })) || [],
            ) || [];

        assignmentForm.setData('assignments', newAssignments);
        assignmentForm.reset('assignments');

        // Reset search fields
        setSubjectSearch('');
        setFacultySearch('');
        setActiveTab('subjects');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentYearLevel.id]);

    // Open the add subject dialog for shared subjects (only show uncovered courses)
    const openAddSubjectDialog = (subject: Subject) => {
        const uncoveredCourseIds = getUncoveredCourseIds(subject);
        setAddSubjectDialog({
            open: true,
            subject,
            selectedCourseIds: uncoveredCourseIds, // Only pre-select uncovered courses
            fusionMode: uncoveredCourseIds.length > 1 ? 'separate' : 'separate', // Default to separate
        });
    };

    // Confirm adding a shared subject based on dialog choices
    const confirmAddSubject = () => {
        const { subject, selectedCourseIds, fusionMode } = addSubjectDialog;
        if (!subject || selectedCourseIds.length === 0) return;

        const hasLabHours = subject.lab_hours > 0;

        if (fusionMode === 'fused') {
            // Add fused blocks for each section/block number
            const newSubjects: typeof subjectForm.data.subjects = [];
            for (let i = 1; i <= subjectForm.data.section_count; i++) {
                newSubjects.push({
                    subject_id: subject.id,
                    course_ids: selectedCourseIds,
                    block_number: i,
                    expected_students: currentYearLevel.expected_students,
                    needs_lab: hasLabHours,
                    preferred_lecture_room_id: null,
                    preferred_lab_room_id: null,
                });
            }

            subjectForm.setData('subjects', [
                ...subjectForm.data.subjects,
                ...newSubjects,
            ]);
        } else {
            // Add separate blocks for each selected course, for ALL blocks
            const newSubjects: typeof subjectForm.data.subjects = [];

            selectedCourseIds.forEach(courseId => {
                for (let i = 1; i <= subjectForm.data.section_count; i++) {
                    newSubjects.push({
                        subject_id: subject.id,
                        course_ids: [courseId],
                        block_number: i,
                        expected_students: currentYearLevel.expected_students,
                        needs_lab: hasLabHours,
                        preferred_lecture_room_id: null,
                        preferred_lab_room_id: null,
                    });
                }
            });

            subjectForm.setData('subjects', [
                ...subjectForm.data.subjects,
                ...newSubjects,
            ]);
        }

        setAddSubjectDialog({
            open: false,
            subject: null,
            selectedCourseIds: [],
            fusionMode: 'separate',
        });
    };

    // Add a non-shared subject directly
    const addSubjectDirect = (
        subjectId: number,
        courseIds: number[] = [],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _blockNumber: number = 1,
    ) => {
        const subject = subjects.find((s) => s.id === subjectId);
        if (!subject) return;

        const hasLabHours = subject.lab_hours > 0;
        const newBlocks: typeof subjectForm.data.subjects = [];
        // Check if this exact combination already exists for ANY block
        // Actually, we should check per block.
        // But for "addDirect", we usually come from the sidebar where we just click "+"
        // So we should add specific blocks 1..N

        for (let i = 1; i <= subjectForm.data.section_count; i++) {
            const key = `${subjectId}-${courseIds.sort().join(',')}-${i}`;
            const exists = subjectForm.data.subjects.find((s) => {
                const existingKey = `${s.subject_id}-${s.course_ids.sort().join(',')}-${s.block_number}`;
                return existingKey === key;
            });

            if (!exists) {
                newBlocks.push({
                    subject_id: subjectId,
                    course_ids: courseIds,
                    block_number: i,
                    expected_students: currentYearLevel.expected_students,
                    needs_lab: hasLabHours,
                    preferred_lecture_room_id: null,
                    preferred_lab_room_id: null,
                });
            }
        }

        if (newBlocks.length > 0) {
            subjectForm.setData('subjects', [
                ...subjectForm.data.subjects,
                ...newBlocks,
            ]);
        }
    };

    // Add another block for an existing subject-courses combination
    // const addBlock = (subjectId: number, courseIds: number[]) => {
    //     // Find the highest block number for this subject-courses combination
    //     const courseKey = courseIds.sort().join(',');
    //     const existingBlocks = subjectForm.data.subjects
    //         .filter(
    //             (s) =>
    //                 s.subject_id === subjectId &&
    //                 s.course_ids.sort().join(',') === courseKey,
    //         )
    //         .map((s) => s.block_number);
    //     const nextBlock =
    //         existingBlocks.length > 0 ? Math.max(...existingBlocks) + 1 : 1;
    //     addSubjectDirect(subjectId, courseIds, nextBlock);
    // };

    // Remove a specific subject-courses-block combination
    const removeSubject = (
        subjectId: number,
        blockNumber: number,
        courseIds: number[],
    ) => {
        const courseKey = courseIds.sort().join(',');
        subjectForm.setData(
            'subjects',
            subjectForm.data.subjects.filter((s) => {
                const key = s.course_ids.sort().join(',');
                return !(
                    s.subject_id === subjectId &&
                    key === courseKey &&
                    s.block_number === blockNumber
                );
            }),
        );
    };

    // Get courses that are already covered for a subject
    const getCoveredCourseIds = (subjectId: number): number[] => {
        const covered: number[] = [];
        subjectForm.data.subjects
            .filter((s) => s.subject_id === subjectId)
            .forEach((s) => {
                s.course_ids.forEach((id) => {
                    if (!covered.includes(id)) covered.push(id);
                });
            });
        return covered;
    };

    // Get courses that still need to be added for a subject
    const getUncoveredCourseIds = (subject: Subject): number[] => {
        const availableCourses = getCoursesForSubject(subject);
        const coveredIds = getCoveredCourseIds(subject.id);
        return availableCourses
            .filter((c) => !coveredIds.includes(c.id))
            .map((c) => c.id);
    };

    // Check if ALL applicable courses have been covered for a subject
    const isFullyCovered = (subject: Subject): boolean => {
        if (!isSharedSubject(subject)) {
            // Non-shared subjects: just check if any block exists
            return subjectForm.data.subjects.some(
                (s) => s.subject_id === subject.id,
            );
        }
        // Shared subjects: check if all applicable courses are covered
        const uncovered = getUncoveredCourseIds(subject);
        return uncovered.length === 0;
    };

    // Get course names by IDs
    const getCourseNames = (courseIds: number[]): string => {
        if (courseIds.length === 0) return 'All';
        const courses = (setup.courses || []).filter((c) =>
            courseIds.includes(c.id),
        );
        return courses.map((c) => c.code).join(' + ') || 'Unknown';
    };

    // Toggle course selection in dialog
    const toggleCourseInDialog = (courseId: number) => {
        setAddSubjectDialog((prev) => {
            const isSelected = prev.selectedCourseIds.includes(courseId);
            return {
                ...prev,
                selectedCourseIds: isSelected
                    ? prev.selectedCourseIds.filter((id) => id !== courseId)
                    : [...prev.selectedCourseIds, courseId],
            };
        });
    };

    // Add faculty
    const addFaculty = (userId: number) => {
        if (!facultyForm.data.faculty.find((f) => f.user_id === userId)) {
            facultyForm.setData('faculty', [
                ...facultyForm.data.faculty,
                {
                    user_id: userId,
                    max_units: 24,
                    preferred_day_off: null,
                    preferred_day_off_time: 'wholeday',
                    preferred_time_period: null,
                },
            ]);
        }
    };

    // Remove faculty and also remove their assignments
    const removeFaculty = (userId: number) => {
        facultyForm.setData(
            'faculty',
            facultyForm.data.faculty.filter((f) => f.user_id !== userId),
        );
        // Also remove any assignments for this faculty
        assignmentForm.setData(
            'assignments',
            assignmentForm.data.assignments.filter((a) => a.user_id !== userId),
        );
    };

    // Save subjects
    const saveSubjects = () => {
        subjectForm.post(
            `/academic-setup/${setup.id}/year-levels/${currentYearLevel.id}/subjects`,
            {
                preserveScroll: true,
                onError: (errors) => {
                    const errorMessages = Object.values(errors).flat();
                    errorMessages.forEach((msg) => toast.error(String(msg)));
                },
            },
        );
    };

    // Save faculty
    const saveFaculty = () => {
        facultyForm.post(`/academic-setup/${setup.id}/faculty`, {
            preserveScroll: true,
            onError: (errors) => {
                const errorMessages = Object.values(errors).flat();
                errorMessages.forEach((msg) => toast.error(String(msg)));
            },
        });
    };

    // Save assignments
    const saveAssignments = () => {
        assignmentForm.post(
            `/academic-setup/${setup.id}/year-levels/${currentYearLevel.id}/assignments`,
            {
                preserveScroll: true,
                onError: (errors) => {
                    const errorMessages = Object.values(errors).flat();
                    errorMessages.forEach((msg) => toast.error(String(msg)));
                },
            },
        );
    };

    // Complete year level and move to next
    const completeYearLevel = () => {
        router.post(
            `/academic-setup/${setup.id}/year-levels/${currentYearLevel.id}/complete`,
            {},
            {
                preserveState: false,
                preserveScroll: false,
            },
        );
    };

    // Export setup to CSV
    const exportToCsv = () => {
        window.location.href = `/academic-setup/${setup.id}/export-csv`;
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
            validationResult: null,
        }));

        // Validate the file
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/academic-setup/${setup.id}/validate-import`, {
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

    // Perform the actual import using fetch, then refresh with Inertia
    const performImport = async () => {
        if (!importDialog.file) return;

        setImportDialog(prev => ({ ...prev, step: 'importing' }));

        const formData = new FormData();
        formData.append('file', importDialog.file);
        formData.append('skip_invalid', 'true');

        try {
            const response = await fetch(`/academic-setup/${setup.id}/import-csv`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrf_token,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            if (response.status === 419) {
                window.location.reload();
                return;
            }

            if (response.ok) {
                // Close dialog and refresh the page using Inertia
                setImportDialog({
                    open: false,
                    step: 'upload',
                    file: null,
                    validationResult: null,
                    error: null,
                });

                // Reload the current page using Inertia router
                router.visit(window.location.href, {
                    preserveScroll: false,
                    preserveState: false,
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                setImportDialog(prev => ({
                    ...prev,
                    step: 'preview',
                    error: errorData.message || 'Import failed. Please try again.',
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
            validationResult: null,
            error: null,
        });
    };

    // Toggle prospectus year selection
    const toggleProspectusYear = (year: string) => {
        setSelectedProspectusYears((prev) =>
            prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
        );
    };

    // Get filtered prospectuses based on selected years
    const filteredProspectuses = selectedProspectusYears.length > 0
        ? prospectuses.filter((p) => selectedProspectusYears.includes(p.academic_year))
        : [];

    // Find subjects with the same descriptive title but different codes across prospectuses
    // This helps detect subjects like "CSC 4: CISCO 4: WAN Solutions" and "CSP 10: Networks & Communication (CISCO 4: WAN Solutions)"
    const findMatchingSubjectsByTitle = (
        clickedSubject: ProspectusSubject,
        clickedProspectus: Prospectus
    ): Array<{ subject: ProspectusSubject; prospectus: Prospectus }> => {
        const matches: Array<{ subject: ProspectusSubject; prospectus: Prospectus }> = [];

        // Normalize the title for comparison (lowercase, remove extra spaces)
        const normalizeTitle = (title: string): string => {
            return title.toLowerCase().trim().replace(/\s+/g, ' ');
        };

        // Extract key parts of the title for fuzzy matching
        // e.g., "CISCO 4: WAN Solutions" from "Networks & Communication (CISCO 4: WAN Solutions)"
        const extractKeyPhrases = (title: string): string[] => {
            const phrases: string[] = [];
            // Match content in parentheses
            const parenMatch = title.match(/\(([^)]+)\)/g);
            if (parenMatch) {
                parenMatch.forEach(m => phrases.push(normalizeTitle(m.replace(/[()]/g, ''))));
            }
            // Also include the full normalized title
            phrases.push(normalizeTitle(title));
            return phrases;
        };

        const clickedPhrases = extractKeyPhrases(clickedSubject.name);
        const clickedNormalized = normalizeTitle(clickedSubject.name);

        filteredProspectuses.forEach(prospectus => {
            // Skip the same prospectus
            if (prospectus.id === clickedProspectus.id) return;

            prospectus.subjects.forEach(subject => {
                // Skip if same subject ID (already same subject in DB)
                if (subject.id === clickedSubject.id) return;

                // Skip if not matching year level and semester
                if (subject.year_level !== clickedSubject.year_level ||
                    subject.semester !== clickedSubject.semester) return;

                const subjectNormalized = normalizeTitle(subject.name);
                const subjectPhrases = extractKeyPhrases(subject.name);

                // Check for exact match
                if (clickedNormalized === subjectNormalized) {
                    matches.push({ subject, prospectus });
                    return;
                }

                // Check if any key phrases match
                const hasMatchingPhrase = clickedPhrases.some(cp =>
                    subjectPhrases.some(sp =>
                        cp === sp ||
                        cp.includes(sp) ||
                        sp.includes(cp)
                    )
                );

                if (hasMatchingPhrase && clickedPhrases.some(p => p.length > 10)) {
                    matches.push({ subject, prospectus });
                }
            });
        });

        return matches;
    };

    // Check if a prospectus subject is already added (directly or as part of a parallel group)
    const isProspectusSubjectAdded = (subjectId: number): boolean => {
        return subjectForm.data.subjects.some((s) =>
            s.subject_id === subjectId ||
            (s.parallel_subject_ids && s.parallel_subject_ids.includes(subjectId))
        );
    };

    // Add subject from prospectus
    const addSubjectFromProspectus = (prospectusSubject: ProspectusSubject, courseId: number, prospectus: Prospectus) => {
        const subject = subjects.find((s) => s.id === prospectusSubject.id);
        if (!subject) return;

        // Check if already added for this course
        if (subjectForm.data.subjects.some((s) => s.subject_id === prospectusSubject.id && s.course_ids.includes(courseId))) {
            return;
        }

        // First, check for subjects with the same descriptive title but different codes
        // across different prospectuses (e.g., CSC 4 in BSIT and CSP 10 in BSCS with same title)
        const matchingSubjectsByTitle = findMatchingSubjectsByTitle(prospectusSubject, prospectus);

        if (matchingSubjectsByTitle.length > 0) {
            // Found subjects with same title but different codes - show parallel subject dialog
            // Pre-select all matching items using composite keys
            const initialSelectedItems = matchingSubjectsByTitle.map(m => `${m.subject.id}-${m.prospectus.id}`);
            setParallelSubjectDialog({
                open: true,
                clickedSubject: prospectusSubject,
                clickedProspectus: prospectus,
                matchingSubjects: matchingSubjectsByTitle,
                selectedItems: initialSelectedItems,
                mode: 'separate',
            });
            return;
        }

        // Check if this subject exists in multiple prospectuses (across different courses)
        // If so, it's a shared subject and should show the dialog
        const subjectInMultipleProspectuses = filteredProspectuses.filter(
            (p) => p.subjects.some((s) => s.id === prospectusSubject.id)
        ).length > 1;

        const hasLabHours = prospectusSubject.lab_hours > 0;

        if (isSharedSubject(subject) || subjectInMultipleProspectuses) {
            // For shared subjects or subjects appearing in multiple prospectuses, open the dialog
            // Pre-select all courses that have this subject (unique course IDs only)
            const courseIdsWithSubject = [...new Set(
                filteredProspectuses
                    .filter((p) => p.subjects.some((s) => s.id === prospectusSubject.id))
                    .map((p) => p.course_id)
            )];

            setAddSubjectDialog({
                open: true,
                subject,
                selectedCourseIds: courseIdsWithSubject.filter(
                    (id) => !subjectForm.data.subjects.some(
                        (s) => s.subject_id === subject.id && s.course_ids.includes(id)
                    )
                ),
                fusionMode: 'separate',
            });
        } else {
            // For course-specific subjects, add directly
            // For course-specific subjects, add directly - generate all blocks
            const newSubjects: typeof subjectForm.data.subjects = [];
            for (let i = 1; i <= subjectForm.data.section_count; i++) {
                newSubjects.push({
                    subject_id: prospectusSubject.id,
                    course_ids: [courseId],
                    block_number: i,
                    expected_students: currentYearLevel.expected_students,
                    needs_lab: hasLabHours,
                    preferred_lecture_room_id: null,
                    preferred_lab_room_id: null,
                });
            }

            subjectForm.setData('subjects', [
                ...subjectForm.data.subjects,
                ...newSubjects
            ]);
        }
    };

    // Confirm adding parallel subjects (same title, different codes)
    const confirmAddParallelSubjects = () => {
        const { clickedSubject, clickedProspectus, matchingSubjects, selectedItems, mode } = parallelSubjectDialog;
        if (!clickedSubject || !clickedProspectus) return;

        const newSubjects: typeof subjectForm.data.subjects = [];

        // Get all selected items (clicked + matching based on composite keys)
        const selectedMatching = matchingSubjects.filter(m =>
            selectedItems.includes(`${m.subject.id}-${m.prospectus.id}`)
        );
        const allSubjects = [
            { subject: clickedSubject, prospectus: clickedProspectus },
            ...selectedMatching
        ];

        // Get all subject IDs involved in this operation
        const allInvolvedSubjectIds = [...new Set(allSubjects.map(s => s.subject.id))];

        // Filter out any existing entries for these subjects to prevent duplicates
        let filteredExistingSubjects = subjectForm.data.subjects;

        if (mode === 'parallel') {
            // Parallel mode: All selected subjects share the same schedule
            // IMPORTANT: Remove any existing separate entries for these subjects
            filteredExistingSubjects = subjectForm.data.subjects.filter(s => {
                // Remove if the subject_id matches any of the parallel subjects
                if (allInvolvedSubjectIds.includes(s.subject_id)) {
                    return false;
                }
                // Remove if any of the existing parallel_subject_ids overlap
                if (s.parallel_subject_ids && s.parallel_subject_ids.some(pid => allInvolvedSubjectIds.includes(pid))) {
                    return false;
                }
                return true;
            });

            // Deduplicate course IDs in case same course appears multiple times
            const courseIds = [...new Set(allSubjects.map(s => s.prospectus.course_id))];
            // Store unique IDs of all parallel subjects (the other subjects with different codes)
            const parallelSubjectIds = [...new Set(allSubjects.map(s => s.subject.id))];

            // Check if ANY of the parallel subjects have lab hours
            const anyHasLab = allSubjects.some(s => s.subject.lab_hours > 0);

            for (let i = 1; i <= subjectForm.data.section_count; i++) {
                // Add the clicked subject with all course IDs (fused) and parallel subject IDs
                newSubjects.push({
                    subject_id: clickedSubject.id,
                    course_ids: courseIds,
                    block_number: i,
                    expected_students: currentYearLevel.expected_students,
                    needs_lab: anyHasLab, // True if ANY parallel subject has lab hours
                    preferred_lecture_room_id: null,
                    preferred_lab_room_id: null,
                    parallel_subject_ids: parallelSubjectIds, // Store all parallel subject IDs
                });
            }

            // Get unique subject codes for the toast message
            const uniqueCodes = [...new Set(selectedMatching.map(m => m.subject.code))];
            toast.success(`Added ${clickedSubject.code} as parallel subject with ${uniqueCodes.join(', ')}`);
        } else {
            // Separate mode: Each subject gets its own schedule
            allSubjects.forEach(({ subject: ps, prospectus: p }) => {
                // Skip if already added
                if (subjectForm.data.subjects.some(s => s.subject_id === ps.id && s.course_ids.includes(p.course_id))) {
                    return;
                }

                for (let i = 1; i <= subjectForm.data.section_count; i++) {
                    newSubjects.push({
                        subject_id: ps.id,
                        course_ids: [p.course_id],
                        block_number: i,
                        expected_students: currentYearLevel.expected_students,
                        needs_lab: ps.lab_hours > 0,
                        preferred_lecture_room_id: null,
                        preferred_lab_room_id: null,
                    });
                }
            });
        }

        subjectForm.setData('subjects', [
            ...filteredExistingSubjects,
            ...newSubjects
        ]);

        setParallelSubjectDialog({
            open: false,
            clickedSubject: null,
            clickedProspectus: null,
            matchingSubjects: [],
            selectedItems: [],
            mode: 'separate',
        });
    };

    // Toggle subject in parallel selection list
    const toggleParallelSelection = (ps: ProspectusSubject, prospectus: Prospectus) => {
        setParallelSelectionItems(prev => {
            const exists = prev.some(item =>
                item.subject.id === ps.id && item.prospectus.id === prospectus.id
            );
            if (exists) {
                return prev.filter(item =>
                    !(item.subject.id === ps.id && item.prospectus.id === prospectus.id)
                );
            } else {
                return [...prev, { subject: ps, prospectus }];
            }
        });
    };

    // Check if subject is in parallel selection
    const isInParallelSelection = (subjectId: number, prospectusId: number): boolean => {
        return parallelSelectionItems.some(item =>
            item.subject.id === subjectId && item.prospectus.id === prospectusId
        );
    };

    // Confirm parallel selection - add all selected as parallel subjects
    const confirmParallelSelection = () => {
        if (parallelSelectionItems.length < 2) {
            toast.error('Select at least 2 subjects to create a parallel group');
            return;
        }

        // Get all unique subject IDs for parallel_subject_ids
        const parallelSubjectIds = [...new Set(parallelSelectionItems.map(item => item.subject.id))];

        // IMPORTANT: First, remove any existing entries that include ANY of these subjects
        // This prevents duplicates when the user previously added subjects separately
        const filteredExistingSubjects = subjectForm.data.subjects.filter(s => {
            // Remove if the subject_id matches any of the parallel subjects
            if (parallelSubjectIds.includes(s.subject_id)) {
                return false;
            }
            // Remove if any of the existing parallel_subject_ids overlap
            if (s.parallel_subject_ids && s.parallel_subject_ids.some(pid => parallelSubjectIds.includes(pid))) {
                return false;
            }
            return true;
        });

        const newSubjects: typeof subjectForm.data.subjects = [];

        // Get unique course IDs from all selected items
        const courseIds = [...new Set(parallelSelectionItems.map(item => item.prospectus.course_id))];

        // Use the first subject as the primary
        const primarySubject = parallelSelectionItems[0].subject;

        // Check if ANY of the parallel subjects have lab hours
        const anyHasLab = parallelSelectionItems.some(item => item.subject.lab_hours > 0);

        // Create blocks for each section
        for (let i = 1; i <= subjectForm.data.section_count; i++) {
            newSubjects.push({
                subject_id: primarySubject.id,
                course_ids: courseIds,
                block_number: i,
                expected_students: currentYearLevel.expected_students,
                needs_lab: anyHasLab,
                preferred_lecture_room_id: null,
                preferred_lab_room_id: null,
                parallel_subject_ids: parallelSubjectIds,
            });
        }

        subjectForm.setData('subjects', [
            ...filteredExistingSubjects,
            ...newSubjects
        ]);

        // Get subject codes for toast message
        const subjectCodes = parallelSelectionItems.map(item => item.subject.code).join(' / ');
        toast.success(`Added parallel subjects: ${subjectCodes}`);

        // Clear selection and exit parallel mode
        setParallelSelectionItems([]);
        setParallelSelectionMode(false);
    };

    // Cancel parallel selection
    const cancelParallelSelection = () => {
        setParallelSelectionItems([]);
        setParallelSelectionMode(false);
    };

    // Add all subjects from a prospectus for the current year level
    // Now includes GE subjects - they will be added with the course_id from the prospectus
    const addAllProspectusSubjects = (prospectus: Prospectus) => {
        const matchingSubjects = prospectus.subjects.filter(
            (s) =>
                s.year_level === currentYearLevel.year_level &&
                s.semester === setup.semester,
        );

        const newSubjects: typeof subjectForm.data.subjects = [];

        matchingSubjects.forEach((ps) => {
            // Skip if already added for this course
            if (subjectForm.data.subjects.some((s) => s.subject_id === ps.id && s.course_ids.includes(prospectus.course_id))) {
                return;
            }

            const subject = subjects.find((s) => s.id === ps.id);
            if (!subject) return;

            const hasLabHours = ps.lab_hours > 0;

            // Add all blocks for this subject
            for (let i = 1; i <= subjectForm.data.section_count; i++) {
                newSubjects.push({
                    subject_id: ps.id,
                    course_ids: [prospectus.course_id],
                    block_number: i,
                    expected_students: currentYearLevel.expected_students,
                    needs_lab: hasLabHours,
                    preferred_lecture_room_id: null,
                    preferred_lab_room_id: null,
                });
            }
        });

        if (newSubjects.length > 0) {
            subjectForm.setData('subjects', [...subjectForm.data.subjects, ...newSubjects]);
        }
    };

    // Toggle expanded state for academic year sections
    const toggleYearSection = (year: string) => {
        setExpandedYearSections((prev) => ({
            ...prev,
            [year]: prev[year] === undefined ? false : !prev[year],
        }));
    };

    // Get subjects that still have courses to be covered, filtered by search
    const availableSubjects = subjects.filter((s) => {
        // For shared subjects, check if there are still uncovered courses
        // For non-shared subjects, check if not added yet
        if (isFullyCovered(s)) return false;

        if (!subjectSearch) return true;
        const searchLower = subjectSearch.toLowerCase();
        return (
            s.code.toLowerCase().includes(searchLower) ||
            s.name.toLowerCase().includes(searchLower)
        );
    });

    // Group subjects by subject_id and course_ids for proper display
    const groupedSubjects = subjectForm.data.subjects.reduce(
        (acc, s) => {
            const courseKey = s.course_ids.sort().join(',');
            const key = `${s.subject_id}-${courseKey}`;
            if (!acc[key]) {
                acc[key] = {
                    subject_id: s.subject_id,
                    course_ids: s.course_ids,
                    blocks: [],
                };
            }
            acc[key].blocks.push(s);
            return acc;
        },
        {} as Record<
            string,
            {
                subject_id: number;
                course_ids: number[];
                blocks: typeof subjectForm.data.subjects;
            }
        >,
    );

    const groupedSubjectsList = Object.values(groupedSubjects).sort((a, b) => {
        const subjectA = subjects.find((s) => s.id === a.subject_id);
        const subjectB = subjects.find((s) => s.id === b.subject_id);
        return (subjectA?.code || '').localeCompare(subjectB?.code || '');
    });

    // Get faculty not yet added, filtered by search
    const availableFaculty = faculty.filter((f) => {
        const notAdded = !facultyForm.data.faculty.find(
            (fac) => fac.user_id === f.id,
        );
        if (!notAdded) return false;
        if (!facultySearch) return true;
        const searchLower = facultySearch.toLowerCase();
        const fullName = `${f.fname} ${f.mname || ''} ${f.lname}`.toLowerCase();
        return (
            fullName.includes(searchLower) ||
            f.email.toLowerCase().includes(searchLower)
        );
    });

    // Get subject details by ID
    const getSubject = (subjectId: number) =>
        subjects.find((s) => s.id === subjectId);
    const getFaculty = (userId: number) => faculty.find((f) => f.id === userId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Setup ${currentYearLevel.year_level} Year`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6 pb-20">
                {/* Floating Header */}
                <div
                    className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-3 transition-transform duration-300 md:left-64 ${showFloatingHeader ? 'translate-y-0 shadow-sm' : '-translate-y-full'
                        }`}
                >
                    <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold">
                                Setup {currentYearLevel.year_level} Year
                            </h2>
                            <div className="h-4 w-px bg-border mx-2" />
                            <p className="text-sm text-muted-foreground">
                                {setup.semester} Sem ({setup.academic_year})
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={currentYearLevel.is_configured ? 'default' : 'secondary'}>
                                {currentYearLevel.is_configured ? 'Done' : 'Pending'}
                            </Badge>
                            <Button size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                Scroll to Top
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/academic-setup">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Setup {currentYearLevel.year_level} Year
                            </h1>
                            <p className="text-muted-foreground">
                                {courseCodes} - {setup.semester} Semester (
                                {setup.academic_year})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Export/Import buttons */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToCsv}
                            title="Export setup to CSV"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImportDialog(prev => ({ ...prev, open: true }))}
                            title="Import setup from CSV"
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            Import
                        </Button>
                        <Badge
                            variant={
                                currentYearLevel.is_configured
                                    ? 'default'
                                    : 'secondary'
                            }
                        >
                            {currentYearLevel.is_configured
                                ? 'Done'
                                : 'Pending'}
                        </Badge>
                    </div>
                </div>

                {/* Year Level Progress */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {setup.year_levels?.map((yl) => (
                        <Link
                            key={yl.id}
                            href={`/academic-setup/${setup.id}/configure?year=${yl.year_level}`}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${yl.id === currentYearLevel.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : yl.is_configured
                                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                    : 'hover:bg-muted/50'
                                }`}
                        >
                            {yl.is_configured ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                                <Circle className="h-4 w-4" />
                            )}
                            {yl.year_level} Year
                        </Link>
                    ))}
                </div>

                {/* Configuration Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1"
                >
                    <TabsList>
                        <TabsTrigger value="subjects">
                            Subjects ({subjectForm.data.subjects.length})
                        </TabsTrigger>
                        <TabsTrigger value="faculty">
                            Faculty ({facultyForm.data.faculty.length})
                        </TabsTrigger>
                        <TabsTrigger value="assignments">
                            Assignments
                        </TabsTrigger>
                    </TabsList>

                    {/* Subjects Tab */}
                    <TabsContent value="subjects" className="flex-1">
                        {/* Global Block Count Configuration */}
                        <div className="mb-6 flex items-center gap-4 rounded-lg border bg-card p-4">
                            <div className="flex-1">
                                <h3 className="font-semibold">Year Level Blocks</h3>
                                <p className="text-sm text-muted-foreground">
                                    Set the number of blocks/sections for this year level. All added subjects will automatically have this many blocks assigned.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="section-count" className="whitespace-nowrap">Number of Blocks:</Label>
                                <Input
                                    id="section-count"
                                    type="number"
                                    min={1}
                                    max={20}
                                    className="w-20"
                                    value={subjectForm.data.section_count}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        const newCount = Math.max(1, Math.min(20, val));

                                        // Update section count
                                        const updatedSubjects = [...subjectForm.data.subjects];

                                        // Group existing subjects
                                        const groups = updatedSubjects.reduce((acc, s) => {
                                            const key = `${s.subject_id}-${s.course_ids.sort().join(',')}`;
                                            if (!acc[key]) acc[key] = [];
                                            acc[key].push(s);
                                            return acc;
                                        }, {} as Record<string, typeof subjectForm.data.subjects>);

                                        const finalSubjects: typeof subjectForm.data.subjects = [];

                                        Object.values(groups).forEach(group => {
                                            const baseSubject = group[0];
                                            // Keep existing blocks that are within range
                                            const keptBlocks = group.filter(s => s.block_number <= newCount);
                                            finalSubjects.push(...keptBlocks);

                                            // Add missing blocks
                                            for (let i = 1; i <= newCount; i++) {
                                                if (!keptBlocks.find(s => s.block_number === i)) {
                                                    finalSubjects.push({
                                                        ...baseSubject,
                                                        block_number: i,
                                                        preferred_lecture_room_id: baseSubject.preferred_lecture_room_id,
                                                        preferred_lab_room_id: baseSubject.preferred_lab_room_id,
                                                    });
                                                }
                                            }
                                        });

                                        subjectForm.setData({
                                            section_count: newCount,
                                            subjects: finalSubjects
                                        });
                                    }}
                                />
                            </div>
                        </div>

                        {/* Prospectus-Based Subject Selection */}
                        {prospectusYears.length > 0 && (
                            <div className="rounded-lg border bg-card p-4 mb-6">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Book className="h-4 w-4 text-primary" />
                                        <h3 className="font-semibold">Load Subjects from Prospectus</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Select a curriculum prospectus year to quickly add subjects for {currentYearLevel.year_level} Year, {setup.semester} Semester.
                                    </p>
                                </div>

                                {/* Prospectus Year Selection */}
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium">Select Prospectus:</span>
                                        {prospectusYears.map((year) => (
                                            <Badge
                                                key={year}
                                                variant={selectedProspectusYears.includes(year) ? 'default' : 'outline'}
                                                className="cursor-pointer"
                                                onClick={() => toggleProspectusYear(year)}
                                            >
                                                {selectedProspectusYears.includes(year) && (
                                                    <Check className="h-3 w-3 mr-1" />
                                                )}
                                                {year}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Unshow Minors Toggle */}
                                    {selectedProspectusYears.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="show-minors"
                                                checked={showMinorSubjects}
                                                onCheckedChange={(checked) => setShowMinorSubjects(!!checked)}
                                            />
                                            <Label
                                                htmlFor="show-minors"
                                                className="text-sm cursor-pointer"
                                            >
                                                Show Minor/GE Subjects
                                            </Label>
                                        </div>
                                    )}

                                    {/* Parallel Selection Mode Toggle */}
                                    {selectedProspectusYears.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="parallel-mode"
                                                checked={parallelSelectionMode}
                                                onCheckedChange={(checked) => {
                                                    setParallelSelectionMode(!!checked);
                                                    if (!checked) {
                                                        setParallelSelectionItems([]);
                                                    }
                                                }}
                                            />
                                            <Label
                                                htmlFor="parallel-mode"
                                                className="text-sm cursor-pointer flex items-center gap-1"
                                            >
                                                <Link2 className="h-3.5 w-3.5" />
                                                Parallel Selection Mode
                                            </Label>
                                        </div>
                                    )}
                                </div>

                                {/* Parallel Selection Info Banner */}
                                {parallelSelectionMode && (
                                    <div className="mb-4 rounded-lg border border-primary/50 bg-primary/5 p-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <Link2 className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="text-sm font-medium">Parallel Selection Mode Active</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Click on subjects to select them for parallel grouping. Select at least 2 subjects.
                                                    </p>
                                                </div>
                                            </div>
                                            {parallelSelectionItems.length > 0 && (
                                                <Badge variant="default" className="text-xs">
                                                    {parallelSelectionItems.length} selected
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Selected Items Preview */}
                                        {parallelSelectionItems.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-primary/20">
                                                <p className="text-xs font-medium mb-2">Selected for parallel:</p>
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {parallelSelectionItems.map((item) => (
                                                        <Badge
                                                            key={`${item.subject.id}-${item.prospectus.id}`}
                                                            variant="secondary"
                                                            className="text-xs cursor-pointer hover:bg-destructive/20"
                                                            onClick={() => toggleParallelSelection(item.subject, item.prospectus)}
                                                            title="Click to remove"
                                                        >
                                                            {item.subject.code}
                                                            <span className="text-muted-foreground ml-1">({item.prospectus.course_code})</span>
                                                            <Trash2 className="h-3 w-3 ml-1" />
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={confirmParallelSelection}
                                                        disabled={parallelSelectionItems.length < 2}
                                                    >
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Confirm Parallel ({parallelSelectionItems.length})
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={cancelParallelSelection}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Prospectus Subjects Display - Side by Side */}
                                {selectedProspectusYears.length > 0 ? (
                                    <div className="space-y-6">
                                        {/* Group by academic year */}
                                        {selectedProspectusYears.sort().reverse().map((year) => {
                                            const yearProspectuses = filteredProspectuses.filter(
                                                (p) => p.academic_year === year
                                            );

                                            if (yearProspectuses.length === 0) return null;

                                            return (
                                                <div key={year} className="rounded-lg border bg-muted/20 overflow-hidden">
                                                    {/* Year Header - Collapsible */}
                                                    <div
                                                        className="bg-muted/50 px-4 py-2 border-b cursor-pointer hover:bg-muted/70 transition-colors"
                                                        onClick={() => toggleYearSection(year)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {(expandedYearSections[year] ?? true) ? (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4" />
                                                                )}
                                                                <span className="font-semibold text-sm">{year} Curriculum</span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {yearProspectuses.length} course(s)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Side-by-Side Courses - Collapsible */}
                                                    {(expandedYearSections[year] ?? true) && (
                                                        <div className="p-3">
                                                            <div
                                                                className="grid gap-4"
                                                                style={{
                                                                    gridTemplateColumns: `repeat(${Math.min(yearProspectuses.length, 4)}, minmax(200px, 1fr))`
                                                                }}
                                                            >
                                                                {yearProspectuses.map((prospectus) => {
                                                                    const prospSubjects = prospectus.subjects.filter(
                                                                        (s) => {
                                                                            // Filter by year level and semester
                                                                            if (s.year_level !== currentYearLevel.year_level || s.semester !== setup.semester) {
                                                                                return false;
                                                                            }

                                                                            // Filter minor/GE subjects if hidden
                                                                            // We need to resolve the full subject object to check isSharedSubject
                                                                            const realSubject = subjects.find(sub => sub.id === s.id);
                                                                            if (!showMinorSubjects && realSubject && isSharedSubject(realSubject)) {
                                                                                return false;
                                                                            }

                                                                            return true;
                                                                        }
                                                                    );
                                                                    const addedCount = prospSubjects.filter((s) =>
                                                                        isProspectusSubjectAdded(s.id)
                                                                    ).length;

                                                                    return (
                                                                        <div
                                                                            key={prospectus.id}
                                                                            className="rounded-lg border bg-background"
                                                                        >
                                                                            {/* Course Header */}
                                                                            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-semibold text-sm">
                                                                                        {prospectus.course_code}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        ({prospSubjects.length})
                                                                                    </span>
                                                                                </div>
                                                                                {/* <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-7 text-xs"
                                                                                    onClick={() => addAllProspectusSubjects(prospectus)}
                                                                                    disabled={addedCount === prospSubjects.length || prospSubjects.length === 0}
                                                                                >
                                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                                    Add All
                                                                                </Button> */}
                                                                            </div>

                                                                            {/* Subject List */}
                                                                            <div className="p-2 max-h-75 overflow-y-auto space-y-1">
                                                                                {prospSubjects.length > 0 ? (
                                                                                    prospSubjects
                                                                                        .sort((a, b) => a.sort_order - b.sort_order)
                                                                                        .map((ps) => {
                                                                                            const isAdded = isProspectusSubjectAdded(ps.id);
                                                                                            const subject = subjects.find((s) => s.id === ps.id);
                                                                                            const isShared = subject ? isSharedSubject(subject) : false;
                                                                                            const isSelectedForParallel = isInParallelSelection(ps.id, prospectus.id);

                                                                                            // In parallel mode, show checkboxes
                                                                                            if (parallelSelectionMode) {
                                                                                                return (
                                                                                                    <div
                                                                                                        key={ps.id}
                                                                                                        className={`flex items-center gap-2 rounded-md border p-2 text-xs cursor-pointer transition-colors ${isAdded
                                                                                                            ? 'bg-muted/30 border-muted opacity-50'
                                                                                                            : isSelectedForParallel
                                                                                                                ? 'bg-primary/10 border-primary/50'
                                                                                                                : 'hover:bg-muted/50'
                                                                                                            }`}
                                                                                                        onClick={() => {
                                                                                                            if (!isAdded) {
                                                                                                                toggleParallelSelection(ps, prospectus);
                                                                                                            }
                                                                                                        }}
                                                                                                    >
                                                                                                        <Checkbox
                                                                                                            checked={isSelectedForParallel}
                                                                                                            disabled={isAdded}
                                                                                                            onCheckedChange={() => {
                                                                                                                if (!isAdded) {
                                                                                                                    toggleParallelSelection(ps, prospectus);
                                                                                                                }
                                                                                                            }}
                                                                                                            className="shrink-0"
                                                                                                        />
                                                                                                        <div className="flex-1 min-w-0">
                                                                                                            <div className="flex items-center gap-1">
                                                                                                                <span className="font-medium truncate">{ps.code}</span>
                                                                                                                {isShared && (
                                                                                                                    <Badge variant="outline" className="text-[10px] px-1 py-0">GE</Badge>
                                                                                                                )}
                                                                                                                {isAdded && (
                                                                                                                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Added</Badge>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <p className="text-muted-foreground truncate" title={ps.name}>
                                                                                                                {ps.name}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            }

                                                                                            // Normal mode - original behavior
                                                                                            return (
                                                                                                <div
                                                                                                    key={ps.id}
                                                                                                    className={`flex items-center justify-between rounded-md border p-2 text-xs ${isAdded
                                                                                                        ? 'bg-primary/10 border-primary/50'
                                                                                                        : 'hover:bg-muted/50'
                                                                                                        }`}
                                                                                                >
                                                                                                    <div className="flex-1 min-w-0 pr-2">
                                                                                                        <div className="flex items-center gap-1">
                                                                                                            <span className="font-medium truncate">{ps.code}</span>
                                                                                                            {isShared && (
                                                                                                                <Badge variant="outline" className="text-[10px] px-1 py-0">GE</Badge>
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <p className="text-muted-foreground truncate" title={ps.name}>
                                                                                                            {ps.name}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        variant={isAdded ? 'ghost' : 'outline'}
                                                                                                        className="h-6 w-6 p-0 shrink-0"
                                                                                                        onClick={() => addSubjectFromProspectus(ps, prospectus.course_id, prospectus)}
                                                                                                        disabled={isAdded}
                                                                                                    >
                                                                                                        {isAdded ? (
                                                                                                            <Check className="h-3 w-3 text-primary" />
                                                                                                        ) : (
                                                                                                            <Plus className="h-3 w-3" />
                                                                                                        )}
                                                                                                    </Button>
                                                                                                </div>
                                                                                            );
                                                                                        })
                                                                                ) : (
                                                                                    <div className="text-center py-4 text-muted-foreground text-xs">
                                                                                        No subjects for this semester
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Progress indicator */}
                                                                            {prospSubjects.length > 0 && (
                                                                                <div className="px-3 py-2 border-t bg-muted/20">
                                                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                                        <span>{addedCount} / {prospSubjects.length} added</span>
                                                                                        {addedCount === prospSubjects.length && (
                                                                                            <Badge variant="default" className="text-[10px]">
                                                                                                <Check className="h-2 w-2 mr-1" />
                                                                                                Complete
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                                        <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">
                                            Select a prospectus year above to view and add subjects.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid gap-6">
                            {/* Available Subjects - Hidden but functionality preserved
                               Set showAvailableSubjects to true to re-enable this section */}
                            {showAvailableSubjects && <div className="rounded-lg border bg-card p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Available Subjects
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {availableSubjects.length} subjects
                                    </span>
                                </div>
                                <div className="relative mb-3">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search subjects..."
                                        value={subjectSearch}
                                        onChange={(e) =>
                                            setSubjectSearch(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                                <div className="max-h-87.5 space-y-2 overflow-y-auto">
                                    {availableSubjects.map((subject) => {
                                        const assignedInYear =
                                            subjectsInOtherYears[subject.id];
                                        const uncoveredCourseIds =
                                            getUncoveredCourseIds(subject);
                                        const coveredCourseIds =
                                            getCoveredCourseIds(subject.id);
                                        const isPartiallyAdded =
                                            coveredCourseIds.length > 0;

                                        return (
                                            <div
                                                key={subject.id}
                                                className={`flex items-center justify-between rounded-lg border p-3 ${assignedInYear
                                                    ? 'border-muted bg-muted/30 opacity-60'
                                                    : isPartiallyAdded
                                                        ? 'border-dashed border-primary/50 bg-primary/5'
                                                        : 'hover:bg-muted/50'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-medium">
                                                            {subject.code}
                                                        </p>
                                                        {/* Show uncovered courses (highlighted) */}
                                                        {isSharedSubject(
                                                            subject,
                                                        ) &&
                                                            isPartiallyAdded ? (
                                                            <>
                                                                {uncoveredCourseIds.map(
                                                                    (id) => {
                                                                        const course =
                                                                            setup.courses?.find(
                                                                                (
                                                                                    c,
                                                                                ) =>
                                                                                    c.id ===
                                                                                    id,
                                                                            );
                                                                        return course ? (
                                                                            <Badge
                                                                                key={
                                                                                    id
                                                                                }
                                                                                variant="default"
                                                                                className="text-xs"
                                                                            >
                                                                                {
                                                                                    course.code
                                                                                }
                                                                            </Badge>
                                                                        ) : null;
                                                                    },
                                                                )}
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs opacity-50"
                                                                >
                                                                    +
                                                                    {
                                                                        coveredCourseIds.length
                                                                    }{' '}
                                                                    added
                                                                </Badge>
                                                            </>
                                                        ) : subject.courses &&
                                                            subject.courses
                                                                .length > 0 ? (
                                                            subject.courses.map(
                                                                (c) => (
                                                                    <Badge
                                                                        key={
                                                                            c.id
                                                                        }
                                                                        variant="default"
                                                                        className="text-xs"
                                                                    >
                                                                        {c.code}
                                                                    </Badge>
                                                                ),
                                                            )
                                                        ) : subject.course ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {
                                                                    subject
                                                                        .course
                                                                        .code
                                                                }
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                GE
                                                            </Badge>
                                                        )}
                                                        {subject.lab_hours >
                                                            0 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    Lab
                                                                </Badge>
                                                            )}
                                                        {assignedInYear && (
                                                            <Badge
                                                                variant="destructive"
                                                                className="text-xs"
                                                            >
                                                                In{' '}
                                                                {assignedInYear}{' '}
                                                                Year
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {subject.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {subject.units} units |{' '}
                                                        {subject.lecture_hours}L
                                                        + {subject.lab_hours}Lab
                                                    </p>
                                                </div>
                                                {!assignedInYear &&
                                                    (isSharedSubject(subject) &&
                                                        setup.courses &&
                                                        setup.courses.length > 1 ? (
                                                        <Button
                                                            size="sm"
                                                            variant={
                                                                isPartiallyAdded
                                                                    ? 'outline'
                                                                    : 'default'
                                                            }
                                                            onClick={() =>
                                                                openAddSubjectDialog(
                                                                    subject,
                                                                )
                                                            }
                                                            title={
                                                                isPartiallyAdded
                                                                    ? 'Add for remaining courses'
                                                                    : 'Choose how to add this subject'
                                                            }
                                                        >
                                                            <Plus className="mr-1 h-4 w-4" />
                                                            {isPartiallyAdded
                                                                ? `Add ${uncoveredCourseIds.length}`
                                                                : 'Add'}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                addSubjectDirect(
                                                                    subject.id,
                                                                    subject.course_id
                                                                        ? [
                                                                            subject.course_id,
                                                                        ]
                                                                        : [],
                                                                )
                                                            }
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    ))}
                                            </div>
                                        );
                                    })}
                                    {availableSubjects.length === 0 && (
                                        <p className="py-4 text-center text-muted-foreground">
                                            {subjectSearch
                                                ? 'No subjects match your search'
                                                : 'All subjects have been added'}
                                        </p>
                                    )}
                                </div>
                            </div>}

                            {/* Selected Subjects */}
                            <div className="rounded-lg border bg-card p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Selected Subjects
                                    </h3>
                                </div>
                                <div className="max-h-100 space-y-3 overflow-y-auto">
                                    {groupedSubjectsList.map((group) => {
                                        const subject = getSubject(
                                            group.subject_id,
                                        );
                                        const blocks = group.blocks.sort(
                                            (a, b) =>
                                                a.block_number - b.block_number,
                                        );
                                        const courseNames = getCourseNames(
                                            group.course_ids,
                                        );
                                        const isShared = subject
                                            ? isSharedSubject(subject)
                                            : false;
                                        const isFused =
                                            group.course_ids.length > 1;
                                        const courseKey = group.course_ids
                                            .sort()
                                            .join(',');

                                        // Check if any block in this group has parallel subjects
                                        const hasParallelSubjects = blocks.some(
                                            (b) => b.parallel_subject_ids && b.parallel_subject_ids.length > 1
                                        );

                                        // Get parallel subject codes for display
                                        const parallelSubjectCodes = hasParallelSubjects
                                            ? blocks[0]?.parallel_subject_ids
                                                ?.map((pid: number) => subjects.find((s) => s.id === pid)?.code)
                                                .filter(Boolean)
                                                .join(' / ')
                                            : null;

                                        // Get common descriptive title for parallel subjects
                                        const getParallelDescriptiveTitle = (): string => {
                                            if (!hasParallelSubjects || !blocks[0]?.parallel_subject_ids) {
                                                return subject?.name ?? '';
                                            }
                                            const parallelSubjects = blocks[0].parallel_subject_ids
                                                .map((pid: number) => subjects.find((s) => s.id === pid))
                                                .filter(Boolean);
                                            if (parallelSubjects.length === 0) return subject?.name ?? '';

                                            const names = parallelSubjects.map((s) => s?.name || '');

                                            // 1. Check if all names are identical
                                            const uniqueNames = [...new Set(names)];
                                            if (uniqueNames.length === 1) {
                                                return uniqueNames[0];
                                            }

                                            // 2. Check if they share a common "base" name (before parentheses)
                                            // e.g. "Software Eng (Lec)" and "Software Eng (Lab)" -> "Software Eng"
                                            const baseNames = names.map(name => name.split('(')[0].trim());
                                            const uniqueBaseNames = [...new Set(baseNames)];
                                            if (uniqueBaseNames.length === 1 && uniqueBaseNames[0].length > 0) {
                                                return uniqueBaseNames[0];
                                            }

                                            // 3. Look for common content in parentheses (fallback)
                                            // Only if the base names were different
                                            const commonPhrases: string[] = [];
                                            names.forEach((name) => {
                                                const match = name.match(/\(([^)]+)\)/);
                                                if (match) commonPhrases.push(match[1]);
                                            });

                                            const uniquePhrases = [...new Set(commonPhrases)];
                                            if (uniquePhrases.length === 1 && commonPhrases.length === names.length) {
                                                return uniquePhrases[0]; // This was returning "486 hours" previously
                                            }

                                            return subject?.name ?? '';
                                        };

                                        return (
                                            <div
                                                key={`${group.subject_id}-${courseKey}`}
                                                className="space-y-2 rounded-lg border p-3"
                                            >
                                                {/* Subject Header */}
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-medium">
                                                                {hasParallelSubjects ? parallelSubjectCodes : subject?.code}
                                                            </p>
                                                            {isShared &&
                                                                group.course_ids
                                                                    .length >
                                                                0 && (
                                                                    <Badge
                                                                        variant={
                                                                            isFused
                                                                                ? 'default'
                                                                                : 'secondary'
                                                                        }
                                                                        className="text-xs"
                                                                        title={
                                                                            isFused
                                                                                ? 'Fused courses share this block'
                                                                                : 'Separate course block'
                                                                        }
                                                                    >
                                                                        {isFused && (
                                                                            <Link2 className="mr-1 h-3 w-3" />
                                                                        )}
                                                                        {
                                                                            courseNames
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            {isShared &&
                                                                group.course_ids
                                                                    .length ===
                                                                0 && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        GE
                                                                    </Badge>
                                                                )}
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {blocks.length}{' '}
                                                                block
                                                                {blocks.length >
                                                                    1
                                                                    ? 's'
                                                                    : ''}
                                                            </Badge>
                                                            {subject &&
                                                                subject.lab_hours >
                                                                0 && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        Lab
                                                                    </Badge>
                                                                )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {hasParallelSubjects ? getParallelDescriptiveTitle() : subject?.name}
                                                        </p>
                                                    </div>
                                                    {/* <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            addBlock(
                                                                group.subject_id,
                                                                group.course_ids,
                                                            )
                                                        }
                                                        title="Add another block"
                                                    >
                                                        <Copy className="mr-1 h-3 w-3" />
                                                        Add Block
                                                    </Button> */}
                                                </div>

                                                {/* Blocks */}
                                                <div className="space-y-2 border-l-2 border-muted pl-2">
                                                    {blocks.map((block) => {
                                                        const blockCourseKey =
                                                            block.course_ids
                                                                .sort()
                                                                .join(',');
                                                        const blockIndex =
                                                            subjectForm.data.subjects.findIndex(
                                                                (s) =>
                                                                    s.subject_id ===
                                                                    group.subject_id &&
                                                                    s.course_ids
                                                                        .sort()
                                                                        .join(
                                                                            ',',
                                                                        ) ===
                                                                    blockCourseKey &&
                                                                    s.block_number ===
                                                                    block.block_number,
                                                            );
                                                        // Check if this is a parallel subject block (different codes, same content)
                                                        const hasParallelSubjects = block.parallel_subject_ids && block.parallel_subject_ids.length > 1;

                                                        // Generate display code for this block
                                                        // For parallel subjects, show combined codes like "CSC401/CSP1001"
                                                        let blockCode = '';
                                                        if (hasParallelSubjects && subject && block.parallel_subject_ids) {
                                                            // Get all parallel subject codes
                                                            const parallelCodes = block.parallel_subject_ids
                                                                .map(pid => {
                                                                    const pSubject = subjects.find(s => s.id === pid);
                                                                    if (pSubject) {
                                                                        return `${pSubject.code.replace(/\s+/g, '')}${block.block_number.toString().padStart(2, '0')}`;
                                                                    }
                                                                    return null;
                                                                })
                                                                .filter(Boolean);
                                                            blockCode = parallelCodes.join('/');
                                                        } else if (subject) {
                                                            blockCode = generateDisplayCode(
                                                                subject,
                                                                block.course_ids,
                                                                block.block_number,
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={`${group.subject_id}-${courseKey}-${block.block_number}`}
                                                                className="ml-2 rounded-md bg-muted/30 p-2"
                                                            >
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge
                                                                                variant={hasParallelSubjects ? "secondary" : "default"}
                                                                                className="font-mono text-xs"
                                                                            >
                                                                                {blockCode}
                                                                            </Badge>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Block {block.block_number}
                                                                            </span>
                                                                            {/* Show course for single course block */}
                                                                            {block.course_ids.length === 1 && !hasParallelSubjects && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {getCourseNames(block.course_ids)}
                                                                                </Badge>
                                                                            )}
                                                                            {/* Show combined courses badge for parallel blocks */}
                                                                            {block.course_ids.length > 1 && (
                                                                                <Badge
                                                                                    variant="default"
                                                                                    className="text-xs"
                                                                                >
                                                                                    <Link2 className="mr-1 h-3 w-3" />
                                                                                    {getCourseNames(block.course_ids)}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {/* For parallel subjects (different codes, same content), show subject codes */}
                                                                        {hasParallelSubjects && (
                                                                            <div className="flex flex-wrap items-center gap-1 ml-1">
                                                                                <span className="text-[10px] text-muted-foreground">Parallel subjects:</span>
                                                                                {block.parallel_subject_ids?.map((pid) => {
                                                                                    const pSubject = subjects.find(s => s.id === pid);
                                                                                    return pSubject ? (
                                                                                        <Badge
                                                                                            key={pid}
                                                                                            variant="outline"
                                                                                            className="text-[10px] font-mono px-1 py-0"
                                                                                        >
                                                                                            {pSubject.code}
                                                                                        </Badge>
                                                                                    ) : null;
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                        {/* For fused blocks (multiple courses, same subject), show course combinations */}
                                                                        {block.course_ids.length > 1 && !hasParallelSubjects && subject && (
                                                                            <div className="flex flex-wrap items-center gap-1 ml-1">
                                                                                <span className="text-[10px] text-muted-foreground">Combines:</span>
                                                                                {block.course_ids.map((cid) => (
                                                                                    <Badge
                                                                                        key={cid}
                                                                                        variant="outline"
                                                                                        className="text-[10px] font-mono px-1 py-0"
                                                                                    >
                                                                                        {subject.code.replace(/\s+/g, '')}{getCourseGroupCode([cid])}{block.block_number.toString().padStart(2, '0')}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 text-destructive"
                                                                        onClick={() =>
                                                                            removeSubject(
                                                                                group.subject_id,
                                                                                block.block_number,
                                                                                group.course_ids,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-xs">
                                                                            Students:
                                                                        </Label>
                                                                        <Input
                                                                            type="number"
                                                                            className="h-7 w-16 text-xs"
                                                                            value={
                                                                                block.expected_students
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) => {
                                                                                const newSubjects =
                                                                                    [
                                                                                        ...subjectForm
                                                                                            .data
                                                                                            .subjects,
                                                                                    ];
                                                                                newSubjects[
                                                                                    blockIndex
                                                                                ].expected_students =
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                    40;
                                                                                subjectForm.setData(
                                                                                    'subjects',
                                                                                    newSubjects,
                                                                                );
                                                                            }}
                                                                        />
                                                                    </div>

                                                                </div>
                                                                {/* Preferred Room Selection */}
                                                                {rooms.length > 0 && (
                                                                    <div className="mt-2 flex flex-wrap items-center gap-3 border-t pt-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <Label className="text-xs whitespace-nowrap">
                                                                                Lec Room:
                                                                            </Label>
                                                                            <Select
                                                                                value={block.preferred_lecture_room_id?.toString() || 'none'}
                                                                                onValueChange={(value) => {
                                                                                    const newSubjects = [...subjectForm.data.subjects];
                                                                                    newSubjects[blockIndex].preferred_lecture_room_id = value === 'none' ? null : parseInt(value);
                                                                                    subjectForm.setData('subjects', newSubjects);
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="h-7 w-28 text-xs">
                                                                                    <SelectValue placeholder="Any" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="none">Any</SelectItem>
                                                                                    {lectureRooms.map((r) => (
                                                                                        <SelectItem key={r.id} value={r.id.toString()}>
                                                                                            {r.name}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        {block.needs_lab && (
                                                                            <div className="flex items-center gap-2">
                                                                                <Label className="text-xs whitespace-nowrap">
                                                                                    Lab Room:
                                                                                </Label>
                                                                                <Select
                                                                                    value={block.preferred_lab_room_id?.toString() || 'none'}
                                                                                    onValueChange={(value) => {
                                                                                        const newSubjects = [...subjectForm.data.subjects];
                                                                                        newSubjects[blockIndex].preferred_lab_room_id = value === 'none' ? null : parseInt(value);
                                                                                        subjectForm.setData('subjects', newSubjects);
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger className="h-7 w-28 text-xs">
                                                                                        <SelectValue placeholder="Any" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="none">Any</SelectItem>
                                                                                        {labRooms.map((r) => (
                                                                                            <SelectItem key={r.id} value={r.id.toString()}>
                                                                                                {r.name}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {subjectForm.data.subjects.length > 0 && (
                                    <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                        <Button
                                            onClick={saveSubjects}
                                            disabled={subjectForm.processing}
                                        >
                                            Save Subjects
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Faculty Tab */}
                    <TabsContent value="faculty" className="flex-1">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Available Faculty */}
                            <div className="rounded-lg border bg-card p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Available Faculty
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {availableFaculty.length} faculty
                                    </span>
                                </div>
                                <div className="relative mb-3">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search faculty..."
                                        value={facultySearch}
                                        onChange={(e) =>
                                            setFacultySearch(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                                <div className="max-h-87.5 space-y-2 overflow-y-auto">
                                    {availableFaculty.map((f) => (
                                        <div
                                            key={f.id}
                                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    <Users className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {f.lname}, {f.fname}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {f.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => addFaculty(f.id)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {availableFaculty.length === 0 && (
                                        <p className="py-4 text-center text-muted-foreground">
                                            {facultySearch
                                                ? 'No faculty match your search'
                                                : 'All faculty have been added'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Selected Faculty */}
                            <div className="rounded-lg border bg-card p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        Assigned Faculty
                                    </h3>
                                </div>
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Faculty assigned here are available for all
                                    year levels
                                </p>
                                <div className="max-h-87.5 space-y-2 overflow-y-auto">
                                    {facultyForm.data.faculty.map(
                                        (fac, index) => {
                                            const f = getFaculty(fac.user_id);
                                            return (
                                                <div
                                                    key={fac.user_id}
                                                    className="rounded-lg border p-3"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <p className="font-medium">
                                                            {f?.lname},{' '}
                                                            {f?.fname}
                                                        </p>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-destructive"
                                                            onClick={() =>
                                                                removeFaculty(
                                                                    fac.user_id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">
                                                                Max Units
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                className="h-8"
                                                                value={
                                                                    fac.max_units
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const newFaculty =
                                                                        [
                                                                            ...facultyForm
                                                                                .data
                                                                                .faculty,
                                                                        ];
                                                                    newFaculty[
                                                                        index
                                                                    ].max_units =
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 24;
                                                                    facultyForm.setData(
                                                                        'faculty',
                                                                        newFaculty,
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">
                                                                No class
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    fac.preferred_day_off ||
                                                                    'none'
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    const newFaculty =
                                                                        [
                                                                            ...facultyForm
                                                                                .data
                                                                                .faculty,
                                                                        ];
                                                                    newFaculty[
                                                                        index
                                                                    ].preferred_day_off =
                                                                        value ===
                                                                            'none'
                                                                            ? null
                                                                            : value;
                                                                    facultyForm.setData(
                                                                        'faculty',
                                                                        newFaculty,
                                                                    );
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue placeholder="None" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">
                                                                        None
                                                                    </SelectItem>
                                                                    <SelectItem value="monday">
                                                                        Monday
                                                                    </SelectItem>
                                                                    <SelectItem value="tuesday">
                                                                        Tuesday
                                                                    </SelectItem>
                                                                    <SelectItem value="wednesday">
                                                                        Wednesday
                                                                    </SelectItem>
                                                                    <SelectItem value="thursday">
                                                                        Thursday
                                                                    </SelectItem>
                                                                    <SelectItem value="friday">
                                                                        Friday
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">
                                                                Preferred Time
                                                            </Label>
                                                            <Select
                                                                value={
                                                                    fac.preferred_time_period ||
                                                                    'none'
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    const newFaculty =
                                                                        [
                                                                            ...facultyForm
                                                                                .data
                                                                                .faculty,
                                                                        ];
                                                                    newFaculty[
                                                                        index
                                                                    ].preferred_time_period =
                                                                        value ===
                                                                            'none'
                                                                            ? null
                                                                            : value;
                                                                    facultyForm.setData(
                                                                        'faculty',
                                                                        newFaculty,
                                                                    );
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue placeholder="None" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">
                                                                        None
                                                                    </SelectItem>
                                                                    <SelectItem value="morning">
                                                                        Morning
                                                                    </SelectItem>
                                                                    <SelectItem value="afternoon">
                                                                        Afternoon
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        {fac.preferred_day_off && (
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">
                                                                    No class Time
                                                                </Label>
                                                                <Select
                                                                    value={
                                                                        fac.preferred_day_off_time ||
                                                                        'wholeday'
                                                                    }
                                                                    onValueChange={(
                                                                        value,
                                                                    ) => {
                                                                        const newFaculty =
                                                                            [
                                                                                ...facultyForm
                                                                                    .data
                                                                                    .faculty,
                                                                            ];
                                                                        // Type cast to match the interface since we know the value comes from our fixed options
                                                                        newFaculty[
                                                                            index
                                                                        ].preferred_day_off_time = value as 'morning' | 'afternoon' | 'wholeday';
                                                                        facultyForm.setData(
                                                                            'faculty',
                                                                            newFaculty,
                                                                        );
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue placeholder="Whole Day" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="wholeday">
                                                                            Whole Day
                                                                        </SelectItem>
                                                                        <SelectItem value="morning">
                                                                            Morning Only
                                                                        </SelectItem>
                                                                        <SelectItem value="afternoon">
                                                                            Afternoon Only
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                                {facultyForm.data.faculty.length > 0 && (
                                    <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                        <Button
                                            onClick={saveFaculty}
                                            disabled={facultyForm.processing}
                                        >
                                            Save Faculty
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Assignments Tab */}
                    <TabsContent value="assignments" className="flex-1">
                        <div className="rounded-lg border bg-card p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        Subject-Faculty Assignments
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Assign faculty members to teach each
                                        subject block. Different blocks can have
                                        different instructors.
                                    </p>
                                </div>
                            </div>

                            {currentYearLevel.subjects &&
                                currentYearLevel.subjects.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Group subjects by subject_id, course_ids, and parallel_subject_ids */}
                                    {(() => {
                                        // Group by subject_id + course_ids + parallel_subject_ids (using courses relationship)
                                        const groups =
                                            currentYearLevel.subjects!.reduce(
                                                (acc, s) => {
                                                    // Use courses relationship if available, fallback to course_id
                                                    const courseIds =
                                                        s.courses?.map(
                                                            (c) => c.id,
                                                        ) ||
                                                        (s.course_id
                                                            ? [s.course_id]
                                                            : []);
                                                    const courseKey = courseIds
                                                        .sort()
                                                        .join(',');
                                                    // Include parallel_subject_ids in the key
                                                    const parallelKey = (s.parallel_subject_ids || []).sort().join(',');
                                                    const key = `${s.subject_id}-${courseKey}-${parallelKey}`;
                                                    if (!acc[key]) {
                                                        acc[key] = {
                                                            subject_id:
                                                                s.subject_id,
                                                            course_ids:
                                                                courseIds,
                                                            parallel_subject_ids: s.parallel_subject_ids || [],
                                                            blocks: [],
                                                            subject: s.subject,
                                                            courses:
                                                                s.courses ||
                                                                (s.course
                                                                    ? [s.course]
                                                                    : []),
                                                        };
                                                    }
                                                    acc[key].blocks.push(s);
                                                    return acc;
                                                },
                                                {} as Record<
                                                    string,
                                                    {
                                                        subject_id: number;
                                                        course_ids: number[];
                                                        parallel_subject_ids: number[];
                                                        blocks: typeof currentYearLevel.subjects;
                                                        subject:
                                                        | (typeof subjects)[0]
                                                        | undefined;
                                                        courses: {
                                                            id: number;
                                                            code: string;
                                                        }[];
                                                    }
                                                >,
                                            );

                                        return Object.values(groups).map(
                                            (group) => {
                                                const subjectsForGroup =
                                                    group.blocks.sort(
                                                        (a, b) =>
                                                            (a.block_number ??
                                                                1) -
                                                            (b.block_number ??
                                                                1),
                                                    );
                                                const subject = group.subject;
                                                const isShared = subject
                                                    ? isSharedSubject(subject)
                                                    : false;
                                                const isFused =
                                                    group.course_ids.length > 1;
                                                const hasParallelSubjects = group.parallel_subject_ids.length > 0;
                                                const courseKey =
                                                    group.course_ids
                                                        .sort()
                                                        .join(',');
                                                const parallelKey = group.parallel_subject_ids.sort().join(',');
                                                const courseNames =
                                                    group.courses
                                                        .map((c) => c.code)
                                                        .join(' + ');

                                                // Get combined subject code for parallel subjects
                                                const displaySubjectCode = hasParallelSubjects && subject
                                                    ? group.parallel_subject_ids
                                                        .map(pid => subjects.find(s => s.id === pid)?.code)
                                                        .filter(Boolean)
                                                        .sort()
                                                        .join(' / ')
                                                    : subject?.code;

                                                return (
                                                    <div
                                                        key={`${group.subject_id}-${courseKey}-${parallelKey}`}
                                                        className="rounded-lg border p-4"
                                                    >
                                                        {/* Subject Header */}
                                                        <div className="mb-3">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="font-medium">
                                                                    {
                                                                        displaySubjectCode
                                                                    }
                                                                </p>
                                                                {hasParallelSubjects && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        <Link2 className="mr-1 h-3 w-3" />
                                                                        Parallel
                                                                    </Badge>
                                                                )}
                                                                {isShared &&
                                                                    group
                                                                        .course_ids
                                                                        .length >
                                                                    0 && (
                                                                        <Badge
                                                                            variant={
                                                                                isFused
                                                                                    ? 'default'
                                                                                    : 'secondary'
                                                                            }
                                                                            className="text-xs"
                                                                        >
                                                                            {isFused && (
                                                                                <Link2 className="mr-1 h-3 w-3" />
                                                                            )}
                                                                            {
                                                                                courseNames
                                                                            }
                                                                        </Badge>
                                                                    )}
                                                                {isShared &&
                                                                    group
                                                                        .course_ids
                                                                        .length ===
                                                                    0 && (
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            GE
                                                                        </Badge>
                                                                    )}
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {
                                                                        subjectsForGroup.length
                                                                    }{' '}
                                                                    block
                                                                    {subjectsForGroup.length >
                                                                        1
                                                                        ? 's'
                                                                        : ''}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {subject?.name}
                                                            </p>
                                                            {/* Show parallel subject codes */}
                                                            {hasParallelSubjects && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {group.parallel_subject_ids.map((pid) => {
                                                                        const pSubject = subjects.find(s => s.id === pid);
                                                                        return pSubject ? (
                                                                            <Badge
                                                                                key={pid}
                                                                                variant="outline"
                                                                                className="text-[10px] font-mono px-1 py-0"
                                                                            >
                                                                                {pSubject.code}
                                                                            </Badge>
                                                                        ) : null;
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Block Assignments */}
                                                        <div className="space-y-2 border-l-2 border-primary/30 pl-3">
                                                            {subjectsForGroup.map(
                                                                (sub) => {
                                                                    const assignment =
                                                                        assignmentForm.data.assignments.find(
                                                                            (
                                                                                a,
                                                                            ) =>
                                                                                a.academic_setup_subject_id ===
                                                                                sub.id,
                                                                        );
                                                                    const selectedFacultyId =
                                                                        assignment?.user_id?.toString() ||
                                                                        '';
                                                                    const selectedFaculty =
                                                                        setup.faculty?.find(
                                                                            (
                                                                                f,
                                                                            ) =>
                                                                                f.user_id.toString() ===
                                                                                selectedFacultyId,
                                                                        );
                                                                    // Use the computed display_code from backend or generate it
                                                                    // For parallel subjects, show combined codes
                                                                    let blockCode = '';
                                                                    if (hasParallelSubjects && sub.parallel_subject_ids && sub.parallel_subject_ids.length > 0) {
                                                                        // Get all parallel subject codes with block number
                                                                        blockCode = sub.parallel_subject_ids
                                                                            .map(pid => {
                                                                                const pSubject = subjects.find(s => s.id === pid);
                                                                                if (pSubject) {
                                                                                    return `${pSubject.code.replace(/\s+/g, '')}${(sub.block_number ?? 1).toString().padStart(2, '0')}`;
                                                                                }
                                                                                return null;
                                                                            })
                                                                            .filter(Boolean)
                                                                            .sort()
                                                                            .join('/');
                                                                    } else {
                                                                        blockCode = sub.display_code ||
                                                                            (subject
                                                                                ? generateBlockCode(
                                                                                    subject.code,
                                                                                    currentYearLevel.year_level,
                                                                                    sub.block_number ?? 1,
                                                                                )
                                                                                : '');
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                sub.id
                                                                            }
                                                                            className="ml-2 flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <Badge
                                                                                    variant="default"
                                                                                    className="font-mono text-xs"
                                                                                >
                                                                                    {
                                                                                        blockCode
                                                                                    }
                                                                                </Badge>
                                                                                <span className="text-sm text-muted-foreground">
                                                                                    Block{' '}
                                                                                    {sub.block_number ??
                                                                                        1}
                                                                                </span>
                                                                            </div>
                                                                            <Select
                                                                                value={
                                                                                    selectedFacultyId ||
                                                                                    'none'
                                                                                }
                                                                                onValueChange={(
                                                                                    value,
                                                                                ) => {
                                                                                    const newAssignments =
                                                                                        assignmentForm.data.assignments.filter(
                                                                                            (
                                                                                                a,
                                                                                            ) =>
                                                                                                a.academic_setup_subject_id !==
                                                                                                sub.id,
                                                                                        );
                                                                                    if (
                                                                                        value &&
                                                                                        value !==
                                                                                        'none'
                                                                                    ) {
                                                                                        newAssignments.push(
                                                                                            {
                                                                                                academic_setup_subject_id:
                                                                                                    sub.id,
                                                                                                user_id:
                                                                                                    parseInt(
                                                                                                        value,
                                                                                                    ),
                                                                                            },
                                                                                        );
                                                                                    }
                                                                                    assignmentForm.setData(
                                                                                        'assignments',
                                                                                        newAssignments,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="w-55">
                                                                                    <SelectValue>
                                                                                        {selectedFaculty ? (
                                                                                            `${selectedFaculty.user?.lname}, ${selectedFaculty.user?.fname}`
                                                                                        ) : (
                                                                                            <span className="text-muted-foreground">
                                                                                                TBA
                                                                                            </span>
                                                                                        )}
                                                                                    </SelectValue>
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem
                                                                                        value="none"
                                                                                        className="text-muted-foreground"
                                                                                    >
                                                                                        TBA
                                                                                        (To
                                                                                        Be
                                                                                        Assigned)
                                                                                    </SelectItem>
                                                                                    {setup.faculty?.map(
                                                                                        (
                                                                                            fac,
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    fac.user_id
                                                                                                }
                                                                                                value={fac.user_id.toString()}
                                                                                            >
                                                                                                {
                                                                                                    fac
                                                                                                        .user
                                                                                                        ?.lname
                                                                                                }
                                                                                                ,{' '}
                                                                                                {
                                                                                                    fac
                                                                                                        .user
                                                                                                        ?.fname
                                                                                                }
                                                                                            </SelectItem>
                                                                                        ),
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">
                                    <p>
                                        No subjects added yet. Add subjects
                                        first in the Subjects tab.
                                    </p>
                                </div>
                            )}
                            {currentYearLevel.subjects && currentYearLevel.subjects.length > 0 && (
                                <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                                    <Button
                                        onClick={saveAssignments}
                                        disabled={assignmentForm.processing}
                                    >
                                        Save Assignments
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>


                </Tabs>

                {/* Complete Button */}
                <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        {currentYearLevel.is_configured
                            ? 'This year level is already configured.'
                            : "Mark as complete when you're done configuring this year level."}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/academic-setup">Back to List</Link>
                        </Button>
                        <Button
                            onClick={completeYearLevel}
                            disabled={subjectForm.data.subjects.length === 0}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            {currentYearLevel.is_configured
                                ? 'Already Prepared'
                                : 'Complete & Next'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add Shared Subject Dialog */}
            <Dialog
                open={addSubjectDialog.open}
                onOpenChange={(open) =>
                    setAddSubjectDialog((prev) => ({ ...prev, open }))
                }
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Add {addSubjectDialog.subject?.code}
                        </DialogTitle>
                        <DialogDescription>
                            {addSubjectDialog.subject?.name}
                        </DialogDescription>
                    </DialogHeader>

                    {addSubjectDialog.subject &&
                        (() => {
                            // Get uncovered courses for this subject
                            const uncoveredCourseIds = getUncoveredCourseIds(
                                addSubjectDialog.subject,
                            );
                            const uncoveredCourses = getCoursesForSubject(
                                addSubjectDialog.subject,
                            ).filter((c) => uncoveredCourseIds.includes(c.id));
                            const coveredCourseIds = getCoveredCourseIds(
                                addSubjectDialog.subject.id,
                            );
                            const coveredCourses = getCoursesForSubject(
                                addSubjectDialog.subject,
                            ).filter((c) => coveredCourseIds.includes(c.id));

                            return (
                                <div className="space-y-4">
                                    {/* Show already covered courses */}
                                    {coveredCourses.length > 0 && (
                                        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                                            <p className="mb-1 font-medium">
                                                Already added for:
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {coveredCourses.map((c) => (
                                                    <Badge
                                                        key={c.id}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {c.code}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Course Selection - only show uncovered courses */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">
                                            {coveredCourses.length > 0
                                                ? 'Add for remaining courses'
                                                : 'Select Courses'}
                                        </Label>
                                        <div className="grid gap-2">
                                            {uncoveredCourses.map((course) => (
                                                <div
                                                    key={course.id}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${addSubjectDialog.selectedCourseIds.includes(
                                                        course.id,
                                                    )
                                                        ? 'border-primary bg-primary/10'
                                                        : 'hover:bg-muted/50'
                                                        }`}
                                                    onClick={() =>
                                                        toggleCourseInDialog(
                                                            course.id,
                                                        )
                                                    }
                                                >
                                                    <Checkbox
                                                        checked={addSubjectDialog.selectedCourseIds.includes(
                                                            course.id,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleCourseInDialog(
                                                                course.id,
                                                            )
                                                        }
                                                    />
                                                    <div>
                                                        <p className="font-medium">
                                                            {course.code}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {course.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Fusion Mode */}
                                    {addSubjectDialog.selectedCourseIds.length >
                                        1 && (
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">
                                                    Block Mode
                                                </Label>
                                                <div className="grid gap-2">
                                                    <div
                                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${addSubjectDialog.fusionMode ===
                                                            'separate'
                                                            ? 'border-primary bg-primary/10'
                                                            : 'hover:bg-muted/50'
                                                            }`}
                                                        onClick={() =>
                                                            setAddSubjectDialog(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    fusionMode:
                                                                        'separate',
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <Unlink className="mt-0.5 h-5 w-5 shrink-0" />
                                                        <div>
                                                            <p className="font-medium">
                                                                Separate Blocks
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Each course gets its
                                                                own block. Students
                                                                stay within their
                                                                course.
                                                            </p>
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {addSubjectDialog.selectedCourseIds.map(
                                                                    (id) => {
                                                                        const courseGroupCode = getCourseGroupCode([id]);
                                                                        return (
                                                                            <Badge
                                                                                key={id}
                                                                                variant="secondary"
                                                                                className="text-xs"
                                                                            >
                                                                                {addSubjectDialog.subject?.code}{courseGroupCode}01
                                                                            </Badge>
                                                                        );
                                                                    }
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${addSubjectDialog.fusionMode ===
                                                            'fused'
                                                            ? 'border-primary bg-primary/10'
                                                            : 'hover:bg-muted/50'
                                                            }`}
                                                        onClick={() =>
                                                            setAddSubjectDialog(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    fusionMode:
                                                                        'fused',
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <Link2 className="mt-0.5 h-5 w-5 shrink-0" />
                                                        <div>
                                                            <p className="font-medium">
                                                                Parallel Subject
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Students from different
                                                                courses attend together.
                                                                Same subject, shared schedule.
                                                            </p>
                                                            <div className="mt-1 space-y-1">
                                                                <Badge
                                                                    variant="default"
                                                                    className="text-xs"
                                                                >
                                                                    {addSubjectDialog.subject?.code}01
                                                                </Badge>
                                                                <div className="flex flex-wrap items-center gap-1">
                                                                    <span className="text-[10px] text-muted-foreground">Combines:</span>
                                                                    {addSubjectDialog.selectedCourseIds.map((id) => {
                                                                        const courseGroupCode = getCourseGroupCode([id]);
                                                                        return (
                                                                            <Badge
                                                                                key={id}
                                                                                variant="outline"
                                                                                className="text-[10px] font-mono px-1 py-0"
                                                                            >
                                                                                {addSubjectDialog.subject?.code}{courseGroupCode}01
                                                                            </Badge>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                </div>
                            );
                        })()}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setAddSubjectDialog({
                                    open: false,
                                    subject: null,
                                    selectedCourseIds: [],
                                    fusionMode: 'separate',
                                })
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmAddSubject}
                            disabled={
                                addSubjectDialog.selectedCourseIds.length === 0
                            }
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Subject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Parallel Subject Dialog - Same title, different codes */}
            <Dialog
                open={parallelSubjectDialog.open}
                onOpenChange={(open) =>
                    setParallelSubjectDialog((prev) => ({ ...prev, open }))
                }
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            Similar Subjects Detected
                        </DialogTitle>
                        <DialogDescription>
                            The following subjects have similar titles but different codes across curricula. Would you like to make them parallel (combined class) or keep them separate?
                        </DialogDescription>
                    </DialogHeader>

                    {parallelSubjectDialog.clickedSubject && (
                        <div className="space-y-4">
                            {/* Clicked Subject */}
                            <div className="rounded-lg border bg-primary/5 border-primary/20 p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="default" className="text-xs">{parallelSubjectDialog.clickedSubject.code}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {parallelSubjectDialog.clickedProspectus?.course_code} - {parallelSubjectDialog.clickedProspectus?.academic_year}
                                    </span>
                                </div>
                                <p className="text-sm font-medium">{parallelSubjectDialog.clickedSubject.name}</p>
                            </div>

                            {/* Matching Subjects */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Matching Subjects Found</Label>
                                <div className="space-y-2 max-h-50 overflow-y-auto">
                                    {parallelSubjectDialog.matchingSubjects.map(({ subject, prospectus }) => {
                                        const itemKey = `${subject.id}-${prospectus.id}`;
                                        const isSelected = parallelSubjectDialog.selectedItems.includes(itemKey);
                                        return (
                                            <div
                                                key={itemKey}
                                                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${isSelected
                                                    ? 'border-primary bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                                    }`}
                                                onClick={() => {
                                                    setParallelSubjectDialog(prev => ({
                                                        ...prev,
                                                        selectedItems: isSelected
                                                            ? prev.selectedItems.filter(key => key !== itemKey)
                                                            : [...prev.selectedItems, itemKey]
                                                    }));
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => {
                                                        setParallelSubjectDialog(prev => ({
                                                            ...prev,
                                                            selectedItems: isSelected
                                                                ? prev.selectedItems.filter(key => key !== itemKey)
                                                                : [...prev.selectedItems, itemKey]
                                                        }));
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="text-xs">{subject.code}</Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {prospectus.course_code} - {prospectus.academic_year}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{subject.name}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mode Selection */}
                            {parallelSubjectDialog.selectedItems.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Schedule Mode</Label>
                                    <div className="grid gap-2">
                                        <div
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${parallelSubjectDialog.mode === 'separate'
                                                ? 'border-primary bg-primary/10'
                                                : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => setParallelSubjectDialog(prev => ({ ...prev, mode: 'separate' }))}
                                        >
                                            <Unlink className="mt-0.5 h-5 w-5 shrink-0" />
                                            <div>
                                                <p className="font-medium">Separate Classes</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Each subject gets its own class schedule. Students from different programs attend different sessions.
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${parallelSubjectDialog.mode === 'parallel'
                                                ? 'border-primary bg-primary/10'
                                                : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => setParallelSubjectDialog(prev => ({ ...prev, mode: 'parallel' }))}
                                        >
                                            <Link2 className="mt-0.5 h-5 w-5 shrink-0" />
                                            <div>
                                                <p className="font-medium">Parallel / Combined Class</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Students from all selected programs attend the same class session. Uses the primary subject code ({parallelSubjectDialog.clickedSubject.code}).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setParallelSubjectDialog({
                                    open: false,
                                    clickedSubject: null,
                                    clickedProspectus: null,
                                    matchingSubjects: [],
                                    selectedItems: [],
                                    mode: 'separate',
                                })
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmAddParallelSubjects}
                            disabled={parallelSubjectDialog.selectedItems.length === 0}
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            {parallelSubjectDialog.mode === 'parallel' ? 'Add as Parallel' : 'Add Subjects'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import CSV Dialog */}
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
                            Import subjects, faculty, and assignments from a previously exported CSV file.
                        </DialogDescription>
                    </DialogHeader>

                    {importDialog.step === 'upload' && (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground mb-4">
                                    Select a CSV file exported from Academic Setup
                                </p>
                                <Input
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={handleImportFileSelect}
                                    className="max-w-xs mx-auto"
                                />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p><strong>Note:</strong> The CSV file should be exported from another Academic Setup using the Export button.</p>
                                <p>Missing subjects or faculty will be reported before import.</p>
                            </div>
                        </div>
                    )}

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
                                        </div>
                                    )}

                                    {/* Warnings - Assignments */}
                                    {importDialog.validationResult.warnings.assignments.length > 0 && (
                                        <div className="border border-orange-500/20 bg-orange-500/5 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                                <p className="font-medium text-orange-600">
                                                    {importDialog.validationResult.warnings.assignments.length} Assignment(s) Will Be Set to TBA
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                                The assigned faculty for these subjects were not found:
                                            </p>
                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                {importDialog.validationResult.warnings.assignments.map((warning, idx) => (
                                                    <div key={idx} className="text-sm flex items-center justify-between bg-background/50 rounded px-2 py-1">
                                                        <span className="font-mono">{warning.subject_code}</span>
                                                        <span className="text-muted-foreground text-xs">{warning.faculty_name}</span>
                                                    </div>
                                                ))}
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

                    {importDialog.step === 'importing' && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-3 text-muted-foreground">Importing data...</span>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={resetImportDialog}>
                            Cancel
                        </Button>
                        {importDialog.step === 'preview' && importDialog.validationResult && (
                            <Button
                                onClick={performImport}
                                disabled={importDialog.validationResult.summary.valid_subjects === 0}
                            >
                                <Upload className="mr-1 h-4 w-4" />
                                Import {importDialog.validationResult.summary.valid_subjects} Subjects
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout >
    );
}
