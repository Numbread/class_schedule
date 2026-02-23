import { Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { type PropsWithChildren } from 'react';

import { home } from '@/routes';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-linear-to-b from-amber-50 via-white to-amber-50/30 p-6 md:p-10 dark:from-[#0f0906] dark:via-[#0c0705] dark:to-[#0f0906]">
            {/* Background decorations - matching welcome page */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-600/10" />
                <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-[#722F37]/10 blur-3xl dark:bg-[#722F37]/5" />
            </div>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col gap-8">
                    {/* Logo and branding - matching welcome page */}
                    <div className="flex flex-col items-center gap-6">
                        <Link
                            href={home()}
                            className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
                        >
                            {/* Logo container - matching welcome page style */}
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 transition-all group-hover:shadow-xl group-hover:shadow-amber-500/30">
                                <GraduationCap className="h-8 w-8 text-white" />
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-amber-50">
                                    MU Class Scheduler
                                </h1>
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    Misamis University
                                </p>
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                {title}
                            </h1>
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Form container - matching welcome page card style */}
                    <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-amber-900/30 dark:bg-[#1a0f08]/80">
                        {/* Content */}
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
