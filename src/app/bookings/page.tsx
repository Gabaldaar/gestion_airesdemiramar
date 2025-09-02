import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getBookings, getProperties } from "@/lib/data"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function BookingsPage() {
  const bookings = getBookings();
  const properties = getProperties();

  const getStatus = (checkIn: string, checkOut: string): { text: string; variant: "default" | "secondary" | "outline" | "destructive" } => {
    const now = new Date();
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (now < startDate) return { text: "Próxima", variant: "secondary" };
    if (now >= startDate && now <= endDate) return { text: "En curso", variant: "default" };
    return { text: "Finalizada", variant: "outline" };
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold font-headline">Todas las Reservas</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propiedad</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.sort((a,b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()).map(booking => {
              const property = properties.find(p => p.id === booking.propertyId);
              const status = getStatus(booking.checkIn, booking.checkOut);
              return (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{property?.name || 'N/A'}</TableCell>
                  <TableCell>{booking.tenantName}</TableCell>
                  <TableCell>{format(new Date(booking.checkIn), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{format(new Date(booking.checkOut), "dd/MM/yyyy")}</TableCell>
                  <TableCell><Badge variant={status.variant}>{status.text}</Badge></TableCell>
                  <TableCell className="text-right">${booking.amountUSD.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
