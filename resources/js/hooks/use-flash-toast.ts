import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { SharedData } from '@/types';

// Global singleton to track if we've already shown the toast for the current visit
// This prevents duplicate toasts when FlashToast is mounted in multiple layouts
let globalVisitId = 0;
let lastShownVisitId = -1;

/**
 * Hook to automatically show toast notifications for flash messages
 * from the Laravel backend (success, error, message).
 * 
 * Uses a global singleton pattern to prevent duplicate toasts
 * when the component is mounted in multiple layouts.
 */
export function useFlashToast() {
  const { flash } = usePage<SharedData>().props;

  // Register as the first instance if no other instance has registered yet
  useEffect(() => {
    // Increment global visit ID on every Inertia success
    const handleSuccess = () => {
      globalVisitId += 1;
    };

    const removeListener = router.on('success', handleSuccess);

    return () => {
      removeListener();
    };
  }, []);

  // Show toast for flash messages
  useEffect(() => {
    // Skip if we already showed toast for this visit
    if (globalVisitId === lastShownVisitId) {
      return;
    }

    // Skip if no flash messages
    if (!flash?.success && !flash?.error && !flash?.message) {
      return;
    }

    // Mark this visit as handled globally
    lastShownVisitId = globalVisitId;

    // Show success toast
    if (flash?.success) {
      toast.success(flash.success);
    }

    // Show error toast
    if (flash?.error) {
      toast.error(flash.error);
    }

    // Show general message toast (info style)
    if (flash?.message) {
      toast.info(flash.message);
    }
  }, [flash]);

  return flash;
}
