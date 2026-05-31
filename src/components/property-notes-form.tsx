'use client';

import { useEffect, useState, useTransition } from 'react';
import { updateProperty } from '@/lib/actions';
import { Property } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { NotebookPen, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';
import { useTranslation } from "@/i18n/useTranslation";

const initialState = {
  message: '',
  success: false,
};

export function PropertyNotesForm({ property, onPropertyUpdated }: { property: Property, onPropertyUpdated?: () => void }) {
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formId = `property-notes-form-${property.id}`;
  const [isOpen, setIsOpen] = useState(false);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProperty(initialState, formData);
        setState(result);
        if (result.success && onPropertyUpdated) {
            onPropertyUpdated();
        }
    });
  };

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md">
          <NotebookPen className="mr-2 h-4 w-4" />
          {t('tenants.card.notes')}
        </Button>
      </DialogTrigger>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="p-0 overflow-hidden rounded-3xl"
      >
        <DialogHeader className="p-6 bg-background border-b">
          <DialogTitle>{t('properties.notes_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('properties.notes_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="bg-muted/30">
          <input type="hidden" name="id" value={property.id} />
          <div className="p-6">
            <Textarea
                name="notes"
                defaultValue={property.notes}
                className="min-h-[200px] bg-background shadow-inner"
                placeholder="..."
            />
          </div>
           <DialogFooter className="p-6 bg-background border-t">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isPending} className="font-bold">
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                    </>
                ) : (
                    t('common.save')
                )}
            </Button>
          </DialogFooter>
           {state.message && !state.success && (
              <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
