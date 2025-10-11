

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
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './ui/card';
import { PaymentWithDetails } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PaymentEditForm } from "./payment-edit-form";
import { PaymentDeleteForm } from "./payment-delete-form";
import useWindowSize from '@/hooks/use-window-size';
import { cn } from '@/lib/utils';

interface PaymentsListProps {
  payments: PaymentWithDetails[];
}

// A simple page refresh is enough when server actions handle revalidation
const handleAction = () => {
    window.location.reload();
};

const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
    const options: Intl.NumberFormatOptions = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    if (currency === 'ARS') {
        return new Intl.NumberFormat('es-AR', { ...options, style: 'currency', currency: 'ARS'}).format(amount);
    }
    return `USD ${new Intl.NumberFormat('es-AR', options).format(amount)}`;
};

const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
};

function PaymentActions({ payment }: { payment: PaymentWithDetails }) {
    return (
        <div className="flex items-center justify-end gap-2">
            <PaymentEditForm payment={payment} onPaymentUpdated={handleAction} />
            <PaymentDeleteForm paymentId={payment.id} onPaymentDeleted={handleAction} />
        </div>
    );
}

function PaymentRow({ payment }: { payment: PaymentWithDetails }) {
     return (
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
                <PaymentActions payment={payment} />
            </TableCell>
        </TableRow>
     )
}

function PaymentCard({ payment }: { payment: PaymentWithDetails }) {
    return (
        <Card>
            <CardHeader className="p-4">
                 <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{payment.propertyName || 'N/A'}</CardTitle>
                        <CardDescription>{payment.tenantName || 'N/A'}</CardDescription>
                    </div>
                    <span className="font-bold text-lg text-primary">{formatCurrency(payment.amount, 'USD')}</span>
                </div>
            </CardHeader>
            <CardContent className="p-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-medium">{formatDate(payment.date)}</span>
                </div>
                 {payment.description && (
                    <div className="flex flex-col space-y-1">
                        <span className="text-muted-foreground">Descripción</span>
                        <p className="font-medium text-sm p-2 bg-muted/50 rounded-md whitespace-pre-wrap">{payment.description}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 justify-end">
                <PaymentActions payment={payment} />
            </CardFooter>
        </Card>
    )
}


export default function PaymentsList({ payments }: PaymentsListProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  if (payments.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-8">No hay pagos para mostrar con los filtros seleccionados.</p>;
  }

  const totalAmountUSD = payments.reduce((acc, payment) => acc + payment.amount, 0);

    if (isMobile) {
        return (
            <div className="space-y-4">
                <Card className="bg-muted">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Recaudado</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmountUSD, 'USD')}</p>
                    </CardContent>
                </Card>
                {payments.map(payment => (
                    <PaymentCard key={payment.id} payment={payment} />
                ))}
            </div>
        )
    }

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
            <PaymentRow key={payment.id} payment={payment} />
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

