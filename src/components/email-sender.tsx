'use client';

import { useEffect, useState, useMemo, ReactNode, useCallback } from 'react';
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
import { BookingWithDetails, EmailTemplate, Payment, getEmailSettings, getEmailTemplates } from '@/lib/data';
import { AlertTriangle, Send, Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { parseDateSafely } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { useTranslation } from '@/i18n/useTranslation';

// --- Number to Words Conversion Logic ---
const Millones = (num: number) => {
    let divisor = 1000000;
    let strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES');
    let strMiles = Miles(num % divisor);
    if (strMillones === '') return strMiles;
    return (strMillones + ' ' + strMiles).trim();
};

const Miles = (num: number) => {
    let divisor = 1000;
    let strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
    let strCentenas = Centenas(num % divisor);
    if (strMiles === '') return strCentenas;
    return (strMiles + ' ' + strCentenas).trim();
};

const Seccion = (num: number, divisor: number, strSingular: string, strPlural: string) => {
    let cientos = Math.floor(num / divisor);
    let letras = '';
    if (cientos > 0) {
        if (cientos > 1) letras = Centenas(cientos) + ' ' + strPlural;
        else letras = strSingular;
    }
    return letras;
};

const Centenas = (num: number) => {
    let centenas = Math.floor(num / 100);
    let decenas = num % 100;
    switch (centenas) {
        case 1: if (decenas > 0) return 'CIENTO ' + Decenas(decenas); return 'CIEN';
        case 2: return 'DOSCIENTOS ' + Decenas(decenas);
        case 3: return 'TRESCIENTOS ' + Decenas(decenas);
        case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
        case 5: return 'QUINIENTOS ' + Decenas(decenas);
        case 6: return 'SEISCIENTOS ' + Decenas(decenas);
        case 7: return 'SETECIENTOS ' + Decenas(decenas);
        case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
        case 9: return 'NOVECIENTOS ' + Decenas(decenas);
        default: return Decenas(decenas);
    }
};

const Decenas = (num: number) => {
  let decena = Math.floor(num / 10);
  let unidad = num % 10;
  switch (decena) {
    case 1:
      switch (unidad) {
        case 0: return 'DIEZ'; case 1: return 'ONCE'; case 2: return 'DOCE'; case 3: return 'TRECE'; case 4: return 'CATORCE'; case 5: return 'QUINCE';
        default: return 'DIECI' + Unidades(unidad);
      }
    case 2: return unidad === 0 ? 'VEINTE' : 'VEINTI' + Unidades(unidad);
    case 3: return 'TREINTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 4: return 'CUARENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 5: return 'CINCUENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 6: return 'SESENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 7: return 'SETENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 8: return 'OCHENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    case 9: return 'NOVENTA' + (unidad > 0 ? ' Y ' + Unidades(unidad) : '');
    default: return Unidades(unidad);
  }
};

const Unidades = (num: number) => {
  switch (num) {
    case 1: return 'UN'; case 2: return 'DOS'; case 3: return 'TRES'; case 4: return 'CUATRO'; case 5: return 'CINCO'; case 6: return 'SEIS'; case 7: return 'SIETE'; case 8: return 'OCHO'; case 9: return 'NUEVE';
    default: return '';
  }
};

const numeroALetras = (num: number) => {
    if (isNaN(num)) return '';
    let result = Math.floor(num) === 0 ? 'CERO' : Millones(Math.floor(num));
    const centavos = Math.round(num * 100) - Math.floor(num) * 100;
    if (centavos > 0) result += ' CON ' + Millones(centavos);
    return result.trim();
};
// --- End of Conversion Logic ---


const formatDateForEmail = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = parseDateSafely(dateString);
    if (!date) return 'Fecha inválida';
    return format(date, "dd 'de' LLLL 'de' yyyy", { locale: es });
};

const formatCurrencyForEmail = (amount: number | null | undefined, currency: string = 'USD') => {
    if (amount === null || typeof amount === 'undefined') return 'N/A';
    return new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};


