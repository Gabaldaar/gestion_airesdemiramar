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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteWorkLog } from '@/lib/actions';
import { Loader2, Trash2 } from 'lucide-react';
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

export function WorkLogDeleteForm({ 
  workLogId, 
  isOpen: propIsOpen, 
  onOpenChange: propOnOpenChange, 
  onActionComplete 
}: { 
  workLogId: string; 
  isOpen?: boolean; 
  onOpenChange?: (open: boolean) => void; 
  onActionComplete: () => void; 
}) {
    const { t } = useTranslation();
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const { toast } = useToast();

    // Lógica para modo controlado o autónomo
    const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
    const onOpenChange = propOnOpenChange !== undefined ? propOnOpenChange : setInternalIsOpen;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await deleteWorkLog(initialState, formData);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            {!propOnOpenChange && (
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="id" value={workLogId} />
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
