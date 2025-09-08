
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DollarSign, Building, Users, TrendingUp } from "lucide-react"

interface DashboardStatsProps {
  totalIncomeArs: number;
  totalNetResultArs: number;
  totalIncomeUsd: number;
  totalNetResultUsd: number;
  totalProperties: number;
  totalTenants: number;
}

export default function DashboardStats({
  totalIncomeArs,
  totalNetResultArs,
  totalIncomeUsd,
  totalNetResultUsd,
  totalProperties,
  totalTenants,
}: DashboardStatsProps) {

  const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    if (currency === 'USD') {
        return `USD ${new Intl.NumberFormat('es-AR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)}`;
    }
    // For ARS
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos Totales
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalIncomeUsd, 'USD')}</div>
          <p className="text-xs text-muted-foreground">
             {formatCurrency(totalIncomeArs, 'ARS')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Resultado Neto Total
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalNetResultUsd >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalNetResultUsd, 'USD')}</div>
           <p className={`text-xs ${totalNetResultArs >= 0 ? 'text-muted-foreground' : 'text-red-500'}`}>
            {formatCurrency(totalNetResultArs, 'ARS')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{totalProperties}</div>
          <p className="text-xs text-muted-foreground">
            Total de unidades gestionadas
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium"> Inquilinos </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{totalTenants}</div>
          <p className="text-xs text-muted-foreground">
            Total de inquilinos registrados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

    
