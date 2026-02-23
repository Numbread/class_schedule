import { Link } from '@inertiajs/react';
import { Calendar, Clock, GraduationCap, Users } from 'lucide-react';
import { type PropsWithChildren } from 'react';

import { home } from '@/routes';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center overflow-hidden lg:grid-cols-2">
            {/* Left side - Branding panel - matching welcome page colors */}
            <div className="relative hidden h-full flex-col overflow-hidden bg-linear-to-br from-[#722F37] via-[#8B3A42] to-amber-700 p-10 text-white lg:flex">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 h-full w-full">
                    <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                </div>

                <div className="relative z-20 flex h-full flex-col justify-between">
                    {/* Logo and branding */}
                    <div>
                        <Link
                            href={home()}
                            className="group mb-12 flex items-center gap-3 transition-transform hover:scale-105"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-all group-hover:bg-white/30">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">
                                    MU Class Scheduler
                                </h1>
                                <p className="text-xs text-amber-200">
                                    Misamis University
                                </p>
                            </div>
                        </Link>

                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold leading-tight">
                                Intelligent Class Scheduling
                            </h2>
                            <p className="text-lg leading-relaxed text-white/90">
                                Optimize your academic schedule with our advanced genetic algorithm-powered scheduling system.
                            </p>
                        </div>
                    </div>

                    {/* Feature highlights */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                                <Calendar className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Smart Scheduling</h3>
                                <p className="text-sm text-white/80">
                                    Automated conflict resolution and optimization
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                                <Clock className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Time Management</h3>
                                <p className="text-sm text-white/80">
                                    Efficient allocation of time slots and resources
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Faculty & Students</h3>
                                <p className="text-sm text-white/80">
                                    Seamless coordination for all stakeholders
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form panel - matching welcome page */}
            <div className="relative flex w-full items-center justify-center overflow-hidden bg-linear-to-b from-amber-50 via-white to-amber-50/30 p-8 dark:from-[#0f0906] dark:via-[#0c0705] dark:to-[#0f0906]">
                {/* Background decorations */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-600/10" />
                    <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-[#722F37]/10 blur-3xl dark:bg-[#722F37]/5" />
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-center space-y-8">
                    {/* Mobile logo - matching welcome page */}
                    <Link
                        href={home()}
                        className="group flex items-center justify-center gap-3 lg:hidden"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 transition-all group-hover:shadow-xl group-hover:shadow-amber-500/30">
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
                    </Link>

                    {/* Form container - matching welcome page card style */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-amber-900/30 dark:bg-[#1a0f08]/80">
                        <div className="relative z-10 mb-6 flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                {title}
                            </h1>
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                {description}
                            </p>
                        </div>
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
