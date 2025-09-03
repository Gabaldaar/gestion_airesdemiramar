
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addPropertyExpense } from '@/lib/actions';
import { PlusCircle } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

export function ExpenseAddForm({ propertyId }: { propertyId: number }) {
  const [state, formAction] = useActionState(addPropertyExpense, initialState);
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Gasto a la Propiedad</DialogTitle>
          <DialogDescription>
            Completa los datos del gasto.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <input type="hidden" name="propertyId" value={propertyId} />
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                    Descripción
                    </Label>
                    <Input id="description" name="description" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                    Monto (ARS)
                    </Label>
                    <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit">Añadir Gasto</Button>
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
