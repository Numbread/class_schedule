import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: `
                        group flex items-start gap-3 w-full p-4 rounded-xl
                        shadow-lg shadow-black/5 dark:shadow-black/20
                        backdrop-blur-xl
                        border
                        bg-[var(--toast-bg)] border-[var(--toast-border)]
                        transition-all duration-300 ease-out
                    `,
          title: 'text-sm font-semibold leading-tight',
          description: 'text-sm opacity-90 mt-1 leading-relaxed',
          actionButton:
            'bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity',
          cancelButton:
            'bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity',
          closeButton: `
                        !absolute !right-3 !top-3 !left-auto !transform-none
                        !bg-transparent !border-0 !p-1 !rounded-full
                        !text-current !opacity-40 hover:!opacity-100 hover:!bg-white/10
                        !transition-all !duration-200
                    `,
          success: 'text-emerald-600 dark:text-emerald-400',
          error: 'text-red-600 dark:text-red-400',
          warning: 'text-amber-600 dark:text-amber-400',
          info: 'text-blue-600 dark:text-blue-400',
        },
      }}
      icons={{
        success: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        ),
        error: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
        ),
        warning: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
        ),
        info: (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
            <Info className="h-4 w-4 text-blue-500" />
          </div>
        ),
      }}
      position="top-right"
      closeButton
      duration={4000}
      gap={12}
      offset={20}
      visibleToasts={5}
      expand={false}
      {...props}
    />
  );
}

export { Toaster, toast };
