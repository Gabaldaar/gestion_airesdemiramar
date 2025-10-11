

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
    'Pagos': item.totalIncome,
    'Gastos': (item.totalPropertyExpenses + item.totalBookingExpenses),
    'Neto': item.netResult,
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
    const prefix = currency === 'USD' ? 'U$S' : '$';
    if (Math.abs(value) >= 1_000_000) {
        return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${prefix}${(value / 1_000).toFixed(0)}k`;
    }
    return `${prefix}${value}`;
  }


  return (
    <div className="h-[450px] w-full">
        <ChartContainer config={{}} className="w-full h-full">
            <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ 
                    top: 20, 
                    right: isMobile ? 10 : 30, 
                    left: isMobile ? 0 : 20, 
                    bottom: 5 
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={isMobile ? formatCurrencyShort : formatCurrency} />
                <YAxis dataKey="name" type="category" width={isMobile ? 80 : 120} tick={{ fontSize: 12 }} interval={0} />
                <ChartTooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
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
                <Bar dataKey="Pagos" fill="#16a34a" radius={4} />
                <Bar dataKey="Gastos" fill="#dc2626" radius={4} />
                <Bar dataKey="Neto" fill="#3b82f6" radius={4} />
            </BarChart>
        </ChartContainer>
    </div>
  );
}
