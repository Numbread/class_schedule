import { Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { type PropsWithChildren } from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-linear-to-b from-amber-50 via-white to-amber-50/30 p-6 md:p-10 dark:from-[#0f0906] dark:via-[#0c0705] dark:to-[#0f0906]">
            {/* Background decorations - matching welcome page */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-600/10" />
                <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-[#722F37]/10 blur-3xl dark:bg-[#722F37]/5" />
            </div>

            <div className="relative z-10 flex w-full max-w-md flex-col gap-8">
                {/* Logo section - matching welcome page */}
                <Link
                    href={home()}
                    className="group flex items-center justify-center gap-3 self-center transition-transform hover:scale-105"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 transition-all group-hover:shadow-xl group-hover:shadow-amber-500/30">
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

                {/* Card with enhanced styling */}
                <Card className="relative overflow-hidden border border-amber-200/50 bg-white/80 shadow-xl backdrop-blur-sm dark:border-amber-900/30 dark:bg-[#1a0f08]/80">
                    {/* Gradient accent at top */}
                    <div className="absolute top-0 h-1.5 w-full bg-linear-to-r from-amber-600 to-[#722F37]" />

                    <CardHeader className="relative z-10 px-8 pt-8 pb-6 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {title}
                        </CardTitle>
                        <CardDescription className="mt-2 text-base text-gray-600 dark:text-gray-400">
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 px-8 pb-8">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
