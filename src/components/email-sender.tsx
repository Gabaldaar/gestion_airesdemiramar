
'use client';

import { useEffect, useState, useMemo, useActionState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookingWithDetails, EmailTemplate, getEmailTemplates, Payment } from '@/lib/data';
import { sendEmailAction } from '@/lib/actions';
import { Mail, Loader2, Send, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    // Ensure we parse the string as UTC to avoid timezone shifts
    const date = new Date(dateString);
    return format(date, "dd 'de' LLLL 'de' yyyy", { locale: es });
};

const formatCurrency = (amount: number | null | undefined, currency: 'USD' | 'ARS' = 'USD') => {
    if (amount === null || typeof amount === 'undefined') return 'N/A';
    
    // Use a format that displays the currency code (USD, ARS) to avoid ambiguity.
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'code', // This is the key change
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    
    // Using a specific locale like 'es-AR' or 'en-US' can still sometimes default to symbols.
    // By splitting and rebuilding, we enforce the "USD 1,234.56" format.
    const formatter = new Intl.NumberFormat('en-US', options);
    const parts = formatter.formatToParts(amount);
    
    const currencyPart = parts.find(p => p.type === 'currency');
    const literalPart = parts.find(p => p.type === 'literal');
    const valuePart = parts.filter(p => p.type !== 'currency' && p.type !== 'literal').map(p => p.value).join('');

    return `${currencyPart?.value} ${valuePart}`;
};


interface EmailSenderProps {
    booking: BookingWithDetails;
    payment?: Payment;
}

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
                    Enviando...
                </>
            ) : (
                <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Email
                </>
            )}
        </Button>
    )
}

export function EmailSender({ booking, payment }: EmailSenderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [processedSubject, setProcessedSubject] = useState('');
  const [processedBody, setProcessedBody] = useState('');

  const [state, formAction] = useActionState(sendEmailAction, initialState);

  useEffect(() => {
    if (isOpen) {
      getEmailTemplates().then(setTemplates);
      // Auto-select "Confirmación de Pago" template if a payment is provided
      if (payment) {
        getEmailTemplates().then(templates => {
            const paymentTemplate = templates.find(t => t.name === 'Confirmación de Pago');
            if (paymentTemplate) {
                setSelectedTemplateId(paymentTemplate.id);
            }
        });
      }
    } else {
        // Reset state when closed
        setSelectedTemplateId('');
        setProcessedBody('');
        setProcessedSubject('');
    }
  }, [isOpen, payment]);

  const replacements = useMemo(() => {
      if (!booking) return {};
      
      const baseReplacements: { [key: string]: string } = {
        '{{inquilino.nombre}}': booking.tenant?.name || 'N/A',
        '{{propiedad.nombre}}': booking.property?.name || 'N/A',
        '{{fechaCheckIn}}': formatDate(booking.startDate),
        '{{fechaCheckOut}}': formatDate(booking.endDate),
        '{{montoReserva}}': formatCurrency(booking.amount, booking.currency),
        '{{saldoReserva}}': formatCurrency(booking.balance, booking.currency),
        '{{montoGarantia}}': formatCurrency(booking.guaranteeAmount, booking.guaranteeCurrency),
        '{{fechaGarantiaRecibida}}': formatDate(booking.guaranteeReceivedDate),
        '{{fechaGarantiaDevuelta}}': formatDate(booking.guaranteeReturnedDate),
        // Default empty values for payment fields
        '{{montoPago}}': '',
        '{{fechaPago}}': '',
      };

      if (payment) {
          const paymentCurrency = payment.originalArsAmount ? 'ARS' : 'USD';
          const paymentAmount = payment.originalArsAmount || payment.amount;
          
          baseReplacements['{{montoPago}}'] = formatCurrency(paymentAmount, paymentCurrency);
          baseReplacements['{{fechaPago}}'] = formatDate(payment.date);
      }

      return baseReplacements;

  }, [booking, payment]);


  useEffect(() => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
        let subject = selectedTemplate.subject;
        let body = selectedTemplate.body;
        for (const key in replacements) {
            const typedKey = key as keyof typeof replacements;
            subject = subject.replace(new RegExp(typedKey, 'g'), replacements[typedKey]);
            body = body.replace(new RegExp(typedKey, 'g'), replacements[typedKey]);
        }
        setProcessedSubject(subject);
        setProcessedBody(body);
    } else {
        setProcessedSubject('');
        setProcessedBody('');
    }
  }, [selectedTemplateId, templates, replacements]);
  
   useEffect(() => {
    if (state.success) {
      // Close the dialog after a short delay to show the success message
      setTimeout(() => setIsOpen(false), 2000);
    }
  }, [state.success]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!booking.tenant?.email}>
          <Mail className="h-4 w-4" />
          <span className="sr-only">Enviar Email</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Enviar Email al Inquilino</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla para componer el email. El envío se realizará desde el servidor.
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction}>
            <input type="hidden" name="to" value={booking.tenant?.email || ''} />
            <input type="hidden" name="subject" value={processedSubject} />
            <input type="hidden" name="body" value={processedBody} />

            <div className="space-y-4 py-4">
                <div>
                    <label htmlFor="template" className='block text-sm font-medium mb-1'>Plantilla</label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una plantilla..." />
                        </SelectTrigger>
                        <SelectContent>
                            {templates.map(template => (
                                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {selectedTemplateId && (
                     <div className="space-y-4 border rounded-lg p-4">
                        <div>
                            <label htmlFor="subject-preview" className='block text-sm font-medium mb-1'>Asunto</label>
                            <div id="subject-preview" className="w-full p-2 border rounded-md bg-muted text-sm">{processedSubject}</div>
                        </div>
                         <div>
                            <label htmlFor="body-preview" className='block text-sm font-medium mb-1'>Vista Previa del Email</label>
                             <div 
                                id="body-preview" 
                                className="w-full p-4 border rounded-md bg-white text-black text-sm h-80 overflow-y-auto"
                                dangerouslySetInnerHTML={{ __html: processedBody }}
                            />
                        </div>
                     </div>
                )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <SubmitButton />
            </DialogFooter>
        </form>
         {state.message && (
            <Alert variant={state.success ? 'default' : 'destructive'} className="mt-4 bg-opacity-90">
                <AlertTriangle className={`h-4 w-4 ${state.success ? 'text-green-500' : 'text-destructive'}`} />
                <AlertTitle>{state.success ? 'Éxito' : 'Error'}</AlertTitle>
                <AlertDescription>
                   {state.message}
                </AlertDescription>
            </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
