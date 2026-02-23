import { type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

interface FormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel?: string;
    cancelLabel?: string;
    isSubmitting?: boolean;
    submitDisabled?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    footer?: ReactNode;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

export function FormModal({
    open,
    onOpenChange,
    title,
    description,
    children,
    onSubmit,
    submitLabel = 'Save',
    cancelLabel = 'Cancel',
    isSubmitting = false,
    submitDisabled = false,
    size = 'lg',
    footer,
}: FormModalProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={sizeClasses[size]}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && (
                            <DialogDescription>{description}</DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto py-4">{children}</div>

                    {footer !== undefined ? (
                        footer
                    ) : (
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                {cancelLabel}
                            </Button>
                            <Button type="submit" disabled={isSubmitting || submitDisabled}>
                                {isSubmitting && (
                                    <Spinner className="mr-2 h-4 w-4" />
                                )}
                                {submitLabel}
                            </Button>
                        </DialogFooter>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface ConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isConfirming?: boolean;
    variant?: 'default' | 'destructive';
}

export function ConfirmModal({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isConfirming = false,
    variant = 'default',
}: ConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription asChild>
                        <div>{description}</div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isConfirming}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        disabled={isConfirming}
                    >
                        {isConfirming && <Spinner className="mr-2 h-4 w-4" />}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

