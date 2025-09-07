
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


const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
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
  // We pass the full booking to updateBooking, so we need to set all fields.
  // The guarantee manager only edits guarantee fields.
  const [state, formAction] = useActionState(updateBooking, initialState);
  const [isOpen, setIsOpen] = useState(false);
  
  const [receivedDate, setReceivedDate] = useState<Date | undefined>(
    booking.guaranteeReceivedDate ? new Date(booking.guaranteeReceivedDate) : undefined
  );
  const [returnedDate, setReturnedDate] = useState<Date | undefined>(
    booking.guaranteeReturnedDate ? new Date(booking.guaranteeReturnedDate) : undefined
  );
  
  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state]);

  // When opening, sync the date pickers' state with the booking data
  useEffect(() => {
    if (isOpen) {
      setReceivedDate(booking.guaranteeReceivedDate ? new Date(booking.guaranteeReceivedDate) : undefined);
      setReturnedDate(booking.guaranteeReturnedDate ? new Date(booking.guaranteeReturnedDate) : undefined);
    }
  }, [isOpen, booking.guaranteeReceivedDate, booking.guaranteeReturnedDate]);


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
            {/* Hidden fields to pass the full booking data to the server action */}
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="propertyId" value={booking.propertyId} />
            <input type="hidden" name="tenantId" value={booking.tenantId} />
            <input type="hidden" name="startDate" value={booking.startDate} />
            <input type="hidden" name="endDate" value={booking.endDate} />
            <input type="hidden" name="amount" value={booking.amount} />
            <input type="hidden" name="currency" value={booking.currency} />
            <input type="hidden" name="notes" value={booking.notes || ''} />
            <input type="hidden" name="contractStatus" value={booking.contractStatus || 'not_sent'} />
            <input type="hidden" name="googleCalendarEventId" value={booking.googleCalendarEventId || ''} />
            <input type="hidden" name="guaranteeReceivedDate" value={receivedDate?.toISOString().split('T')[0] || ''} />
            <input type="hidden" name="guaranteeReturnedDate" value={returnedDate?.toISOString().split('T')[0] || ''} />

            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guaranteeStatus" className="text-right">
                    Estado
                    </Label>
                    <Select name="guaranteeStatus" defaultValue={booking.guaranteeStatus || 'not_solicited'}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="not_solicited">No Solicitada</SelectItem>
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
                    <Input id="guaranteeAmount" name="guaranteeAmount" type="number" step="0.01" defaultValue={booking.guaranteeAmount || ''} className="col-span-3" />
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
                    <Label htmlFor="guaranteeReceivedDate" className="text-right">
                        Fecha Recibida
                    </Label>
                    <div className="col-span-3">
                        <DatePicker date={receivedDate} onDateSelect={setReceivedDate} placeholder="Seleccionar fecha" />
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guaranteeReturnedDate" className="text-right">
                        Fecha Devuelta
                    </Label>
                    <div className="col-span-3">
                        <DatePicker date={returnedDate} onDateSelect={setReturnedDate} placeholder="Seleccionar fecha" />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <SubmitButton />
            </DialogFooter>
        </form>
        {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2 text-center">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
