'use client';

import type { Payment } from '@/lib/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function PaymentsTrendChart({ payments }: { payments: Payment[] }) {
  const dailyData = payments.reduce<Record<string, { completed: number; refunded: number; date: Date; dateStr: string }>>(
    (acc, p) => {
      const d = new Date(p.fecha).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      const cur = acc[d] ?? { completed: 0, refunded: 0, date: new Date(p.fecha), dateStr: d };
      if (p.estado === 'completed') cur.completed += 1;
      if (p.estado === 'refunded') cur.refunded += 1;
      acc[d] = cur;
      return acc;
    },
    {}
  );

  const sorted = Object.values(dailyData)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-14);

  if (sorted.length === 0) {
    return <p className="secondary-text">Sin datos de tendencia.</p>;
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sorted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorRefunded" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="dateStr" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
            itemStyle={{ fontSize: '13px', fontWeight: 500 }}
          />
          <Area type="monotone" dataKey="completed" name="Completados" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
          <Area type="monotone" dataKey="refunded" name="Reembolsos" stroke="#fb7185" strokeWidth={3} fillOpacity={1} fill="url(#colorRefunded)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}