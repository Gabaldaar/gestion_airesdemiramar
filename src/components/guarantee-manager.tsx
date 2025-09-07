

'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateBooking } from '@/lib/actions';
import { Booking, GuaranteeStatus } from '@/lib/data';
import { Shield, Loader2 } from 'lucide-react';
import { DatePicker } from './ui/date-picker';
import { Alert, AlertDescription } from './ui/alert';


const initialState: { message: string; success: boolean, error?: string } = {
  message: '',
  success: false,
};

function SubmitButton({ isDisabled }: { isDisabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={isDisabled || pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
            )}
        </Button>
    )
}

export function GuaranteeManager({ booking }: { booking: Booking }) {
  const [state, formAction] = useActionState(updateBooking, initialState);
  const [isOpen, setIsOpen] = useState(false);
  
  const [status, setStatus] = useState<GuaranteeStatus>(booking.guaranteeStatus || 'not_solicited');
  const [amount, setAmount] = useState<number | undefined>(booking.guaranteeAmount || undefined);
  const [receivedDate, setReceivedDate] = useState<Date | undefined>(
    booking.guaranteeReceivedDate ? new Date(booking.guaranteeReceivedDate) : undefined
  );
  const [returnedDate, setReturnedDate] = useState<Date | undefined>(
    booking.guaranteeReturnedDate ? new Date(booking.guaranteeReturnedDate) : undefined
  );
  const [clientError, setClientError] = useState<string | null>(null);

  const validateForm = () => {
    if ((status === 'solicited' || status === 'received' || status === 'returned') && (!amount || amount <= 0)) {
        setClientError("El 'Monto' es obligatorio para este estado.");
        return false;
    }
    if (status === 'received' && !receivedDate) {
        setClientError("La 'Fecha Recibida' es obligatoria para el estado 'Recibida'.");
        return false;
    }
     if (status === 'returned' && !returnedDate) {
        setClientError("La 'Fecha Devuelta' es obligatoria para el estado 'Devuelta'.");
        return false;
    }
    setClientError(null);
    return true;
  };

  useEffect(() => {
    validateForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, receivedDate, returnedDate, amount]);

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state.success]);

  useEffect(() => {
    if (isOpen) {
      setStatus(booking.guaranteeStatus || 'not_solicited');
      setAmount(booking.guaranteeAmount || undefined);
      setReceivedDate(booking.guaranteeReceivedDate ? new Date(booking.guaranteeReceivedDate) : undefined);
      setReturnedDate(booking.guaranteeReturnedDate ? new Date(booking.guaranteeReturnedDate) : undefined);
      setClientError(null);
      state.message = ''; // Clear server error on open
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, booking]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Shield className="h-4 w-4" />
          <span className="sr-only">Gestionar Garantía</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Gestionar Depósito de Garantía</DialogTitle>
          <DialogDescription>
            Administra el estado y el monto de la garantía para esta reserva.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="guaranteeReceivedDate" value={receivedDate?.toISOString().split('T')[0] || ''} />
            <input type="hidden" name="guaranteeReturnedDate" value={returnedDate?.toISOString().split('T')[0] || ''} />
            <input type="hidden" name="googleCalendarEventId" value={booking.googleCalendarEventId || ''} />

            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guaranteeStatus" className="text-right">
                    Estado
                    </Label>
                    <Select name="guaranteeStatus" value={status} onValueChange={(val) => setStatus(val as GuaranteeStatus)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="not_solicited">S/Solicitar</SelectItem>
                            <SelectItem value="solicited">Solicitada</SelectItem>
                            <SelectItem value="received">Recibida</SelectItem>
                            <SelectItem value="returned">Devuelta</SelectItem>
                            <SelectItem value="not_applicable">N/C</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guaranteeAmount" className="text-right">
                        Monto
                    </Label>
                    <Input 
                      id="guaranteeAmount" 
                      name="guaranteeAmount" 
                      type="number" 
                      step="0.01" 
                      value={amount || ''}
                      onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="col-span-3" 
                    />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guaranteeCurrency" className="text-right">
                        Moneda
                    </Label>
                    <Select name="guaranteeCurrency" defaultValue={booking.guaranteeCurrency || 'USD'}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ARS">ARS</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guaranteeReceivedDate-picker" className="text-right">
                        Fecha Recibida
                    </Label>
                    <div className="col-span-3">
                        <DatePicker date={receivedDate} onDateSelect={setReceivedDate} placeholder="Seleccionar fecha" />
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guaranteeReturnedDate-picker" className="text-right">
                        Fecha Devuelta
                    </Label>
                    <div className="col-span-3">
                        <DatePicker date={returnedDate} onDateSelect={setReturnedDate} placeholder="Seleccionar fecha" />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <SubmitButton isDisabled={!!clientError} />
            </DialogFooter>
        </form>
         {(clientError || (state.message && !state.success)) && (
            <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                   {clientError || state.message}
                </AlertDescription>
            </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
