'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
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
import { updateContrato } from '@/lib/actions';
import { Contrato, GuaranteeStatus } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { DatePicker } from './ui/date-picker';
import { Alert, AlertDescription } from './ui/alert';
import { parseDateSafely } from '@/lib/utils';
import { useToast } from './ui/use-toast';

const initialState: { message: string; success: boolean } = {
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

interface ContratoGuaranteeManagerProps {
    contrato: Contrato;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActionComplete: () => void;
}

export function ContratoGuaranteeManager({ contrato, isOpen, onOpenChange, onActionComplete }: ContratoGuaranteeManagerProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [status, setStatus] = useState<GuaranteeStatus>(contrato.guaranteeStatus || 'not_solicited');
  const [amount, setAmount] = useState<number | undefined>(contrato.montoGarantia || undefined);
  const [receivedDate, setReceivedDate] = useState<Date | undefined>(
    parseDateSafely(contrato.guaranteeReceivedDate)
  );
  const [returnedDate, setReturnedDate] = useState<Date | undefined>(
    parseDateSafely(contrato.guaranteeReturnedDate)
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
    if (isOpen) {
      setStatus(contrato.guaranteeStatus || 'not_solicited');
      setAmount(contrato.montoGarantia || undefined);
      setReceivedDate(parseDateSafely(contrato.guaranteeReceivedDate));
      setReturnedDate(parseDateSafely(contrato.guaranteeReturnedDate));
      setClientError(null);
    }
  }, [isOpen, contrato]);
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    
    const formData = new FormData(event.currentTarget);
    formData.append('id', contrato.id);
    formData.append('guaranteeStatus', status);
    formData.append('montoGarantia', amount?.toString() || '0');
    formData.append('guaranteeReceivedDate', receivedDate ? receivedDate.toISOString().split('T')[0] : '');
    formData.append('guaranteeReturnedDate', returnedDate ? returnedDate.toISOString().split('T')[0] : '');

    startTransition(async () => {
        const result = await updateContrato(initialState, formData);
        if (result.success) {
            toast({ title: "Éxito", description: "Garantía actualizada." });
            onActionComplete();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.message, variant: 'destructive' });
        }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[480px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Gestionar Garantía del Contrato</DialogTitle>
          <DialogDescription>
            Administra el estado y el depósito de garantía.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guaranteeStatus" className="text-right">Estado</Label>
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
                    <Label htmlFor="montoGarantia" className="text-right">Monto</Label>
                    <Input 
                      id="montoGarantia" 
                      type="number" 
                      step="0.01" 
                      value={amount || ''}
                      onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="col-span-3" 
                    />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="monedaGarantia" className="text-right">Moneda</Label>
                    <Select name="monedaGarantia" defaultValue={contrato.monedaGarantia || 'USD'}>
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
                    <Label className="text-right">Fecha Recibida</Label>
                    <div className="col-span-3">
                        <DatePicker date={receivedDate} onDateSelect={setReceivedDate} placeholder="Fecha de recepción" />
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Fecha Devuelta</Label>
                    <div className="col-span-3">
                        <DatePicker date={returnedDate} onDateSelect={setReturnedDate} placeholder="Fecha de devolución" />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <SubmitButton isPending={isPending} />
            </DialogFooter>
        </form>
        {clientError && (
            <Alert variant="destructive" className="mt-4">
                <AlertDescription>{clientError}</AlertDescription>
            </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
