import MainLayout from "@/components/main-layout";
import { getFinancialSummaryByProperty, getProperties, getTenants, getBookings, BookingWithDetails } from "@/lib/data";
import DashboardStats from "@/components/dashboard-stats";
import DashboardRecentBookings from "@/components/dashboard-recent-bookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardCurrentBookings from "@/components/dashboard-current-bookings";

export default async function DashboardPage() {
  const [summaryByCurrency, properties, tenants, bookings] = await Promise.all([
    getFinancialSummaryByProperty({}),
    getProperties(),
    getTenants(),
    getBookings(),
  ]);

  const totalIncomeArs = summaryByCurrency.ars.reduce((acc, item) => acc + item.totalIncome, 0);
  const totalNetResultArs = summaryByCurrency.ars.reduce((acc, item) => acc + item.netResult, 0);
  const totalIncomeUsd = summaryByCurrency.usd.reduce((acc, item) => acc + item.totalIncome, 0);
  const totalNetResultUsd = summaryByCurrency.usd.reduce((acc, item) => acc + item.netResult, 0);

  const totalProperties = properties.length;
  const totalTenants = tenants.length;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcomingBookings = bookings
    .filter(b => new Date(b.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const currentBookings = bookings
    .filter(b => {
        const startDate = new Date(b.startDate);
        const endDate = new Date(b.endDate);
        return today >= startDate && today <= endDate;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());


  return (
    <MainLayout>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
                <p className="text-muted-foreground">Un resumen de tu negocio de alquileres.</p>
            </div>
          </div>
          <DashboardStats
            totalIncomeArs={totalIncomeArs}
            totalNetResultArs={totalNetResultArs}
            totalIncomeUsd={totalIncomeUsd}
            totalNetResultUsd={totalNetResultUsd}
            totalProperties={totalProperties}
            totalTenants={totalTenants}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4">
              <CardHeader>
                <CardTitle>Reservas en Curso</CardTitle>
                <CardDescription>
                  Reservas activas en este momento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardCurrentBookings bookings={currentBookings} />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3">
              <CardHeader>
                <CardTitle>Próximas Reservas</CardTitle>
                <CardDescription>
                  Las próximas 5 reservas agendadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardRecentBookings bookings={upcomingBookings} />
              </CardContent>
            </Card>
          </div>
        </div>
    </MainLayout>
  );
}
