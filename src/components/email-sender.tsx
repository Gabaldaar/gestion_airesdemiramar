
'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Mail, Send } from 'lucide-react';
import { Textarea } from './ui/textarea';
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
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};


interface EmailSenderProps {
    booking: BookingWithDetails;
    payment?: Payment;
}

export function EmailSender({ booking, payment }: EmailSenderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [processedBody, setProcessedBody] = useState('');
  const [processedSubject, setProcessedSubject] = useState('');

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
        setProcessedBody('');
        setProcessedSubject('');
    }
  }, [selectedTemplateId, templates, replacements]);
  
  const handleOpenMailClient = () => {
    if (!booking.tenant?.email) return;

    const mailtoLink = `mailto:${booking.tenant.email}?subject=${encodeURIComponent(processedSubject)}&body=${encodeURIComponent(processedBody)}`;
    window.location.href = mailtoLink;
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!booking.tenant?.email}>
          <Mail className="h-4 w-4" />
          <span className="sr-only">Enviar Email</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preparar Email para el Inquilino</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla y revisa el contenido. El email se abrirá en tu cliente de correo.
          </DialogDescription>
        </DialogHeader>
        
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
                         <Textarea 
                            id="body-preview" 
                            className="w-full p-2 border rounded-md bg-muted text-sm h-60"
                            value={processedBody}
                            readOnly
                        />
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleOpenMailClient} disabled={!selectedTemplateId}>
                <Send className="mr-2 h-4 w-4" />
                Abrir en Cliente de Correo
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    