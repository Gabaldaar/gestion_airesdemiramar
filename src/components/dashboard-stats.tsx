import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2, Users, Banknote, CheckCircle, Info, Calendar, FileText, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/useTranslation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MonthlyBreakdownItem } from "@/app/page"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import Link from "next/link"

interface DashboardStatsProps {
  monthlyStats?: Record<string, { received: number, pending: number, items: MonthlyBreakdownItem[] }>;
  totalProperties: number;
  totalTenants: number;
  occupiedPropertiesCount: number;
}

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    return `${currency} ${Math.round(amount)}`;
  }
};

export default function DashboardStats({
  monthlyStats = {},
  totalProperties,
  totalTenants,
  occupiedPropertiesCount
}: DashboardStatsProps) {
  const { t } = useTranslation();
  
  // Ocupación calculada
  const occupancyPercentage = totalProperties > 0 ? (occupiedPropertiesCount / totalProperties) * 100 : 0;
  
  // Filtrar monedas con actividad relevante
  const activeCurrencies = Object.keys(monthlyStats || {}).filter(cur => 
    monthlyStats[cur].received > 0.01 || monthlyStats[cur].pending > 0.01
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* CARD OCUPACION */}
      <Card className="overflow-hidden border-2 border-primary/20 shadow-sm transition-all hover:shadow-md group">
        <CardHeader className="bg-primary/5 py-3 px-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-wider text-primary">{t('dashboard.stats.occupancy')}</CardTitle>
          <Building2 className="h-4 w-4 text-primary opacity-70 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary">{Math.round(occupancyPercentage)}%</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase">{t('dashboard.stats.of')} total</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-1000" 
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
              {occupiedPropertiesCount} {t('dashboard.stats.occupied_units')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CARD INGRESOS DEL MES */}
      <Card className="overflow-hidden border-2 border-green-500/30 shadow-sm transition-all hover:shadow-md group">
        <CardHeader className="bg-green-500/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-wider text-green-700">{t('dashboard.stats.collections')}</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent className="p-4 space-y-3">
            {activeCurrencies.length > 0 ? activeCurrencies.map((cur) => (
                <div key={cur} className="border-b last:border-0 pb-2 last:pb-0">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs font-black text-green-700">{cur}</span>
                        <span className="text-lg font-black text-foreground">{formatCurrency(monthlyStats[cur].received, cur)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] uppercase font-bold text-muted-foreground">
                        <span className="flex items-center gap-1">
                             {t('dashboard.stats.pending_month')}:
                             {monthlyStats[cur].pending > 1 && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="p-0.5 rounded-full hover:bg-zinc-200 transition-colors">
                                            <Info className="h-3 w-3 text-orange-600" />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2">
                                                <Banknote className="h-5 w-5 text-orange-600" />
                                                Saldos Pendientes ({cur})
                                            </DialogTitle>
                                            <DialogDescription>
                                                Lista de alquileres que vencen este mes y aún no han sido cancelados.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-3 py-4 max-h-[50vh] overflow-y-auto pr-2">
                                            {monthlyStats[cur].items.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border bg-muted/30">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="outline" className="text-[8px] h-4 uppercase px-1 font-bold">
                                                                {item.type === 'temporary' ? t('bookings.tabs.temporary') : t('bookings.tabs.contracts')}
                                                            </Badge>
                                                            <span className="text-[9px] font-bold text-muted-foreground">{item.property}</span>
                                                        </div>
                                                        <p className="font-bold text-sm truncate">{item.name}</p>
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-2.5 w-2.5" /> Vence: {item.date}
                                                        </p>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="font-black text-orange-600">{formatCurrency(item.amount, cur)}</p>
                                                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] uppercase font-bold" asChild>
                                                            <Link href={item.type === 'temporary' ? '/bookings' : `/contratos/${item.id.includes('-') ? item.id.split('-')[0] : item.id}`}>
                                                                Cobrar <ChevronRight className="h-2 w-2 ml-0.5" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                             )}
                        </span>
                        <span className={cn(monthlyStats[cur].pending > 1 ? "text-orange-600" : "")}>
                            {formatCurrency(monthlyStats[cur].pending, cur)}
                        </span>
                    </div>
                </div>
            )) : (
                <div className="py-2 text-center text-xs text-muted-foreground italic">
                    Sin cobros este mes
                </div>
            )}
        </CardContent>
      </Card>

      {/* CARD PROPIEDADES */}
      <Card className="overflow-hidden border-2 border-blue-500/30 shadow-sm transition-all hover:shadow-md group">
        <CardHeader className="bg-blue-500/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-wider text-blue-700">{t('dashboard.stats.properties')}</CardTitle>
          <Building2 className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-2xl font-black text-blue-800">{totalProperties}</div>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight mt-1">
            {t('dashboard.stats.total_units')}
          </p>
          <div className="mt-3 flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase">Unidades Activas</span>
          </div>
        </CardContent>
      </Card>

      {/* CARD INQUILINOS */}
      <Card className="overflow-hidden border-2 border-zinc-200 shadow-sm transition-all hover:shadow-md group">
        <CardHeader className="bg-zinc-500/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-wider text-zinc-700">{t('dashboard.stats.tenants')}</CardTitle>
          <Users className="h-4 w-4 text-zinc-600 group-hover:scale-110 transition-transform" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-2xl font-black text-zinc-800">+{totalTenants}</div>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight mt-1">
            {t('dashboard.stats.total_records')}
          </p>
          <div className="mt-3 flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase">Directorio Activo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
