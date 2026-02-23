import { Head, Link, usePage, router } from '@inertiajs/react';
import { BookOpen, Calendar, Clock, DoorOpen, GraduationCap, MapPin, Settings2, Users, Check, ChevronsUpDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserTypeBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type TimeSlot, type User } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface FacultyEntry {
    id: number;
    subject_code: string;
    display_code?: string;
    parallel_display_code?: string;
    subject_name: string;
    units: number;
    room: string;
    time_slot_name: string;
    display_time: string;
    day: string;
    day_group: string;
    is_lab: boolean;
    year_level: string;
    block_number: number;
    time_slot_id: number;
}

interface FacultySchedule {
    schedule: {
        id: number;
        name: string;
        status: string;
        academic_year?: string;
        semester?: string;
        department?: string;
    };
    entries: FacultyEntry[];
    timeSlots: TimeSlot[];
}

interface DashboardStats {
    totalSubjects?: number;
    totalRooms?: number;
    totalUsers?: number;
    totalDepartments?: number;
    totalCourses?: number;
    activeSetups?: number;
    activeSchedules?: number;
    // Faculty-specific stats
    totalUnits?: number;
    totalSubjectsAssigned?: number;
    totalEntries?: number;
}

interface ScheduleInfo {
    id: number;
    name: string;
    status: string;
    academic_year?: string;
    semester?: string;
    department?: string;
    created_at: string;
}

interface Props {
    stats?: DashboardStats;
    facultySchedule?: FacultySchedule;
    schedules?: ScheduleInfo[];
}

const dayGroupColors: Record<string, string> = {
    MW: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    TTH: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    FRI: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
};

