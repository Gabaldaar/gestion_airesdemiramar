
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExpensesByPropertySummary } from '@/lib/data';
import useWindowSize from '@/hooks/use-window-size';

interface ExpensesByPropertyChartProps {
  data: ExpensesByPropertySummary[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'decimal', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    return (
      <div className="bg-background border shadow-md p-2 rounded-lg">
        <p className="font-bold">{`${data.name}`}</p>
        <p className="text-sm">{`Total Gastado: USD ${formatCurrency(data.totalAmountUSD)}`}</p>
        <p className="text-sm text-muted-foreground">{`${data.percentage.toFixed(2)}% del total`}</p>
      </div>
    );
  }
  return null;
};

const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <div className="flex flex-col items-center gap-2 mt-4 text-sm text-muted-foreground">
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

export default function ExpensesByPropertyChart({ data }: ExpensesByPropertyChartProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay gastos para mostrar en el período seleccionado.</p>;
  }
  
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="totalAmountUSD"
            nameKey="name"
            label={isMobile ? false : ({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
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
