
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FinancialSummary } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import useWindowSize from '@/hooks/use-window-size';

interface FinancialSummaryChartProps {
  summaryItem: FinancialSummary;
  currency: 'ARS' | 'USD';
}

export default function FinancialSummaryChart({ summaryItem, currency }: FinancialSummaryChartProps) {
  const { width } = useWindowSize();
  const isMobile = width !== undefined && width < 768;

  const chartData = [
    { name: 'Ingresos', value: summaryItem.totalIncome, fill: '#16a34a' },
    { name: 'Gastos', value: summaryItem.totalPropertyExpenses + summaryItem.totalBookingExpenses, fill: '#dc2626' },
    { name: 'Neto', value: summaryItem.netResult, fill: '#3b82f6' },
  ];
  
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
    <div className="h-[250px] w-full">
        <ChartContainer config={{}} className="w-full h-full">
            <BarChart 
                data={chartData}
                layout="vertical"
                margin={{ 
                    top: 5, 
                    right: 20, 
                    left: 20, 
                    bottom: 5 
                }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis 
                    type="number"
                    tickFormatter={formatCurrencyShort}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis 
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    content={<ChartTooltipContent
                        labelFormatter={(label) => `${label}`}
                        formatter={(value) => formatCurrency(value as number)}
                        />}
                />
                <Bar dataKey="value" barSize={30} radius={4}>
                    {chartData.map((entry) => (
                         <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    </div>
  );
}
