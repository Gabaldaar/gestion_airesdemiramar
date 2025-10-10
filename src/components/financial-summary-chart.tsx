

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
    'Ingresos': item.totalIncome,
    'Gastos': (item.totalPropertyExpenses + item.totalBookingExpenses) * -1, // Make expenses negative for stacking
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
    <div className="h-[350px] w-full">
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
                <YAxis type="category" dataKey="name" width={isMobile ? 60 : 120} tick={{ fontSize: 12 }} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        labelFormatter={(label) => `${label}`}
                        formatter={(value, name) => (
                            <div className='flex items-center gap-2'>
                                <span className='capitalize'>{name}:</span>
                                <span>{formatCurrency(name === 'Gastos' ? (value as number) * -1 : value as number)}</span>
                            </div>
                        )}
                        />}
                />
                <Legend />
                <Bar dataKey="Ingresos" stackId="a" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Gastos" stackId="a" fill="#dc2626" radius={[0, 0, 4, 4]} maxBarSize={30} />
            </BarChart>
        </ChartContainer>
    </div>
  );
}
