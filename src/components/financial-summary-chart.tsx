
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialSummary } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface FinancialSummaryChartProps {
  summary: FinancialSummary[];
}

export default function FinancialSummaryChart({ summary }: FinancialSummaryChartProps) {
  const chartData = summary.map(item => ({
    name: item.propertyName,
    'Resultado Neto': item.netResult,
    'Ingresos': item.totalIncome,
    'Gastos': item.totalPropertyExpenses + item.totalBookingExpenses,
    'Saldo': item.balance,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="h-[350px] w-full">
        <ChartContainer config={{}} className="w-full h-full">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrency} />
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
                <Bar dataKey="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resultado Neto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saldo" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
    </div>
  );
}
