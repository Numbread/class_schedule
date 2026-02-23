import { Head } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    Calendar,
    DoorOpen,
    GraduationCap,
    LayoutGrid,
    Users,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Manual', href: '/user-manual' },
];

interface Section {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    steps: string[];
}

const sections: Section[] = [
    {
        icon: LayoutGrid,
        title: 'Dashboard Overview',
        description: 'The dashboard provides a quick overview of all system statistics and activities.',
        steps: [
            'View total counts for departments, courses, subjects, rooms, and users',
            'Monitor active schedules and upcoming classes',
            'Quick access to frequently used features',
        ],
    },
    {
        icon: Building2,
        title: 'Department Management',
        description: 'Manage academic departments and colleges within the institution.',
        steps: [
            'Click "Add Department" to create a new department',
            'Enter the department code (e.g., CCS) and full name',
            'Add a description to provide more context',
            'Use the Actions menu to edit, deactivate, or delete departments',
            'Note: Departments with existing courses cannot be deleted',
        ],
    },
    {
        icon: GraduationCap,
        title: 'Course Management',
        description: 'Set up academic programs and their specializations.',
        steps: [
            'Select a department before creating a course',
            'Enter the course code (e.g., BSCS) and full program name',
            'Set the program duration in years',
            'Add majors/specializations if the course has them',
            'Majors help organize subjects for different tracks within a course',
        ],
    },
    {
        icon: BookOpen,
        title: 'Subject Management',
        description: 'Configure subjects and assign them to semesters.',
        steps: [
            'Select the course and optionally a major for the subject',
            'Enter the subject code, name, and description',
            'Set the year level when the subject is typically taken',
            'Configure units, lecture hours, and lab hours',
            'Add semester availability to specify when the subject is offered',
            'Use filters to find subjects by year level or status',
        ],
    },
    {
        icon: DoorOpen,
        title: 'Room Management',
        description: 'Manage classrooms and their configurations.',
        steps: [
            'Add rooms with their building and floor information',
            'Specify room type: Lecture, Laboratory, or Hybrid',
            'Set room capacity for scheduling optimization',
            'Configure priority level for room assignment',
            'Add available equipment (projector, AC, etc.)',
            'Toggle availability for maintenance periods',
        ],
    },
    {
        icon: Users,
        title: 'User Management',
        description: 'Manage system users and their access levels.',
        steps: [
            'Admin: Full access to all features including user management',
            'Scheduler: Can manage subjects, rooms, and create schedules',
            'Faculty: Can view assigned schedules and course information',
            'Create new users with appropriate role assignments',
            'Deactivate accounts instead of deleting to preserve history',
        ],
    },
    {
        icon: Calendar,
        title: 'Schedule Generation',
        description: 'Generate and manage class schedules (Coming Soon).',
        steps: [
            'Select the academic year and semester',
            'Configure scheduling constraints and preferences',
            'Generate optimized schedules automatically',
            'Review and adjust generated schedules manually',
            'Publish schedules for faculty and students to view',
        ],
    },
];

export default function UserManual() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Manual" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Manual</h1>
                    <p className="text-muted-foreground">
                        Learn how to use the MU Class Scheduler system effectively
                    </p>
                </div>

                {/* Introduction Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>
                            Welcome to the MU Class Scheduler system
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm">
                            The MU Class Scheduler is a comprehensive academic scheduling system
                            designed for Misamis University. It helps administrators and schedulers
                            manage departments, courses, subjects, rooms, and generate optimized
                            class schedules.
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="mb-2 font-medium">Quick Tips</h4>
                            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                                <li>Set up departments first, then courses, then subjects</li>
                                <li>Configure all rooms before generating schedules</li>
                                <li>Use status filters to find inactive items quickly</li>
                                <li>Deactivate items instead of deleting to preserve history</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* Feature Sections */}
                <div className="grid gap-6 md:grid-cols-2">
                    {sections.map((section) => (
                        <Card key={section.title}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                                        <section.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{section.title}</CardTitle>
                                        <CardDescription>{section.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ol className="list-inside list-decimal space-y-2 text-sm">
                                    {section.steps.map((step, index) => (
                                        <li key={index} className="text-muted-foreground">
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Support Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Need Help?</CardTitle>
                        <CardDescription>
                            Contact support if you encounter any issues
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            If you need additional assistance or have questions about using the
                            system, please contact the IT Department or your system administrator.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

