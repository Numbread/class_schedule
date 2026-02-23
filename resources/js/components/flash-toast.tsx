import { useFlashToast } from '@/hooks/use-flash-toast';

/**
 * Component that renders nothing but handles flash toast notifications.
 * Include this component in your layout to automatically show toast
 * notifications for any flash messages from the backend.
 */
export function FlashToast() {
  useFlashToast();
  return null;
}
