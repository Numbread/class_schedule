/**
 * Timezone utility functions for frontend
 */

/**
 * Auto-detect user's timezone from browser
 */
export function detectTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
}

/**
 * Format timezone name for display
 */
export function formatTimezoneName(timezone: string): string {
    try {
        // Get offset
        const date = new Date();
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
        const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
        const offsetStr = offset >= 0
            ? `+${offset.toString().padStart(2, '0')}:00`
            : `${offset.toString().padStart(2, '0')}:00`;

        const city = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
        return `${city} (UTC${offsetStr})`;
    } catch {
        return timezone;
    }
}

/**
 * Convert UTC datetime string to user's timezone
 */
export function toUserTimezone(utcString: string, userTimezone: string | null): Date {
    if (!userTimezone) {
        userTimezone = detectTimezone();
    }

    try {
        // Parse UTC string and convert to user timezone
        const utcDate = new Date(utcString);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: userTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        const parts = formatter.formatToParts(utcDate);
        const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
        const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
        const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');

        return new Date(year, month, day, hour, minute, second);
    } catch {
        return new Date(utcString);
    }
}

/**
 * Format datetime for display in user's timezone
 */
export function formatForUser(
    utcString: string,
    userTimezone: string | null,
    options: Intl.DateTimeFormatOptions = {}
): string {
    if (!userTimezone) {
        userTimezone = detectTimezone();
    }

    try {
        const date = new Date(utcString);
        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            ...options,
        };

        return new Intl.DateTimeFormat('en-US', {
            ...defaultOptions,
            timeZone: userTimezone,
        }).format(date);
    } catch {
        return utcString;
    }
}
