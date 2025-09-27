
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TenantsByOriginSummary } from '@/lib/data';

interface TenantsByOriginChartProps {
  data: TenantsByOriginSummary[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border shadow-md p-2 rounded-lg">
        <p className="font-bold">{`${data.name}: ${data.count} inquilino(s)`}</p>
        <p className="text-sm text-muted-foreground">{`${data.percentage.toFixed(2)}% del total`}</p>
      </div>
    );
  }
  return null;
};

export default function TenantsByOriginChart({ data }: TenantsByOriginChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay datos de origen de inquilinos para mostrar.</p>;
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
            dataKey="count"
            nameKey="name"
            label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