export default function Dashboard({ stats, facultySchedule, schedules }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user;

    const getUserDisplayName = () => {
        const middleInitial = user.mname
            ? ` ${user.mname.charAt(0).toUpperCase()}.`
            : '';
        return `${user.fname}${middleInitial} ${user.lname}`;
    };

    const quickActions = [
        {
            title: 'Schedule Plan',
            description: 'Setup semesters, subjects, and faculty',
            icon: Settings2,
            href: '/academic-setup',
            color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            visible: user.user_type === 'admin' || user.user_type === 'scheduler',
        },
        {
            title: 'Generate Schedule',
            description: 'Create optimized class schedules',
            icon: Calendar,
            href: '/scheduling',
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            visible: user.user_type === 'admin' || user.user_type === 'scheduler',
        },
        {
            title: 'Manage Subjects',
            description: 'Add, edit, or view all subjects',
            icon: BookOpen,
            href: '/subjects',
            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            visible: user.user_type === 'admin' || user.user_type === 'scheduler',
        },
        {
            title: 'Manage Rooms',
            description: 'Setup classrooms and labs',
            icon: DoorOpen,
            href: '/rooms',
            color: 'bg-green-500/10 text-green-600 dark:text-green-400',
            visible: user.user_type === 'admin' || user.user_type === 'scheduler',
        },
        {
            title: 'Manage Users',
            description: 'Add or manage system users',
            icon: Users,
            href: '/users',
            color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
            visible: user.user_type === 'admin',
        },
    ].filter((action) => action.visible);

    const statCards = [
        {
            title: 'Academic Setups',
            value: stats?.activeSetups ?? 0,
            icon: Settings2,
            description: 'Completed configurations',
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-500/10',
        },
        {
            title: 'Published Schedules',
            value: stats?.activeSchedules ?? 0,
            icon: Calendar,
            description: 'Active class schedules',
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-500/10',
        },
        {
            title: 'Total Subjects',
            value: stats?.totalSubjects ?? 0,
            icon: BookOpen,
            description: 'Active subjects in curriculum',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Total Rooms',
            value: stats?.totalRooms ?? 0,
            icon: DoorOpen,
            description: 'Available classrooms',
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-500/10',
        },
    ];

    // Faculty-specific stat cards
    const facultyStatCards = [
        {
            title: 'Total Units',
            value: stats?.totalUnits ?? 0,
            icon: BookOpen,
            description: 'Teaching load units',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Subjects Assigned',
            value: stats?.totalSubjectsAssigned ?? 0,
            icon: Settings2,
            description: 'Different subjects',
            color: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-500/10',
        },
        {
            title: 'Schedule Entries',
            value: stats?.totalEntries ?? 0,
            icon: Calendar,
            description: 'Total class sessions',
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-500/10',
        },
    ];

    // Group entries by day group for faculty schedule
    const getEntriesByDayGroup = (dayGroup: string) => {
        if (!facultySchedule?.entries) return [];
        return facultySchedule.entries.filter(e => e.day_group === dayGroup);
    };

    // Get time slots for a day group
    const getTimeSlotsForDayGroup = (dayGroup: string) => {
        if (!facultySchedule?.timeSlots) return [];
        return facultySchedule.timeSlots.filter(ts => ts.day_group === dayGroup);
    };

    // Get entries for a specific time slot and day
    const getEntriesForSlot = (timeSlotId: number, day: string) => {
        if (!facultySchedule?.entries) return [];
        return facultySchedule.entries.filter(
            e => e.time_slot_id === timeSlotId && e.day.toLowerCase() === day.toLowerCase()
        );
    };

    // Render faculty schedule grid for a day group
    const renderDayGroupSchedule = (dayGroup: string, days: { value: string; label: string }[]) => {
        const slots = getTimeSlotsForDayGroup(dayGroup);
        const entries = getEntriesByDayGroup(dayGroup);

        if (entries.length === 0) return null;

        return (
            <div className={`rounded-lg border ${dayGroupColors[dayGroup] || 'bg-muted/20'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left font-semibold w-28 bg-muted/30">Time</th>
                                {days.map(day => (
                                    <th key={day.value} className="p-2 text-center font-semibold min-w-32 bg-muted/30">
                                        {day.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map(slot => (
                                <tr key={slot.id} className="border-b last:border-b-0">
                                    <td className="p-2 font-medium text-xs whitespace-nowrap bg-muted/10">
                                        {slot.name}
                                    </td>
                                    {days.map(day => {
                                        const cellEntries = getEntriesForSlot(slot.id, day.value);
                                        return (
                                            <td key={`${slot.id}-${day.value}`} className="p-1 align-top">
                                                {cellEntries.map(entry => (
                                                    <div
                                                        key={entry.id}
                                                        className="rounded-md border bg-card p-2 mb-1 last:mb-0 shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-1 flex-wrap mb-1">
                                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                                {entry.parallel_display_code || entry.display_code || entry.subject_code}
                                                            </Badge>
                                                            {entry.is_lab && (
                                                                <Badge className="text-[9px] px-1 h-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                                    LAB
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground line-clamp-2 mb-1">
                                                            {entry.subject_name}
                                                        </p>
                                                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            <span>{entry.display_time}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                            <MapPin className="h-2.5 w-2.5" />
                                                            <span>{entry.room}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[9px] px-1 h-4 mt-1">
                                                            {entry.year_level} Yr Blk {entry.block_number}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Welcome Section */}
                <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-amber-50 to-amber-100/50 p-6 dark:from-amber-900/20 dark:to-amber-800/10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Welcome back, {user.fname}!
                                </h1>
                                <p className="text-muted-foreground">
                                    {getUserDisplayName()} •{' '}
                                    <UserTypeBadge type={user.user_type} />
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        {user.user_type === 'admin' &&
                            'As an administrator, you have full access to manage users, subjects, rooms, and schedules.'}
                        {user.user_type === 'scheduler' &&
                            'As a scheduler, you can manage subjects, rooms, and generate class schedules.'}
                        {user.user_type === 'faculty' &&
                            'View your assigned classes and schedule information here.'}
                    </p>
                </div>

                {/* Stats Grid - Admin/Scheduler */}
                {(user.user_type === 'admin' || user.user_type === 'scheduler') && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((stat) => (
                            <Card key={stat.title}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <div
                                        className={`rounded-lg p-2 ${stat.bgColor}`}
                                    >
                                        <stat.icon
                                            className={`h-4 w-4 ${stat.color}`}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {stat.value}
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Faculty Stats and Schedule */}
                {user.user_type === 'faculty' && (
                    <>
                        {/* Faculty Stats */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {facultyStatCards.map((stat) => (
                                <Card key={stat.title}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {stat.title}
                                        </CardTitle>
                                        <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <p className="text-muted-foreground text-xs">{stat.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Faculty Schedule Display */}
                        {facultySchedule ? (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>My Schedule</CardTitle>
                                            <CardDescription>
                                                {facultySchedule.schedule.semester} Semester, SY {facultySchedule.schedule.academic_year}
                                                {facultySchedule.schedule.department && ` • ${facultySchedule.schedule.department}`}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            {schedules && schedules.length > 0 && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="h-auto py-1 px-3 flex flex-col items-end gap-1 min-w-[160px] border-dashed hover:border-solid hover:bg-accent/50 transition-all text-right"
                                                        >
                                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
                                                                {facultySchedule.schedule.status === 'published' ? (
                                                                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                                                        <span className="relative flex h-1.5 w-1.5">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                                                        </span>
                                                                        Published
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                                        Tentative
                                                                    </span>
                                                                )}
                                                                <span className="text-muted-foreground/30">•</span>
                                                                <span className="text-muted-foreground truncate max-w-[100px]">
                                                                    {facultySchedule.schedule.department || 'General'}
                                                                </span>
                                                            </div>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[300px]">
                                                        <DropdownMenuLabel>Available Schedules</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {schedules.map((schedule) => (
                                                            <DropdownMenuItem
                                                                key={schedule.id}
                                                                onClick={() => router.get('/dashboard', { schedule_id: schedule.id.toString() }, { preserveState: true, preserveScroll: true })}
                                                                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                                            >
                                                                <div className="flex w-full items-center justify-between">
                                                                    <span className="font-semibold text-sm">
                                                                        {schedule.academic_year} {schedule.semester} Sem
                                                                    </span>
                                                                    {schedule.id === facultySchedule.schedule.id && <Check className="h-4 w-4 text-primary" />}
                                                                </div>
                                                                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                                                                    <span>{schedule.department || 'General'}</span>
                                                                    <Badge variant={schedule.status === 'published' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
                                                                        {schedule.status}
                                                                    </Badge>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href="/faculty/schedule">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    Full Schedule
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href="/faculty/teaching-load">
                                                    <BookOpen className="mr-2 h-4 w-4" />
                                                    Teaching Load
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="MW" className="w-full">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="MW">Monday / Wednesday</TabsTrigger>
                                            <TabsTrigger value="TTH">Tuesday / Thursday</TabsTrigger>
                                            <TabsTrigger value="FRI">Friday</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="MW">
                                            {renderDayGroupSchedule('MW', [
                                                { value: 'monday', label: 'Monday' },
                                                { value: 'wednesday', label: 'Wednesday' },
                                            ]) || (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No classes scheduled for Monday/Wednesday
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="TTH">
                                            {renderDayGroupSchedule('TTH', [
                                                { value: 'tuesday', label: 'Tuesday' },
                                                { value: 'thursday', label: 'Thursday' },
                                            ]) || (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No classes scheduled for Tuesday/Thursday
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="FRI">
                                            {renderDayGroupSchedule('FRI', [
                                                { value: 'friday', label: 'Friday' },
                                            ]) || (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No classes scheduled for Friday
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>My Schedule</CardTitle>
                                    <CardDescription>Your class schedule will appear here</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                        <p className="text-lg font-medium">No Published Schedule</p>
                                        <p className="text-sm">You don't have any classes in a published schedule yet.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* Quick Actions - Only for Admin/Scheduler */}
                {quickActions.length > 0 && (
                    <div>
                        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {quickActions.map((action) => (
                                <Card
                                    key={action.title}
                                    className="group transition-all hover:shadow-md"
                                >
                                    <CardHeader className="pb-3">
                                        <div
                                            className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg ${action.color} transition-transform group-hover:scale-110`}
                                        >
                                            <action.icon className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-base">
                                            {action.title}
                                        </CardTitle>
                                        <CardDescription>
                                            {action.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <Button asChild variant="secondary" size="sm">
                                            <Link href={action.href}>Go to {action.title.split(' ')[1]}</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Activity Placeholder - Only for Admin/Scheduler */}
                {(user.user_type === 'admin' || user.user_type === 'scheduler') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                Your recent actions and system updates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-muted-foreground flex h-32 items-center justify-center rounded-lg border border-dashed">
                                <p className="text-sm">No recent activity to display</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
