import type { PropsWithChildren } from 'react';

import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { FlashToast } from '@/components/flash-toast';
import { type BreadcrumbItem } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell>
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent>{children}</AppContent>
            <FlashToast />
        </AppShell>
    );
}
