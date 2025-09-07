
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookingWithDetails, EmailTemplate, getEmailTemplates, Payment } from '@/lib/data';
import { Mail } from 'lucide-react';
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
    
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    
    if (currency === 'ARS') {
        return new Intl.NumberFormat('es-AR', options).format(amount);
    }
    return new Intl.NumberFormat('en-US', options).format(amount);
};


interface EmailSenderProps {
    booking: BookingWithDetails;
    payment?: Payment;
}

export function EmailSender({ booking, payment }: EmailSenderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [processedSubject, setProcessedSubject] = useState('');
  const [processedBody, setProcessedBody] = useState('');

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
  
  const handleSendEmail = () => {
    if (!booking.tenant?.email) {
        alert("El inquilino no tiene una dirección de email registrada.");
        return;
    }
    const mailtoLink = `mailto:${booking.tenant.email}?subject=${encodeURIComponent(processedSubject)}&body=${encodeURIComponent(processedBody)}`;
    window.open(mailtoLink, '_blank');
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
          <DialogTitle>Enviar Email al Inquilino</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla para componer el email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            <div>
                <Label htmlFor="template">Plantilla</Label>
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
                        <Label htmlFor="subject-preview">Asunto</Label>
                        <Input id="subject-preview" value={processedSubject} readOnly />
                    </div>
                     <div>
                        <Label htmlFor="body-preview">Cuerpo del Email</Label>
                        <Textarea id="body-preview" value={processedBody} readOnly className="h-64" />
                    </div>
                 </div>
            )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSendEmail} disabled={!selectedTemplateId}>
            Abrir en Cliente de Correo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
