import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    BookText,
    Building,
    Building2,
    Calendar,
    Clock,
    DoorOpen,
    FileText,
    GitPullRequest,
    GraduationCap,
    LayoutGrid,
    Settings2,
    Users,
} from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type User } from '@/types';

import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user;

    // Platform Group
    const platformItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    // Academics Group
    const academicItems: NavItem[] = [];
    if (user.user_type === 'admin') {
        academicItems.push(
            {
                title: 'Departments',
                href: '/departments',
                icon: Building2,
            },
            {
                title: 'Courses',
                href: '/courses',
                icon: GraduationCap,
            }
        );
    }
    if (user.user_type === 'admin' || user.user_type === 'scheduler') {
        academicItems.push(
            {
                title: 'Curriculum Prospectus',
                href: '/prospectus',
                icon: FileText,
            },
            {
                title: 'Subjects',
                href: '/subjects',
                icon: BookOpen,
            },
            {
                title: 'Schedule Plan',
                href: '/academic-setup',
                icon: Settings2,
            }
        );
    }

    // Facilities Group
    const facilityItems: NavItem[] = [];
    if (user.user_type === 'admin' || user.user_type === 'scheduler') {
        facilityItems.push(
            {
                title: 'Rooms',
                href: '/rooms',
                icon: DoorOpen,
            },
            {
                title: 'Time Slots',
                href: '/time-slots',
                icon: Clock,
            }
        );
    }

    if (user.user_type === 'admin') {
        facilityItems.push({
            title: 'Buildings',
            href: '/buildings',
            icon: Building,
        });
    }

    // Scheduling Group
    const schedulingItems: NavItem[] = [];
    if (user.user_type === 'admin' || user.user_type === 'scheduler') {
        schedulingItems.push(
            {
                title: 'Scheduling',
                href: '/scheduling',
                icon: Calendar,
            },
            {
                title: 'Schedule Requests',
                href: '/schedule-requests',
                icon: GitPullRequest,
            }
        );
    }
    if (user.user_type === 'faculty') {
        schedulingItems.push(
            {
                title: 'My Schedule',
                href: '/faculty/schedule',
                icon: Calendar,
            },
            {
                title: 'My Teaching Load',
                href: '/faculty/teaching-load',
                icon: BookOpen,
            }
        );
    }

    // Management Group
    const managementItems: NavItem[] = [];
    if (user.user_type === 'admin') {
        managementItems.push({
            title: 'Users',
            href: '/users',
            icon: Users,
        });
    }

    const footerNavItems: NavItem[] = [
        {
            title: 'User Manual',
            href: '/user-manual',
            icon: BookText,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {user.department && (
                    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                        <SidebarGroupLabel>Department</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border">
                                    <Building2 className="h-4 w-4 shrink-0" />
                                    <span className="leading-tight whitespace-normal" title={user.department.name}>
                                        {user.department.name}
                                    </span>
                                </div>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                <NavMain items={platformItems} label="Platform" />
                {academicItems.length > 0 && <NavMain items={academicItems} label="Academics" />}
                {facilityItems.length > 0 && <NavMain items={facilityItems} label="Facilities" />}
                {schedulingItems.length > 0 && <NavMain items={schedulingItems} label="Scheduling" />}
                {managementItems.length > 0 && <NavMain items={managementItems} label="Management" />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
