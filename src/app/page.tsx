
import { getFinancialSummaryByProperty, getProperties, getTenants, getBookings } from "@/lib/data";
import DashboardStats from "@/components/dashboard-stats";
import DashboardRecentBookings from "@/components/dashboard-recent-bookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const [summary, properties, tenants, bookings] = await Promise.all([
    getFinancialSummaryByProperty(),
    getProperties(),
    getTenants(),
    getBookings(),
  ]);

  const totalIncome = summary.reduce((acc, item) => acc + item.totalIncome, 0);
  const totalNetResult = summary.reduce((acc, item) => acc + item.netResult, 0);
  const totalProperties = properties.length;
  const totalTenants = tenants.length;

  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="flex-1 space-y-4">
       <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
            <p className="text-muted-foreground">Un resumen de tu negocio de alquileres.</p>
        </div>
      </div>
      <DashboardStats
        totalIncome={totalIncome}
        totalNetResult={totalNetResult}
        totalProperties={totalProperties}
        totalTenants={totalTenants}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-7">
          <CardHeader>
            <CardTitle>Reservas Recientes</CardTitle>
            <CardDescription>
              Las últimas 5 reservas registradas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardRecentBookings bookings={recentBookings} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
