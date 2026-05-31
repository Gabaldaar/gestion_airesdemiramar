
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FinancialSummary } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTranslation } from "@/i18n/useTranslation";

interface FinancialSummaryChartProps {
  summaryItem: FinancialSummary;
  currency: string;
}

export default function FinancialSummaryChart({ summaryItem, currency }: FinancialSummaryChartProps) {
  const { t } = useTranslation();
  
  const chartData = [
    { name: t('reports.net'), value: summaryItem.netResult, fill: '#3b82f6' },
    { name: t('reports.expenses'), value: summaryItem.totalExpenses, fill: '#dc2626' },
    { name: t('reports.income'), value: summaryItem.totalIncome, fill: '#16a34a' },
  ];
  
  const formatCurrency = (value: number) => {
    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    } catch (e) {
        return `${currency} ${value.toFixed(0)}`;
    }
  }
  
  const formatCurrencyShort = (value: number) => {
    let symbol = currency;
    try {
        symbol = new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(0).replace(/[0-9.,]/g, '').trim();
    } catch (e) {
        // Fallback for unknown currency codes
    }

    if (Math.abs(value) >= 1_000_000) {
        return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${symbol}${(value / 1_000).toFixed(0)}k`;
    }
    return `${symbol}${value}`;
  }

  // Vertical Bars configuration
  return (
    <div className="h-[250px] w-full flex justify-center">
        <ChartContainer config={{}} className="w-full max-w-[300px] h-full">
            <BarChart 
                data={chartData}
                margin={{ 
                    top: 20, 
                    right: 20, 
                    left: 0,
                    bottom: 5 
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    type="number"
                    tickFormatter={formatCurrencyShort}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    width={50}
                />
                <ChartTooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    content={<ChartTooltipContent
                        labelFormatter={(label) => `${label}`}
                        formatter={(value) => formatCurrency(value as number)}
                        />}
                />
                <Bar dataKey="value" radius={4} barSize={35}>
                    {chartData.map((entry) => (
                         <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    </div>
  );
}
