import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    auth: Auth;
    csrf_token: string;
    sidebarOpen: boolean;
    flash?: {
        success?: string;
        error?: string;
        message?: string;
    };
    [key: string]: unknown;
}

export type UserType = 'admin' | 'scheduler' | 'faculty';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type FacultySpecialization = 'CCAI' | 'CS' | 'CPE' | 'IT' | 'IS' | 'LIS' | 'GENERAL';

export interface User {
    id: number;
    fname: string;
    mname: string | null;
    lname: string;
    email: string;
    avatar?: string;
    user_type: UserType;
    specialization?: FacultySpecialization | null;
    department_id?: number | null;
    department?: Department | null;
    is_active: boolean;
    approval_status?: ApprovalStatus;
    approved_by?: number | null;
    approved_at?: string | null;
    rejection_reason?: string | null;
    timezone: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    full_name?: string;
    [key: string]: unknown;
}

export type YearLevel = '1st' | '2nd' | '3rd' | '4th' | '5th';
export type Semester = '1st' | '2nd' | 'summer';
export type RoomType = 'lecture' | 'laboratory' | 'hybrid';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Department {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    courses_count?: number;
    courses?: Course[];
    created_at: string;
    updated_at: string;
    full_name?: string;
}

export interface CourseMajor {
    id: number;
    course_id: number;
    code: string | null;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    full_name?: string;
}

export interface Course {
    id: number;
    department_id: number;
    code: string;
    name: string;
    description: string | null;
    years: number;
    is_active: boolean;
    department?: Department;
    majors?: CourseMajor[];
    subjects_count?: number;
    majors_count?: number;
    created_at: string;
    updated_at: string;
    full_name?: string;
}

export type RequirementType = 'required' | 'recommended' | 'corequisite';

export interface SubjectPrerequisite {
    id: number;
    code: string;
    name: string;
    pivot?: {
        requirement_type: RequirementType;
    };
}

export interface Subject {
    id: number;
    course_id: number | null; // Legacy field, kept for backwards compatibility
    major_id: number | null;
    code: string;
    name: string;
    description: string | null;
    units: number;
    lecture_hours: number;
    lab_hours: number;
    category: string | null; // Subject category for room assignment rules (CISCO, BSCS_PURE, LICT, LIS)
    is_active: boolean;
    course?: Course; // Legacy single course relationship
    courses?: Course[]; // Multiple courses this subject belongs to
    major?: CourseMajor;
    prerequisites?: SubjectPrerequisite[];
    required_for?: SubjectPrerequisite[];
    total_hours?: number;
    pivot?: {
        year_level?: YearLevel;
        semester?: Semester;
        sort_order?: number;
    };
    created_at: string;
    updated_at: string;
}

export interface CurriculumProspectus {
    id: number;
    department_id: number;
    course_id: number;
    name: string;
    academic_year: string;
    description: string | null;
    is_active: boolean;
    department?: Department;
    course?: Course;
    subjects?: Subject[];
    subjects_count?: number;
    full_name?: string;
    created_at: string;
    updated_at: string;
}

export interface ClassSettings {
    allow_consecutive?: boolean;
    preferred_time_slots?: string[];
    max_daily_hours?: number;
}

export interface RoomSchedule {
    id: number;
    room_id: number;
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
    is_available: boolean;
    created_at: string;
    updated_at: string;
}

export interface Building {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    rooms_count?: number;
    rooms?: Room[];
    created_at: string;
    updated_at: string;
    full_name?: string;
}

