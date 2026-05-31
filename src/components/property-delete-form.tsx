'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteProperty } from '@/lib/actions';
import { Trash2, Loader2 } from 'lucide-react';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { useTranslation } from '@/i18n/useTranslation';

const initialState = {
  message: '',
  success: false,
};

function DeleteButton({ isDisabled, isPending }: { isDisabled: boolean, isPending: boolean }) {
    const { t } = useTranslation();
    return (
        <Button type="submit" variant="destructive" disabled={isDisabled || isPending}>
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('properties.form.delete.confirm')
            )}
        </Button>
    )
}

export function PropertyDeleteForm({ propertyId, propertyName, onPropertyDeleted }: { propertyId: string; propertyName: string; onPropertyDeleted?: () => void }) {
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await deleteProperty(initialState, formData);
        setState(result);
    });
  }

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      if (onPropertyDeleted) {
          onPropertyDeleted();
      }
    }
  }, [state.success, onPropertyDeleted]);
  
   useEffect(() => {
    if (!isOpen) {
        setIsChecked(false);
        setState(initialState);
    }
  }, [isOpen])

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {t('properties.form.delete.button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} ref={formRef}>
            <input type="hidden" name="id" value={propertyId} />
            <AlertDialogHeader>
            <AlertDialogTitle>{t('properties.form.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
                {t('properties.form.delete.desc')}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 space-y-4">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="confirm-delete-prop" onCheckedChange={(checked) => setIsChecked(!!checked)} checked={isChecked} />
                    <Label htmlFor="confirm-delete-prop" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {t('properties.form.delete.disclaimer')}
                    </Label>
                  </div>
                 {state.message && !state.success && (
                    <p className="text-red-500 text-sm mt-2">{state.message}</p>
                )}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsChecked(false)}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction asChild>
                    <DeleteButton isDisabled={!isChecked} isPending={isPending} />
                </AlertDialogAction>
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
