import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
    className?: string;
}

export function StatusBadge({
    status,
    activeLabel = 'Active',
    inactiveLabel = 'Inactive',
    className,
}: StatusBadgeProps) {
    return (
        <Badge
            variant={status ? 'default' : 'secondary'}
            className={cn(
                status
                    ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400',
                className
            )}
        >
            {status ? activeLabel : inactiveLabel}
        </Badge>
    );
}

const defaultUserTypeVariants: Record<string, { label: string; className: string }> = {
    admin: {
        label: 'Admin',
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    },
    scheduler: {
        label: 'Scheduler',
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    },
    faculty: {
        label: 'Faculty',
        className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    },
};

const defaultRoomTypeVariants: Record<string, { label: string; className: string }> = {
    lecture: {
        label: 'Lecture',
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    },
    laboratory: {
        label: 'Laboratory',
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    },
    hybrid: {
        label: 'Hybrid',
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    },
};

export function UserTypeBadge({ type, className }: { type: string; className?: string }) {
    const variant = defaultUserTypeVariants[type] || {
        label: type,
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    };

    return (
        <Badge variant="outline" className={cn(variant.className, className)}>
            {variant.label}
        </Badge>
    );
}

export function RoomTypeBadge({ type, className }: { type: string; className?: string }) {
    const variant = defaultRoomTypeVariants[type] || {
        label: type,
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    };

    return (
        <Badge variant="outline" className={cn(variant.className, className)}>
            {variant.label}
        </Badge>
    );
}

export function YearLevelBadge({ level, className }: { level: string; className?: string }) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
                className
            )}
        >
            {level} Year
        </Badge>
    );
}