export interface Room {
    id: number;
    name: string;
    building_id: number | null;
    building?: Building | null;
    floor: string | null;
    room_type: RoomType;
    capacity: number;
    priority: number;
    equipment: string[] | null;
    class_settings: ClassSettings | null;
    is_available: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    schedules?: RoomSchedule[];
    full_name?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

// Time Slot Types
export type DayGroup = 'MW' | 'TTH' | 'FRI' | 'SAT' | 'SUN';

export interface TimeSlot {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    day_group: DayGroup;
    priority: number;
    duration_minutes: number;
    is_active: boolean;
    days?: DayOfWeek[];
    created_at: string;
    updated_at: string;
}

// Academic Setup Types
export type AcademicSetupStatus = 'draft' | 'configuring' | 'completed' | 'active' | 'archived';

export interface AcademicSetup {
    id: number;
    department_id: number;
    course_id: number | null; // Deprecated: kept for backwards compatibility
    curriculum_name: string;
    academic_year: string;
    semester: Semester;
    is_active: boolean;
    status: AcademicSetupStatus;
    current_config_year: number | null;
    created_by: number | null;
    department?: Department;
    course?: Course; // Deprecated: use courses instead
    courses?: Course[]; // Multiple courses in this setup
    creator?: User;
    year_levels?: AcademicSetupYearLevel[];
    faculty?: AcademicSetupFaculty[];
    subject_faculty_assignments?: SubjectFacultyAssignment[];
    buildings?: Building[]; // Selected buildings for this setup
    selected_rooms?: Room[]; // Specific rooms selected for this setup
    year_levels_count?: number;
    faculty_count?: number;
    configured_years?: string;
    progress_percentage?: number;
    display_name?: string;
    course_ids?: number[]; // Array of course IDs
    course_codes?: string; // Comma-separated course codes
    created_at: string;
    updated_at: string;
}

export interface AcademicSetupYearLevel {
    id: number;
    academic_setup_id: number;
    year_level: YearLevel;
    section_count: number;
    expected_students: number;
    is_configured: boolean;
    subjects?: AcademicSetupSubject[];
    subjects_count?: number;
    display_name?: string;
    created_at: string;
    updated_at: string;
}

export interface AcademicSetupSubject {
    id: number;
    academic_setup_id: number;
    year_level_id: number;
    subject_id: number;
    course_id: number | null; // Primary course (for backwards compatibility)
    block_number: number; // Block/section number (1, 2, 3, etc.)
    expected_students: number;
    needs_lab: boolean;
    preferred_lecture_room_id: number | null;
    preferred_lab_room_id: number | null;
    preferred_lecture_room?: Room | null;
    preferred_lab_room?: Room | null;
    parallel_subject_ids?: number[] | null; // IDs of subjects taught in parallel (different codes, same content)
    is_active: boolean;
    subject?: Subject;
    course?: Course; // Single course (backwards compat)
    courses?: Course[]; // Fused courses - multiple courses can share this block
    year_level?: AcademicSetupYearLevel;
    faculty_assignments?: SubjectFacultyAssignment[];
    // Computed attributes
    block_code?: string; // e.g., "01", "02" based on year and block
    display_code?: string; // e.g., "CSC401" or "OC1CS01" for shared subjects with fused courses
    course_group_code?: string; // e.g., "CS" for BSCS+BSIT, "CS+IS" for BSCS+BLIS
    block_display_name?: string; // e.g., "Block 1"
    parallel_display_code?: string; // e.g., "CSC401/CSP1001" for parallel subjects
    created_at: string;
    updated_at: string;
}

export interface AcademicSetupFaculty {
    id: number;
    academic_setup_id: number;
    user_id: number;
    max_units: number;
    preferred_day_off: string | null; // 'monday', 'tuesday', etc.
    preferred_day_off_time: 'morning' | 'afternoon' | 'wholeday' | null;
    preferred_time_period: 'morning' | 'afternoon' | null;
    is_active: boolean;
    user?: User;
    preferred_day_off_name?: string;
    created_at: string;
    updated_at: string;
}

export interface SubjectFacultyAssignment {
    id: number;
    academic_setup_id: number;
    academic_setup_subject_id: number;
    user_id: number;
    is_primary: boolean;
    user?: User;
    academic_setup_subject?: AcademicSetupSubject;
    created_at: string;
    updated_at: string;
}

// Schedule Types
export type ScheduleStatus = 'draft' | 'published' | 'archived';

export interface Schedule {
    id: number;
    academic_setup_id: number;
    name: string;
    status: ScheduleStatus;
    fitness_score: number | null;
    generation: number | null;
    metadata: {
        population_size?: number;
        max_generations?: number;
        mutation_rate?: number;
        generation_stats?: Array<{
            generation: number;
            best_fitness: number;
            avg_fitness: number;
            worst_fitness: number;
        }>;
    } | null;
    created_by: number | null;
    published_at: string | null;
    academic_setup?: AcademicSetup;
    creator?: User;
    entries?: ScheduleEntry[];
    entries_count?: number;
    created_at: string;
    updated_at: string;
}

export interface ScheduleEntry {
    id: number;
    schedule_id: number;
    academic_setup_subject_id: number;
    room_id: number;
    time_slot_id: number;
    user_id: number | null;
    day: DayOfWeek;
    is_lab_session: boolean;
    custom_start_time: string | null;
    custom_end_time: string | null;
    session_group_id: string | null;
    slots_span: number;
    room?: Room;
    time_slot?: TimeSlot;
    academic_setup_subject?: AcademicSetupSubject;
    faculty?: User;
    display_info?: {
        subject_code: string;
        subject_name: string;
        display_code: string; // e.g., CSC401 - subject code with block suffix
        block_number: number;
        block_display: string; // e.g., "Block 1"
        room_name: string;
        time: string;
        time_slot_time: string;
        custom_start_time: string | null;
        custom_end_time: string | null;
        session_group_id: string | null;
        day: string;
        faculty: string;
    };
    has_conflict?: boolean;
    conflict_reason?: string;
    created_at: string;
    updated_at: string;
}
