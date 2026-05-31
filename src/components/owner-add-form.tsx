'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addProvider } from '@/lib/actions';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useTranslation } from '@/i18n/useTranslation';
import { Textarea } from './ui/textarea';
import { useAuth } from './auth-provider';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('common.save')
            )}
        </Button>
    )
}

export function OwnerAddForm({ onOwnerAdded }: { onOwnerAdded: () => void }) {
  const { t } = useTranslation();
  const { orgId } = useAuth();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const formAction = (formData: FormData) => {
    // Forzamos el rol 'owner' y estado 'active'
    formData.append('role', 'owner');
    formData.append('status', 'active');
    formData.append('managementType', 'tasks');
    formData.append('appFlavor', 'personal');
    formData.append('orgId', orgId || 'global');
    
    startTransition(async () => {
        const result = await addProvider(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.message) {
        toast({
            title: state.success ? t('common.success') : t('common.error'),
            description: state.message,
            variant: state.success ? "default" : "destructive",
        })
    }
    if (state.success) {
      setIsOpen(false);
      formRef.current?.reset();
      onOwnerAdded();
    }
  }, [state, onOwnerAdded, toast, t]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('settings.owners.new_access')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.owners.dialog_title')}</DialogTitle>
          <DialogDescription>
            {t('settings.owners.dialog_desc')}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('providers.add_dialog.name')}</Label>
                    <Input id="name" name="name" placeholder="Ej: Juan Pérez" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">{t('providers.add_dialog.email')}</Label>
                    <Input id="email" name="email" type="email" placeholder="juan@gmail.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">{t('providers.add_dialog.notes_private')}</Label>
                    <Textarea id="notes" name="notes" placeholder="Observaciones sobre este dueño..." />
                </div>
                <div className="p-4 bg-muted rounded-lg text-xs text-muted-foreground italic">
                    {t('settings.owners.email_note')}
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">{t('common.cancel')}</Button>
                </DialogClose>
                <SubmitButton />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
