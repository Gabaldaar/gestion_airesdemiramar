'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { PaymentWithDetails } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PaymentEditForm } from "./payment-edit-form";
import { PaymentDeleteForm } from "./payment-delete-form";

interface PaymentsListProps {
  payments: PaymentWithDetails[];
}

export default function PaymentsList({ payments }: PaymentsListProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (payments.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-8">No hay ingresos para mostrar con los filtros seleccionados.</p>;
  }

  // A simple page refresh is enough when server actions handle revalidation
  const handleAction = () => {
    window.location.reload();
  };

  const formatDate = (dateString: string) => {
    if (!isClient) {
      return ''; // Render nothing on the server to avoid mismatch
    }
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
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
  
  const totalAmountUSD = payments.reduce((acc, payment) => acc + payment.amount, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Propiedad</TableHead>
          <TableHead>Inquilino</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Monto (USD)</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{formatDate(payment.date)}</TableCell>
            <TableCell>{payment.propertyName || 'N/A'}</TableCell>
            <TableCell>{payment.tenantName || 'N/A'}</TableCell>
            <TableCell className="max-w-[300px] truncate">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                        <span className='block truncate'>{payment.description || '-'}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                        <p className="whitespace-pre-wrap max-w-xs">{payment.description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>
            <TableCell className="text-right font-medium">{formatCurrency(payment.amount, 'USD')}</TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <PaymentEditForm payment={payment} onPaymentUpdated={handleAction} />
                    <PaymentDeleteForm paymentId={payment.id} onPaymentDeleted={handleAction} />
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="font-bold bg-muted">
          <TableCell colSpan={4} className="text-right">Total</TableCell>
          <TableCell className="text-right">{formatCurrency(totalAmountUSD, 'USD')}</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
