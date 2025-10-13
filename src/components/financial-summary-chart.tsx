
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
  const chartData = summary.map(item => ({
    name: item.propertyName,
    'Ingresos': item.totalIncome > 0 ? item.totalIncome : 0,
    'Gastos': (item.totalPropertyExpenses + item.totalBookingExpenses) > 0 ? (item.totalPropertyExpenses + item.totalBookingExpenses) : 0,
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
    const prefix = currency === 'USD' ? 'U$S ' : '$';
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
                layout="horizontal"
                margin={{ 
                    top: 20, 
                    right: 20, 
                    left: 20, 
                    bottom: 80 
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={90}
                    padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                    tickFormatter={formatCurrencyShort} 
                    width={80}
                />
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
                <Legend verticalAlign="top" />
                <Bar dataKey="Ingresos" fill="#16a34a" radius={2} maxBarSize={30} />
                <Bar dataKey="Gastos" fill="#dc2626" radius={2} maxBarSize={30} />
                <Bar dataKey="Neto" fill="#3b82f6" radius={2} maxBarSize={30} />
            </BarChart>
        </ChartContainer>
    </div>
  );
}
