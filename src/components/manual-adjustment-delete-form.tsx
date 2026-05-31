'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteManualAdjustment } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useTranslation } from '@/i18n/useTranslation';

const initialState = { success: false, message: '' };

function DeleteButton({ isPending }: { isPending: boolean }) {
    const { t } = useTranslation();
    return (
        <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.loading')}</> : t('common.confirm_delete.confirm')}
        </Button>
    );
}

export function ManualAdjustmentDeleteForm({ adjustmentId, isOpen, onOpenChange, onActionComplete }: { adjustmentId: string; isOpen: boolean; onOpenChange: (open: boolean) => void; onActionComplete: () => void; }) {
    const { t } = useTranslation();
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteManualAdjustment(initialState, formData);
            setState(result);
        });
    };

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? t('common.success') : t('common.error'),
                description: state.message,
                variant: state.success ? "default" : "destructive",
            });
            if (state.success) {
                onActionComplete();
                onOpenChange(false);
            }
        }
    }, [state, onActionComplete, onOpenChange, toast, t]);

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={adjustmentId} />
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.confirm_delete.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('common.confirm_delete.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel type="button" onClick={() => onOpenChange(false)}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <DeleteButton isPending={isPending} />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
