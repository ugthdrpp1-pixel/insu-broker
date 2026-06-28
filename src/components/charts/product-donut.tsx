'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const LABELS: Record<string, string> = {
  LIFE: 'Life',
  HEALTH: 'Health',
  MOTOR: 'Motor',
  PA: 'PA',
  PROPERTY: 'Property',
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ProductDonut({ data, locale }: { data: Record<string, number>; locale: string }) {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: LABELS[k] ?? k, value: v }));

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">No data</p>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={entries}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {entries.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: any) => formatCurrency(v, locale)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
