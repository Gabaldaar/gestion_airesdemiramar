import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getBookings, getProperties, getPropertyExpenses } from "@/lib/data"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DollarSign, Home, LogIn, TrendingDown, Users } from "lucide-react"

export default function Dashboard() {
  const properties = getProperties();
  const bookings = getBookings();
  const expenses = getPropertyExpenses();
  const now = new Date();

  const currentBookings = bookings.filter(b => new Date(b.checkIn) <= now && new Date(b.checkOut) > now);
  const upcomingBookings = bookings.filter(b => new Date(b.checkIn) > now && new Date(b.checkIn).getMonth() === now.getMonth()).sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
  
  const monthlyIncome = bookings.flatMap(b => b.payments)
    .filter(p => new Date(p.date).getMonth() === now.getMonth() && new Date(p.date).getFullYear() === now.getFullYear())
    .reduce((sum, p) => sum + (p.currency === 'ARS' ? p.amount / p.conversionRate : p.amount), 0);

  const monthlyExpenses = expenses
    .filter(e => new Date(e.date).getMonth() === now.getMonth() && new Date(e.date).getFullYear() === now.getFullYear())
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">Total de propiedades gestionadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Actual</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentBookings.length} / {properties.length}</div>
            <p className="text-xs text-muted-foreground">Propiedades ocupadas actualmente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos en USD este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos (Mes)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Gastos en USD este mes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <LogIn className="h-5 w-5" /> Próximos Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBookings.length > 0 ? upcomingBookings.slice(0, 5).map(booking => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{properties.find(p => p.id === booking.propertyId)?.name}</TableCell>
                    <TableCell>{booking.tenantName}</TableCell>
                    <TableCell>
                      {format(new Date(booking.checkIn), "d 'de' MMMM", { locale: es })}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">No hay check-ins próximos este mes.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Users className="h-5 w-5" /> Inquilinos Actuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Check-out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentBookings.length > 0 ? currentBookings.map(booking => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{properties.find(p => p.id === booking.propertyId)?.name}</TableCell>
                    <TableCell>{booking.tenantName}</TableCell>
                    <TableCell>
                      {format(new Date(booking.checkOut), "d 'de' MMMM", { locale: es })}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">No hay inquilinos actualmente.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
