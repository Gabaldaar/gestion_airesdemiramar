

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTenants, getBookings, Tenant, BookingWithDetails } from "@/lib/data";
import { TenantAddForm } from "@/components/tenant-add-form";
import TenantsClient from "@/components/tenants-client";


export default async function TenantsPage() {
  const [tenants, bookings] = await Promise.all([
    getTenants(),
    getBookings()
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inquilinos</CardTitle>
          <CardDescription>
            Administra y filtra la información de tus inquilinos.
          </CardDescription>
        </div>
        <TenantAddForm />
      </CardHeader>
      <CardContent>
        <TenantsClient initialTenants={tenants} allBookings={bookings} />
      </CardContent>
    </Card>
  );
}
