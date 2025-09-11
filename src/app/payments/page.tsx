
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { getAllPaymentsWithDetails, getProperties, PaymentWithDetails, Property } from "@/lib/data";
import PaymentsClient from "@/components/payments-client";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";

interface PaymentsData {
    allPayments: PaymentWithDetails[];
    properties: Property[];
}

export default function PaymentsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<PaymentsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                getAllPaymentsWithDetails(),
                getProperties(),
            ]).then(([allPayments, properties]) => {
                setData({ allPayments, properties });
                setLoading(false);
            });
        }
    }, [user]);

    if (loading || !data) {
        return <p>Cargando ingresos...</p>;
    }


  return (
    <Card>
    <CardHeader>
        <CardTitle>Ingresos</CardTitle>
        <CardDescription>Consulta y filtra todos los pagos recibidos.</CardDescription>
    </CardHeader>
    <CardContent>
        <PaymentsClient 
        initialPayments={data.allPayments} 
        properties={data.properties} 
        />
    </CardContent>
    </Card>
  );
}
