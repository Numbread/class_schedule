import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    DoorOpen,
    GraduationCap,
    LayoutGrid,
    Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: Calendar,
            title: 'Smart Scheduling',
            description:
                'Automatically generate conflict-free class schedules optimized for faculty, rooms, and student needs.rkkkkk',
        },
        {
            icon: BookOpen,
            title: 'Subject Management',
            description:
                'Manage subjects with semester availability, units, and hour configurations for accurate scheduling.',
        },
        {
            icon: DoorOpen,
            title: 'Room Allocation',
            description:
                'Configure rooms with capacity, equipment, and priority settings for optimal resource utilization.',
        },
        {
            icon: Users,
            title: 'User Management',
            description:
                'Role-based access control for administrators, schedulers, and faculty members.',
        },
    ];

    const stats = [
        { label: 'Subjects', value: '100+', icon: BookOpen },
        { label: 'Rooms', value: '50+', icon: DoorOpen },
        { label: 'Faculty', value: '200+', icon: Users },
        { label: 'Schedules', value: '1000+', icon: Calendar },
    ];

    return (
        <>
            <Head title="Class Scheduler - Misamis University">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700,800&family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50/30 dark:from-[#0f0906] dark:via-[#0c0705] dark:to-[#0f0906]">
                {/* Navigation */}
                <header className="fixed top-0 right-0 left-0 z-50 border-b border-amber-200/50 bg-white/80 backdrop-blur-lg dark:border-amber-900/20 dark:bg-[#0c0705]/80">
                    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-amber-50">
                                    MU Class Scheduler
                                </h1>
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    Misamis University
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Button
                                    asChild
                                    className="bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/25 hover:from-amber-700 hover:to-amber-800"
                                >
                                    <Link href={dashboard()}>
                                        <LayoutGrid className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        asChild
                                        className="text-gray-700 hover:bg-amber-100 hover:text-amber-800 dark:text-amber-100 dark:hover:bg-amber-900/30"
                                    >
                                        <Link href={login()}>Sign In</Link>
                                    </Button>
                                    {canRegister && (
                                        <Button
                                            asChild
                                            className="bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/25 hover:from-amber-700 hover:to-amber-800"
                                        >
                                            <Link href={register()}>Get Started</Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden px-6 pt-32 pb-20 lg:pt-40 lg:pb-32">
                    {/* Background decorations */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-600/10" />
                        <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-[#722F37]/10 blur-3xl dark:bg-[#722F37]/5" />
                    </div>

                    <div className="mx-auto max-w-7xl">
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            <div className="text-center lg:text-left">
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100/80 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-300">
                                    <CheckCircle className="h-4 w-4" />
                                    Trusted by Misamis University
                                </div>

                                <h1 className="mb-6 text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
                                    Smart{' '}
                                    <span className="bg-gradient-to-r from-amber-600 to-[#722F37] bg-clip-text text-transparent">
                                        Class Scheduling
                                    </span>{' '}
                                    Made Simple
                                </h1>

                                <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 lg:mx-0 dark:text-gray-400">
                                    Streamline your academic scheduling with our intelligent
                                    system. Manage subjects, rooms, and faculty schedules
                                    effortlessly while avoiding conflicts automatically.
                                </p>

                                <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                                    {auth.user ? (
                                        <Button
                                            asChild
                                            size="lg"
                                            className="bg-gradient-to-r from-amber-600 to-amber-700 px-8 text-white shadow-xl shadow-amber-500/30 hover:from-amber-700 hover:to-amber-800"
                                        >
                                            <Link href={dashboard()}>
                                                <LayoutGrid className="mr-2 h-5 w-5" />
                                                Go to Dashboard
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                asChild
                                                size="lg"
                                                className="bg-gradient-to-r from-amber-600 to-amber-700 px-8 text-white shadow-xl shadow-amber-500/30 hover:from-amber-700 hover:to-amber-800"
                                            >
                                                <Link href={register()}>
                                                    Start Scheduling
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                asChild
                                                className="border-amber-300 px-8 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/30"
                                            >
                                                <Link href={login()}>Sign In</Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Hero Illustration */}
                            <div className="relative hidden lg:block">
                                <div className="relative mx-auto aspect-square max-w-md">
                                    {/* Calendar Grid Illustration */}
                                    <div className="absolute inset-0 rounded-3xl border border-amber-200/50 bg-white/50 shadow-2xl shadow-amber-500/10 backdrop-blur-sm dark:border-amber-800/30 dark:bg-[#1a0f08]/50">
                                        <div className="p-6">
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-5 w-5 text-amber-600" />
                                                    <span className="font-semibold text-gray-800 dark:text-white">
                                                        Schedule Preview
                                                    </span>
                                                </div>
                                                <span className="text-sm text-amber-600 dark:text-amber-400">
                                                    2nd Sem 2025-2026
                                                </span>
                                            </div>

                                            {/* Mini Schedule Grid */}
                                            <div className="space-y-2">
                                                {[
                                                    'Monday',
                                                    'Tuesday',
                                                    'Wednesday',
                                                    'Thursday',
                                                    'Friday',
                                                ].map((day, i) => (
                                                    <div
                                                        key={day}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <span className="w-12 text-xs text-gray-500 dark:text-gray-400">
                                                            {day.slice(0, 3)}
                                                        </span>
                                                        <div className="flex flex-1 gap-1">
                                                            {Array.from({
                                                                length: 4 + (i % 2),
                                                            }).map((_, j) => (
                                                                <div
                                                                    key={j}
                                                                    className={`h-6 flex-1 rounded ${j % 3 === 0
                                                                        ? 'bg-amber-500/60'
                                                                        : j % 3 === 1
                                                                            ? 'bg-[#722F37]/40'
                                                                            : 'bg-amber-300/40'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Time indicators */}
                                            <div className="mt-4 flex justify-between text-xs text-gray-400">
                                                <span>7:00</span>
                                                <span>12:00</span>
                                                <span>17:00</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Floating cards */}
                                    <div className="absolute -top-4 -right-4 rounded-xl border border-amber-200/50 bg-white p-3 shadow-lg dark:border-amber-800/30 dark:bg-[#1a0f08]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-800 dark:text-white">
                                                    No Conflicts
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    All schedules valid
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute -bottom-4 -left-4 rounded-xl border border-amber-200/50 bg-white p-3 shadow-lg dark:border-amber-800/30 dark:bg-[#1a0f08]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-800 dark:text-white">
                                                    Auto-Optimized
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Smart allocation
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="border-y border-amber-200/50 bg-gradient-to-r from-amber-100/50 via-white to-amber-100/50 py-12 dark:border-amber-900/20 dark:from-[#1a0f08]/50 dark:via-[#0c0705] dark:to-[#1a0f08]/50">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                            {stats.map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20">
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="px-6 py-20 lg:py-32">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
                                Everything You Need for{' '}
                                <span className="text-amber-600 dark:text-amber-400">
                                    Academic Scheduling
                                </span>
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                                Comprehensive tools designed specifically for university class
                                scheduling requirements.
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature, index) => (
                                <div
                                    key={feature.title}
                                    className="group relative overflow-hidden rounded-2xl border border-amber-200/50 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl dark:border-amber-900/30 dark:bg-[#1a0f08]"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                    }}
                                >
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-110">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-6 py-20">
                    <div className="mx-auto max-w-4xl">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#722F37] via-[#8B3A42] to-amber-700 p-8 shadow-2xl shadow-[#722F37]/30 sm:p-12">
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 h-full w-full">
                                <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
                                <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                            </div>

                            <div className="relative z-10 text-center">
                                <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                                    Ready to Streamline Your Scheduling?
                                </h2>
                                <p className="mx-auto mb-8 max-w-xl text-amber-100/80">
                                    Join Misamis University in using the most efficient class
                                    scheduling system. Start organizing your academic schedules
                                    today.
                                </p>
                                {!auth.user && (
                                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="bg-white px-8 text-[#722F37] shadow-xl hover:bg-amber-50"
                                        >
                                            <Link href={register()}>Create Account</Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            asChild
                                            className="border-white/30 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20"
                                        >
                                            <Link href={login()}>Sign In</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-amber-200/50 bg-white/50 px-6 py-8 dark:border-amber-900/20 dark:bg-[#0c0705]/50">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
                                    <GraduationCap className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-white">
                                    MU Class Scheduler
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                © {new Date().getFullYear()} Misamis University. All rights
                                reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
