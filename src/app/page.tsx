
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Home, Calendar } from "lucide-react";
import { getProperties, getBookings } from "@/lib/data";

export default async function DashboardPage() {
  const properties = await getProperties();
  const bookings = await getBookings();
  const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total de ingresos generados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Propiedades
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de propiedades administradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed').length}</div>
            <p className="text-xs text-muted-foreground">
              Reservas confirmadas actualmente
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Resumen de Propiedades</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {/* Aquí iría un componente de gráfico, por ejemplo */}
            <p>Un gráfico mostrando la ocupación por propiedad.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Reservas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{booking.tenantName}</p>
                    <p className="text-sm text-muted-foreground">{properties.find(p => p.id === booking.propertyId)?.name}</p>
                  </div>
                  <div className="ml-auto font-medium">+${booking.totalPrice.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
