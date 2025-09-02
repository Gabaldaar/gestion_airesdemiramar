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
import { BookingForm } from "./_components/booking-form";

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
                <TabsTrigger value="expenses">Gastos</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="bookings" className="p-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Inquilino</TableHead>
                            <TableHead>Check-in</TableHead>
                            <TableHead>Check-out</TableHead>
                            <TableHead className="text-right">Pagos (USD)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.length > 0 ? bookings.map(b => (
                            <TableRow key={b.id}>
                                <TableCell className="font-medium">{b.tenantName}</TableCell>
                                <TableCell>{format(new Date(b.checkIn), "dd/MM/yyyy")}</TableCell>
                                <TableCell>{format(new Date(b.checkOut), "dd/MM/yyyy")}</TableCell>
                                <TableCell className="text-right">${b.payments.reduce((sum, p) => sum + (p.currency === 'ARS' ? p.amount / p.conversionRate : p.amount), 0).toFixed(2)} / ${b.amountUSD.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No hay reservas para esta propiedad.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
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
