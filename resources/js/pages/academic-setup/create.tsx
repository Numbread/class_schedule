import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Check } from 'lucide-react';
import { useEffect } from 'react';

import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Course, type Department } from '@/types';

interface Props {
    departments: Department[];
    courses: Course[];
}

interface FormState {
    department_id: string;
    course_ids: number[];
    curriculum_name: string;
    academic_year: string;
    effective_year: string;
    semester: '1st' | '2nd' | 'summer';
    year_levels: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Academic Setup', href: '/academic-setup' },
    { title: 'Create', href: '#' },
];

const yearLevelOptions = [
    { value: '1st', label: '1st Year' },
    { value: '2nd', label: '2nd Year' },
    { value: '3rd', label: '3rd Year' },
    { value: '4th', label: '4th Year' },
    { value: '5th', label: '5th Year' },
];

export default function CreateAcademicSetup({ departments, courses }: Props) {
    const { auth } = usePage<any>().props;
    const userDepartmentId = auth.user.department_id;

    const form = useForm<FormState>({
        department_id: userDepartmentId ? userDepartmentId.toString() : '',
        course_ids: [],
        curriculum_name: '',
        academic_year: '',
        effective_year: '',
        semester: '1st',
        year_levels: ['1st', '2nd', '3rd', '4th'],
    });

    // Automatically select the user's department if available
    useEffect(() => {
        if (userDepartmentId) {
            form.setData('department_id', userDepartmentId.toString());
        }
    }, [userDepartmentId]);

    // Filter courses by selected department
    const filteredCourses = form.data.department_id
        ? courses.filter((c) => c.department_id.toString() === form.data.department_id)
        : [];



    // Get max years from selected courses (use the maximum)
    const maxYears = form.data.course_ids.length > 0
        ? Math.max(...form.data.course_ids.map((id) => {
            const course = courses.find((c) => c.id === id);
            return course?.years ?? 4;
        }))
        : 4;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/academic-setup');
    };

    const toggleYearLevel = (yearLevel: string) => {
        if (form.data.year_levels.includes(yearLevel)) {
            form.setData('year_levels', form.data.year_levels.filter((y) => y !== yearLevel));
        } else {
            form.setData('year_levels', [...form.data.year_levels, yearLevel]);
        }
    };

    const toggleCourse = (courseId: number) => {
        const currentIds = form.data.course_ids;
        if (currentIds.includes(courseId)) {
            form.setData('course_ids', currentIds.filter((id) => id !== courseId));
        } else {
            form.setData('course_ids', [...currentIds, courseId]);
        }
    };

    const selectAllCourses = () => {
        form.setData('course_ids', filteredCourses.map((c) => c.id));
    };

    const deselectAllCourses = () => {
        form.setData('course_ids', []);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Academic Setup" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/academic-setup">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Academic Setup</h1>
                        <p className="text-muted-foreground">
                            Set up subjects and faculty for a semester by department (includes all courses)
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Department Selection */}
                    <div className="rounded-lg border bg-card p-6 space-y-6">
                        <h2 className="text-lg font-semibold">1. Select Department</h2>
                        <p className="text-muted-foreground text-sm -mt-4">
                            The schedule will be generated for the entire department to avoid faculty conflicts across courses.
                        </p>

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Department */}
                            <div className="space-y-2">
                                <Label>Department *</Label>
                                <Select
                                    value={form.data.department_id}
                                    onValueChange={(value) => {
                                        form.setData('department_id', value);
                                        form.setData('course_ids', []);
                                    }}
                                    disabled={!!userDepartmentId}
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

                            {/* Curriculum Name */}
                            <div className="space-y-2">
                                <Label>Schedule Name *</Label>
                                <Input
                                    value={form.data.curriculum_name}
                                    onChange={(e) => form.setData('curriculum_name', e.target.value)}
                                    placeholder="e.g., CMO No. 25, s. 2016"
                                />
                                <InputError message={form.errors.curriculum_name} />
                            </div>

                             {/* Academic Year */}
                            <div className="space-y-2">
                                <Label>Academic Year *</Label>
                                <Input
                                    value={form.data.academic_year}
                                    onChange={(e) => form.setData('academic_year', e.target.value)}
                                    placeholder="e.g., 2026-2027"
                                />
                                <InputError message={form.errors.academic_year} />
                            </div>

                            {/* Semester */}
                            <div className="space-y-2">
                                <Label>Semester *</Label>
                                <Select
                                    value={form.data.semester}
                                    onValueChange={(value) => form.setData('semester', value as '1st' | '2nd' | 'summer')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1st">1st Semester</SelectItem>
                                        <SelectItem value="2nd">2nd Semester</SelectItem>
                                        <SelectItem value="summer">Summer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.semester} />
                            </div>

                             {/* Effective Year */}
                            <div className="space-y-2">
                                <Label>Effective Year</Label>
                                <Input
                                    value={form.data.effective_year || ''}
                                    onChange={(e) => form.setData('effective_year', e.target.value)}
                                    placeholder="e.g., 2028-2029"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Specifies which curriculum version to use (optional).
                                </p>
                                <InputError message={form.errors.effective_year} />
                            </div>
                        </div>
                    </div>

                    {/* Course Selection */}
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">2. Select Courses to Include</h2>
                                <p className="text-muted-foreground text-sm">
                                    Select which courses from this department should be included in the schedule.
                                    Subjects from all selected courses will be available for configuration.
                                </p>
                            </div>
                            {form.data.course_ids.length > 0 && (
                                <Badge variant="default">
                                    {form.data.course_ids.length} course{form.data.course_ids.length > 1 ? 's' : ''} selected
                                </Badge>
                            )}
                        </div>

                        {!form.data.department_id ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>Select a department first to see available courses</p>
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>No courses found for this department</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={selectAllCourses}>
                                        Select All
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={deselectAllCourses}>
                                        Deselect All
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredCourses.map((course) => {
                                        const isSelected = form.data.course_ids.includes(course.id);
                                        return (
                                            <div
                                                key={course.id}
                                                onClick={() => toggleCourse(course.id)}
                                                className={`flex items-start gap-3 rounded-lg border-2 p-4 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                                                    isSelected
                                                        ? 'bg-primary border-primary'
                                                        : 'border-muted-foreground'
                                                }`}>
                                                    {isSelected && (
                                                        <Check className="h-3 w-3 text-primary-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold">{course.code}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{course.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {course.years} year program
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                        <InputError message={form.errors.course_ids} />
                    </div>

                    {/* Year Levels to Configure */}
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">3. Year Levels to Configure</h2>
                                <p className="text-muted-foreground text-sm">
                                    Select which year levels you want to set up for this semester.
                                </p>
                            </div>
                            {form.data.year_levels.length > 0 && (
                                <Badge variant="outline">
                                    {form.data.year_levels.length} year{form.data.year_levels.length > 1 ? 's' : ''} selected
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {yearLevelOptions.map((yearLevel, index) => {
                                const isSelected = form.data.year_levels.includes(yearLevel.value);
                                const isExtraYear = index >= maxYears;
                                return (
                                    <div
                                        key={yearLevel.value}
                                        onClick={() => toggleYearLevel(yearLevel.value)}
                                        className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-4 transition-all cursor-pointer select-none ${
                                            isSelected
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                        } ${isExtraYear ? 'opacity-70' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                                                isSelected
                                                    ? 'bg-primary border-primary'
                                                    : 'border-muted-foreground'
                                            }`}>
                                                {isSelected && (
                                                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="font-medium">{yearLevel.label}</span>
                                        </div>
                                        {isExtraYear && (
                                            <span className="text-xs text-muted-foreground">(Extended)</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <InputError message={form.errors.year_levels} />

                        <p className="text-muted-foreground text-xs">
                            After creating, you'll configure each year level's subjects and faculty assignments one by one.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t pt-6">
                        <p className="text-muted-foreground text-sm">
                            {form.data.course_ids.length === 0
                                ? 'Select at least one course to continue'
                                : form.data.year_levels.length === 0
                                    ? 'Select at least one year level to continue'
                                    : `Ready to configure ${form.data.course_ids.length} course(s) for ${form.data.year_levels.join(', ')} Year${form.data.year_levels.length > 1 ? 's' : ''}`}
                        </p>
                        <div className="flex gap-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/academic-setup">Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing || form.data.year_levels.length === 0 || form.data.course_ids.length === 0}
                            >
                                Create & Start Configuration
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
