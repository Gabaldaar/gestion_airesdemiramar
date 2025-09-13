'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Building, Users, TrendingUp, Wallet } from 'lucide-react';

interface DashboardStatsProps {
  totalIncomeArs: number;
  totalNetResultArs: number;
  totalIncomeUsd: number;
  totalNetResultUsd: number;
  totalProperties: number;
  totalTenants: number;
}

const StatCard = ({ title, value, icon: Icon, subValue, subTitle }: { title: string, value: string, icon: React.ElementType, subValue?: string, subTitle?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {subTitle && <p className="text-xs text-muted-foreground">{subTitle}: {subValue}</p>}
        </CardContent>
    </Card>
);


export default function DashboardStats({
    totalIncomeArs,
    totalNetResultArs,
    totalIncomeUsd,
    totalNetResultUsd,
    totalProperties,
    totalTenants
}: DashboardStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Ingresos Totales (ARS)"
                value={`$${totalIncomeArs.toLocaleString('es-AR')}`}
                icon={Wallet}
                subTitle="Resultado Neto"
                subValue={`$${totalNetResultArs.toLocaleString('es-AR')}`}
            />
            <StatCard
                title="Ingresos Totales (USD)"
                value={`$${totalIncomeUsd.toLocaleString('es-AR')}`}
                icon={DollarSign}
                subTitle="Resultado Neto"
                subValue={`$${totalNetResultUsd.toLocaleString('es-AR')}`}
            />
            <StatCard
                title="Propiedades"
                value={totalProperties.toString()}
                icon={Building}
            />
            <StatCard
                title="Inquilinos"
                value={totalTenants.toString()}
                icon={Users}
            />
      </div>
    );
}