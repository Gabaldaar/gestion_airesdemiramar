
import Image from "next/image";
import {
  getBookingsByPropertyId,
  getExpensesByPropertyId,
  getPropertyById,
} from "@/lib/data";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DollarSign, HandCoins } from "lucide-react";

import { BookingForm } from "./_components/booking-form";
import { AddPaymentForm } from "./_components/add-payment-form";
import { AddRentalExpenseForm } from "./_components/add-rental-expense-form";
import type { Booking } from "@/lib/types";

export default function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const propertyId = parseInt(params.id, 10);
  const property = getPropertyById(propertyId);
  if (!property) {
    notFound();
  }

  const bookings = getBookingsByPropertyId(propertyId);
  const expenses = getExpensesByPropertyId(propertyId);

  const getBookingStatus = (checkIn: string, checkOut: string): { text: string; variant: "default" | "secondary" | "outline" | "destructive" } => {
    const now = new Date();
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (now < startDate) return { text: "Próxima", variant: "secondary" };
    if (now >= startDate && now <= endDate) return { text: "En curso", variant: "default" };
    return { text: "Finalizada", variant: "outline" };
  };
  
  const totalPaid = (booking: Booking) => booking.payments.reduce((sum, p) => sum + (p.currency === 'ARS' ? p.amount / p.conversionRate : p.amount), 0);
  const outstandingAmount = (booking: Booking) => booking.amountUSD - totalPaid(booking);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
           <div className="relative aspect-video w-full">
            <Image
              src={property.imageUrl}
              alt={`Foto de ${property.name}`}
              fill
              className="rounded-lg object-cover"
              data-ai-hint="house interior"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-headline">{property.name}</h1>
          <p className="text-lg text-muted-foreground">{property.address}</p>
          <div className="mt-4">
            <BookingForm property={property} />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="bookings">
            <div className="p-6 border-b">
              <TabsList>
                <TabsTrigger value="bookings">Reservas</TabsTrigger>
                <TabsTrigger value="expenses">Gastos de la Propiedad</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="bookings" className="p-6 space-y-4">
               {bookings.sort((a,b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()).map(b => (
                <Card key={b.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {b.tenantName} 
                          <Badge variant={getBookingStatus(b.checkIn, b.checkOut).variant}>
                            {getBookingStatus(b.checkIn, b.checkOut).text}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(b.checkIn), "dd/MM/yyyy")} - {format(new Date(b.checkOut), "dd/MM/yyyy")}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <AddPaymentForm booking={b} />
                        <AddRentalExpenseForm booking={b} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                        <div>
                            <p className="text-sm text-muted-foreground">Monto Total Reserva</p>
                            <p className="text-2xl font-bold">${b.amountUSD.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                            <p className={`text-2xl font-bold ${outstandingAmount(b) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                ${outstandingAmount(b).toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4" /> Pagos Registrados</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Monto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {b.payments.map(p => (
                              <TableRow key={p.id}>
                                <TableCell>{format(new Date(p.date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{p.currency} {p.amount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                             {b.payments.length === 0 && (
                                <TableRow><TableCell colSpan={2} className="text-center">No hay pagos</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2"><HandCoins className="h-4 w-4" /> Gastos del Alquiler</h4>
                         <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descripción</TableHead>
                              <TableHead>Monto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {b.rentalExpenses.map(e => (
                              <TableRow key={e.id}>
                                <TableCell>{e.description}</TableCell>
                                <TableCell>{e.currency} {e.amount.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            {b.rentalExpenses.length === 0 && (
                                <TableRow><TableCell colSpan={2} className="text-center">No hay gastos</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-center text-muted-foreground py-8">No hay reservas para esta propiedad.</p>
              )}
            </TabsContent>
            <TabsContent value="expenses" className="p-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Monto (USD)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.length > 0 ? expenses.map(e => (
                             <TableRow key={e.id}>
                                <TableCell>{format(new Date(e.date), "dd/MM/yyyy")}</TableCell>
                                <TableCell>{e.description}</TableCell>
                                <TableCell className="text-right">${e.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">No hay gastos para esta propiedad.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
