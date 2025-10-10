'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialSummary } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import useWindowSize from '@/hooks/use-window-size';


interface FinancialSummaryChartProps {
  summary: FinancialSummary[];
  currency: 'ARS' | 'USD';
}

export default function FinancialSummaryChart({ summary, currency }: FinancialSummaryChartProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const chartData = summary.map(item => ({
    name: item.propertyName,
    'Resultado Neto': item.netResult,
    'Ingresos': item.totalIncome,
    'Gastos': item.totalPropertyExpenses + item.totalBookingExpenses,
    'Saldo': item.balance,
  }));

  const formatCurrency = (value: number) => {
    if (currency === 'USD') {
        return `USD ${new Intl.NumberFormat('es-AR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)}`;
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  const formatCurrencyShort = (value: number) => {
    const prefix = currency === 'USD' ? 'USD ' : '$';
    if (Math.abs(value) >= 1_000_000) {
        return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${prefix}${(value / 1_000).toFixed(0)}k`;
    }
    return `${prefix}${value}`;
  }


  return (
    <div className="h-[350px] w-full">
        <ChartContainer config={{}} className="w-full h-full">
            <BarChart 
                data={chartData} 
                margin={{ 
                    top: 20, 
                    right: isMobile ? 0 : 30, 
                    left: isMobile ? 0 : 20, 
                    bottom: 5 
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={isMobile ? formatCurrencyShort : formatCurrency} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        labelFormatter={(label) => `${label}`}
                        formatter={(value, name) => (
                            <div className='flex items-center gap-2'>
                                <span className='capitalize'>{name}:</span>
                                <span>{formatCurrency(value as number)}</span>
                            </div>
                        )}
                        />}
                />
                <Legend />
                <Bar dataKey="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Gastos" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Resultado Neto" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Saldo" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
        </ChartContainer>
    </div>
  );
}
