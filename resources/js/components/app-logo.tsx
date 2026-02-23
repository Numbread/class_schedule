import { GraduationCap } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GraduationCap className="size-4" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">MU Scheduler</span>
                <span className="text-sidebar-foreground/70 truncate text-xs dark:text-sidebar-foreground/80">
                    Class Management
                </span>
            </div>
        </>
    );
}
