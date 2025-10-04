
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BookingStatusSummary } from '@/lib/data';

interface BookingStatusChartProps {
  data: BookingStatusSummary[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload.reduce((acc: number, entry: any) => acc + entry.value, 0);
    const percentage = ((data.count / total) * 100).toFixed(2);
    return (
      <div className="bg-background border shadow-md p-2 rounded-lg">
        <p className="font-bold">{`${data.name}: ${data.count} reserva(s)`}</p>
        <p className="text-sm text-muted-foreground">{`${percentage}% del total`}</p>
      </div>
    );
  }
  return null;
};

export default function BookingStatusChart({ data }: BookingStatusChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay datos de estado de reservas para mostrar.</p>;
  }

  const totalBookings = data.reduce((acc, entry) => acc + entry.count, 0);
  
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
            label={({ name, count }) => `${name} (${((count/totalBookings) * 100).toFixed(0)}%)`}
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
