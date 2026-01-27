

'use client';

import { useEffect, useState, useRef, useTransition, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { parseDateSafely } from '@/lib/utils';

const initialState: { message: string; success: boolean, error?: string } = {
  message: '',
  success: false,
};

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" disabled={isPending}>
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
            )}
        </Button>
    );
}

interface GuaranteeManagerProps {
    booking: Booking;
    children: ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}


export function GuaranteeManager({ booking, children, isOpen, onOpenChange }: GuaranteeManagerProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [status, setStatus] = useState<GuaranteeStatus>(booking.guaranteeStatus || 'not_solicited');
  const [amount, setAmount] = useState<number | undefined>(booking.guaranteeAmount || undefined);
  const [receivedDate, setReceivedDate] = useState<Date | undefined>(
    parseDateSafely(booking.guaranteeReceivedDate)
  );
  const [returnedDate, setReturnedDate] = useState<Date | undefined>(
    parseDateSafely(booking.guaranteeReturnedDate)
  );
  const [clientError, setClientError] = useState<string | null>(null);

  const validateForm = () => {
    if ((status === 'solicited' || status === 'received' || status === 'returned') && (!amount || amount <= 0)) {
        setClientError("El 'Monto' es obligatorio para este estado y debe ser mayor que cero.");
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

  // Effect to reset form fields when dialog opens or booking data changes
  useEffect(() => {
    if (isOpen) {
      setStatus(booking.guaranteeStatus || 'not_solicited');
      setAmount(booking.guaranteeAmount || undefined);
      setReceivedDate(parseDateSafely(booking.guaranteeReceivedDate));
      setReturnedDate(parseDateSafely(booking.guaranteeReturnedDate));
      setClientError(null);
    }
  }, [isOpen, booking]);
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
        const result = await updateBooking(initialState, formData);
        if (result.success) {
            onOpenChange(false);
            // We should reload or re-fetch data here if needed, e.g. window.location.reload()
        }
        // Handle server-side errors if necessary, though client-side validation covers most cases
    });
  };

  useEffect(() => {
    validateForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, receivedDate, returnedDate, amount]);

  return (
    <>
      {children}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Gestionar Depósito de Garantía</DialogTitle>
            <DialogDescription>
              Administra el estado y el monto de la garantía para esta reserva.
            </DialogDescription>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit}>
              <input type="hidden" name="id" value={booking.id} />
              <input type="hidden" name="guaranteeReceivedDate" value={receivedDate ? receivedDate.toISOString().split('T')[0] : ''} />
              <input type="hidden" name="guaranteeReturnedDate" value={returnedDate ? returnedDate.toISOString().split('T')[0] : ''} />
              {/* Pass through all other booking fields to avoid them being overwritten */}
              <input type="hidden" name="propertyId" value={booking.propertyId} />
              <input type="hidden" name="tenantId" value={booking.tenantId} />
              <input type="hidden" name="startDate" value={booking.startDate} />
              <input type="hidden" name="endDate" value={booking.endDate} />
              <input type="hidden" name="amount" value={booking.amount} />
              <input type="hidden" name="currency" value={booking.currency} />
              <input type="hidden" name="notes" value={booking.notes} />
              <input type="hidden" name="contractStatus" value={booking.contractStatus} />

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
                              <SelectItem value="not_applicable">N/A</SelectItem>
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
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <SubmitButton isPending={isPending} />
              </DialogFooter>
          </form>
          {(clientError) && (
              <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    {clientError}
                  </AlertDescription>
              </Alert>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
