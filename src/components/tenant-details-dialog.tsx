
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tenant, Origin } from '@/lib/data';
import { Mail, Phone, Home, User, Globe, Notebook } from 'lucide-react';

interface TenantDetailsDialogProps {
  tenant: Tenant | undefined;
  origin?: Origin;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const formatWhatsAppLink = (phone: string | null | undefined, countryCode: string | null | undefined) => {
    if (!phone) return null;
    const code = (countryCode || '54').replace(/[^0-9]/g, '');
    const phoneNum = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${code}${phoneNum}`;
};

export function TenantDetailsDialog({ tenant, origin, isOpen, onOpenChange }: TenantDetailsDialogProps) {
  if (!tenant) return null;

  const waLink = formatWhatsAppLink(tenant.phone, tenant.countryCode);
  const telLink = `tel:${(tenant.countryCode || '+54').replace('+', '')}${tenant.phone?.replace(/[^0-9]/g, '')}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Ficha del Inquilino
          </DialogTitle>
          <DialogDescription>
            Detalles de contacto y personales de {tenant.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <h3 className="text-xl font-semibold text-primary">{tenant.name}</h3>
            <div className="space-y-2 text-sm">
                {tenant.dni && (
                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>DNI: {tenant.dni}</span>
                    </div>
                )}
                 {origin && (
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: origin.color }} />
                        <span>Origen: {origin.name}</span>
                    </div>
                )}
                {tenant.email && (
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${tenant.email}`} className="text-primary hover:underline">{tenant.email}</a>
                    </div>
                )}
                {tenant.phone && (
                     <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={telLink} className="text-primary hover:underline">{tenant.countryCode || '+54'} {tenant.phone}</a>
                    </div>
                )}
                 {(tenant.address || tenant.city) && (
                    <div className="flex items-start gap-3">
                        <Home className="h-4 w-4 text-muted-foreground mt-1" />
                        <span>{tenant.address}, {tenant.city}</span>
                    </div>
                )}
                {tenant.country && (
                     <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.country}</span>
                    </div>
                )}
                {tenant.notes && (
                    <div className="flex items-start gap-3">
                        <Notebook className="h-4 w-4 text-muted-foreground mt-1" />
                         <p className="text-sm bg-muted/50 p-2 rounded-md whitespace-pre-wrap">{tenant.notes}</p>
                    </div>
                )}
            </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
            {tenant.email && (
                 <Button asChild>
                    <a href={`mailto:${tenant.email}`}>
                        <Mail className="mr-2 h-4 w-4" /> Enviar Email
                    </a>
                </Button>
            )}
             {waLink && (
                 <Button asChild variant="secondary" className="bg-green-500 hover:bg-green-600 text-white">
                    <a href={waLink} target="_blank" rel="noopener noreferrer">
                        <Phone className="mr-2 h-4 w-4" /> Enviar WhatsApp
                    </a>
                </Button>
            )}
             {tenant.phone && (
                 <Button asChild variant="outline">
                    <a href={telLink}>
                        <Phone className="mr-2 h-4 w-4" /> Llamar
                    </a>
                </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
