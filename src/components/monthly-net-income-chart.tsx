
'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { MonthlyTrendData } from "@/lib/reports";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslation } from "@/i18n/useTranslation";

interface MonthlyNetIncomeChartProps {
  data: MonthlyTrendData[];
  currency: string;
}

export default function MonthlyNetIncomeChart({ data, currency }: MonthlyNetIncomeChartProps) {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return `${currency} ${value}`;
    }
  };

  const formatCurrencyShort = (value: number) => {
    let symbol = currency;
    try {
        symbol = new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency }).format(0).replace(/[0-9.,]/g, '').trim();
    } catch (e) {}

    if (Math.abs(value) >= 1_000_000) {
        return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${symbol}${(value / 1_000).toFixed(0)}k`;
    }
    return `${symbol}${value}`;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] bg-muted/20 border-2 border-dashed rounded-2xl text-muted-foreground italic text-sm">
        {t('reports.no_financial_data')}
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        config={{
          net: {
            label: t('reports.net'),
            color: "hsl(var(--primary))",
          }
        }}
        className="h-full w-full"
      >
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-net)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-net)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 10, fontWeight: 700 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatCurrencyShort}
            tick={{ fontSize: 10 }}
            width={50}
          />
          <ChartTooltip
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                labelFormatter={(value, payload) => {
                    const item = payload[0]?.payload as MonthlyTrendData;
                    return item?.monthFull || value;
                }}
                formatter={(value, name) => (
                  <div className="flex justify-between gap-4 w-full">
                    <span className="capitalize">{name}:</span>
                    <span className="font-bold">{formatCurrency(value as number)}</span>
                  </div>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke="var(--color-net)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorNet)"
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
