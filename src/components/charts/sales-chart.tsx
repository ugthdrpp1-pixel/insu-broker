'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS: Record<string, string> = {
  LIFE: '#6366f1',
  HEALTH: '#10b981',
  MOTOR: '#f59e0b',
  PA: '#ef4444',
  PROPERTY: '#8b5cf6',
};

export function SalesChart({ data, locale }: { data: any[]; locale: string }) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            {Object.entries(COLORS).map(([k, c]) => (
              <linearGradient id={`grad-${k}`} key={k} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c} stopOpacity={0.6} />
                <stop offset="95%" stopColor={c} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <Tooltip
            formatter={(value: any) => formatCurrency(value, locale)}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {['LIFE', 'HEALTH', 'MOTOR', 'PA', 'PROPERTY'].map((k) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stackId="1"
              stroke={COLORS[k]}
              fill={`url(#grad-${k})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
