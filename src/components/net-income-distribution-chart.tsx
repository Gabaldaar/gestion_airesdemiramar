
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialSummary } from '@/lib/data';
import { useMemo } from 'react';
import useWindowSize from '@/hooks/use-window-size';

// Generates a color from a string. Simple hash function.
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}


const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'decimal', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    return (
      <div className="bg-background border shadow-md p-2 rounded-lg">
        <p className="font-bold">{`${data.name}`}</p>
        <p className="text-sm">{`Resultado Neto: USD ${formatCurrency(data.value)}`}</p>
        <p className="text-sm text-muted-foreground">{`${data.percentage.toFixed(2)}% del total`}</p>
      </div>
    );
  }
  return null;
};

const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
            {
                payload.map((entry: any, index: number) => (
                    <div key={`item-${index}`} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: entry.color}} />
                        <span>{entry.value}</span>
                    </div>
                ))
            }
        </div>
    );
};

interface NetIncomeDistributionChartProps {
  summary: FinancialSummary[];
}

export default function NetIncomeDistributionChart({ summary }: NetIncomeDistributionChartProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const chartData = useMemo(() => {
    const positiveNetResults = summary.filter(item => item.netResult > 0);
    const totalPositiveNetResult = positiveNetResults.reduce((acc, item) => acc + item.netResult, 0);

    if (totalPositiveNetResult === 0) {
        return [];
    }

    return positiveNetResults.map(item => ({
        name: item.propertyName,
        value: item.netResult,
        percentage: (item.netResult / totalPositiveNetResult) * 100,
        fill: stringToColor(item.propertyName)
    }));
  }, [summary]);


  if (chartData.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay propiedades con resultado neto positivo en USD para mostrar en el gráfico.</p>;
  }
  
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={isMobile ? 60 : 100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={isMobile ? false : ({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
