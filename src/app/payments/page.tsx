
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getAllPaymentsWithDetails, getProperties } from "@/lib/data";
import PaymentsClient from "@/components/payments-client";

export default async function PaymentsPage() {
  const [allPayments, properties] = await Promise.all([
    getAllPaymentsWithDetails(),
    getProperties(),
  ]);

  return (
    <Card>
    <CardHeader>
        <CardTitle>Ingresos</CardTitle>
        <CardDescription>Consulta y filtra todos los pagos recibidos.</CardDescription>
    </CardHeader>
    <CardContent>
        <PaymentsClient 
        initialPayments={allPayments} 
        properties={properties} 
        />
    </CardContent>
    </Card>
  );
}