interface EmailSenderProps {
    booking: BookingWithDetails;
    payment?: Payment;
    onOpenChange: (isOpen: boolean) => void;
    isOpen: boolean;
    children?: ReactNode;
}

export function EmailSender({ booking, payment, children, isOpen, onOpenChange }: EmailSenderProps) {
  const { t } = useTranslation();
  const { appUser, orgId } = useAuth();
  const isPersonalFlavor = appUser?.appFlavor !== 'commercial';

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [processedBody, setProcessedBody] = useState('');
  const [processedSubject, setProcessedSubject] = useState('');
  const [replyToEmail, setReplyToEmail] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const { tenant, property } = booking || {};

  const fetchTemplates = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
        const fetchedTemplates = await getEmailTemplates(orgId);
        setTemplates(fetchedTemplates);
        
        if (payment) {
            const paymentTemplate = fetchedTemplates.find(t => t.name.toLowerCase().includes('pago') || t.name.toLowerCase().includes('confirmación'));
            if (paymentTemplate) {
                setSelectedTemplateId(paymentTemplate.id);
            }
        }
    } catch (e) {
        console.error("Error fetching templates:", e);
    } finally {
        setLoading(false);
    }
  }, [payment, orgId]);

  useEffect(() => {
    if (isOpen && orgId) {
      fetchTemplates();
      if (isPersonalFlavor) {
        getEmailSettings(orgId).then(settings => {
            if (settings?.replyToEmail) {
                setReplyToEmail(settings.replyToEmail);
            }
        });
      }
    } else {
        setSelectedTemplateId('');
        setProcessedBody('');
        setProcessedSubject('');
    }
  }, [isOpen, isPersonalFlavor, fetchTemplates, orgId]);

  const replacements = useMemo(() => {
      if (!booking || !tenant || !property) return {};

      const amountInWords = booking.amount ? numeroALetras(booking.amount) : '';
      const guaranteeAmountInWords = numeroALetras(booking.guaranteeAmount ?? 0);
      
      const currencyNames: {[key: string]: string} = {
        'ARS': 'PESOS',
        'USD': 'DÓLARES ESTADOUNIDENSES',
      };

      const baseReplacements: { [key: string]: string } = {
        '{{inquilino.nombre}}': tenant.name,
        '{{inquilino.dni}}': tenant.dni || 'N/A',
        '{{inquilino.direccion}}': `${tenant.address || ''}, ${tenant.city || ''}`.trim().replace(/^,|,$/g, ''),
        '{{propiedad.nombre}}': property.name,
        '{{propiedad.direccion}}': property.address,
        '{{fechaCheckIn}}': formatDateForEmail(booking.startDate),
        '{{fechaCheckOut}}': formatDateForEmail(booking.endDate),
        '{{monto}}': formatCurrencyForEmail(booking.amount, booking.currency),
        '{{montoReserva}}': formatCurrencyForEmail(booking.amount, booking.currency),
        '{{saldoReserva}}': formatCurrencyForEmail(booking.balance, booking.currency),
        '{{montoEnLetras}}': amountInWords,
        '{{montoGarantia}}': formatCurrencyForEmail(booking.guaranteeAmount, booking.guaranteeCurrency || 'USD'),
        '{{montoGarantiaEnLetras}}': guaranteeAmountInWords,
        '{{moneda}}': booking.currency || '',
        '{{monedaNombre}}': currencyNames[booking.currency] || booking.currency,
        '{{monedaGarantia}}': booking.guaranteeCurrency || 'USD',
        '{{monedaGarantiaNombre}}': currencyNames[booking.guaranteeCurrency || 'USD'] || (booking.guaranteeCurrency || 'USD'),
        '{{propietario.nombre}}': property.ownerName || '',
        '{{propietario.dni}}': property.ownerDni || '',
        '{{propietario.domicilio}}': property.ownerAddress || '',
        '{{propietario.telefono}}': property.ownerPhone || '',
        '{{propietario.mail}}': property.ownerEmail || '',
        '{{fechaActual}}': format(new Date(), "dd 'de' LLLL 'de' yyyy", { locale: es }),
        '{{fechaGarantiaRecibida}}': formatDateForEmail(booking.guaranteeReceivedDate),
        '{{fechaGarantiaDevuelta}}': formatDateForEmail(booking.guaranteeReturnedDate),
      };

      // Marcadores dinámicos para campos personalizados (1-6)
      for (let i = 1; i <= 6; i++) {
        const labelKey = `customField${i}Label` as keyof typeof property;
        const valueKey = `customField${i}Value` as keyof typeof property;
        baseReplacements[`{{propiedad.customField${i}Label}}`] = (property[labelKey] as string) || '';
        baseReplacements[`{{propiedad.customField${i}Value}}`] = (property[valueKey] as string) || '';
      }

      if (payment) {
          const paymentCurrency = payment.originalArsAmount ? 'ARS' : 'USD';
          const paymentAmount = payment.originalArsAmount || payment.amount;
          
          baseReplacements['{{montoPago}}'] = formatCurrencyForEmail(paymentAmount, paymentCurrency);
          baseReplacements['{{fechaPago}}'] = formatDateForEmail(payment.date);
      }

      return baseReplacements;

  }, [booking, tenant, property, payment]);


  useEffect(() => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
        let subjectStr: string = String(selectedTemplate.subject);
        let bodyStr: string = String(selectedTemplate.body);

        for (const key in replacements) {
            subjectStr = subjectStr.replaceAll(key, replacements[key]);
            bodyStr = bodyStr.replaceAll(key, replacements[key]);
        }
        setProcessedSubject(subjectStr);
        setProcessedBody(bodyStr);
    } else {
        setProcessedBody('');
        setProcessedSubject('');
    }
  }, [selectedTemplateId, templates, replacements]);
  
  const handleOpenMailClient = () => {
    if (!tenant?.email) return;

    const subject = encodeURIComponent(processedSubject).replace(/'/g, "%27");
    const body = encodeURIComponent(processedBody).replace(/'/g, "%27");
    
    let mailtoLink = `mailto:${tenant.email}?subject=${subject}&body=${body}`;

    if (isPersonalFlavor && replyToEmail) {
      mailtoLink += `&reply-to=${encodeURIComponent(replyToEmail)}`;
    }

    window.location.href = mailtoLink;
    onOpenChange(false);
  };

  if (!booking || !tenant || !property) {
      return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('bookings.email_dialog.title').replace('{{name}}', tenant.name)}</DialogTitle>
          <DialogDescription>
            {t('bookings.email_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        
        {isPersonalFlavor && replyToEmail && (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>¡Atención!</AlertTitle>
                <AlertDescription>
                    Para asegurar que las respuestas lleguen a <span className="font-semibold">{replyToEmail}</span>, asegúrate de enviar este correo desde esa misma cuenta en tu cliente de email.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="space-y-4 py-4">
            <div>
                <label htmlFor="template" className='block text-sm font-medium mb-1'>{t('bookings.email_dialog.template_label')}</label>
                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}
                    </div>
                ) : (
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('bookings.email_dialog.template_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {templates.map(template => (
                                <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                            ))}
                            {templates.length === 0 && (
                                <SelectItem value="none" disabled>No hay plantillas guardadas</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                )}
            </div>
            
            {selectedTemplateId && (
                 <div className="space-y-4 border rounded-lg p-4">
                    <div>
                        <label htmlFor="subject-preview" className='block text-sm font-medium mb-1'>{t('bookings.email_dialog.subject_label')}</label>
                        <div id="subject-preview" className="w-full p-2 border rounded-md bg-muted text-sm">{processedSubject}</div>
                    </div>
                     <div>
                        <label htmlFor="body-preview" className='block text-sm font-medium mb-1'>{t('bookings.email_dialog.preview_label')}</label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleOpenMailClient} disabled={!selectedTemplateId}>
                <Send className="mr-2 h-4 w-4" />
                {t('bookings.email_dialog.send_button')}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
