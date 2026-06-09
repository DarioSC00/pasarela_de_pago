'use client';

import type { Payment } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Group = { currency: string; completed: number; refunded: number; total: number };

const COLORS = {
  USD: '#818cf8',
  COP: '#22d3ee',
  EUR: '#f472b6',
  MXN: '#34d399',
  BRL: '#fbbf24',
};

function buildGroups(payments: Payment[]): Group[] {
  const map = new Map<string, Group>();
  payments.forEach((p) => {
    const cur = p.moneda.toUpperCase();
    const g = map.get(cur) ?? { currency: cur, completed: 0, refunded: 0, total: 0 };
    if (p.estado === 'completed') g.completed += 1;
    if (p.estado === 'refunded') g.refunded += 1;
    g.total += 1;
    map.set(cur, g);
  });
  return Array.from(map.values());
}

export function PaymentsChart({ payments }: { payments: Payment[] }) {
  const groups = buildGroups(payments);

  if (groups.length === 0) return <p className="secondary-text">No hay datos para mostrar.</p>;

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={groups} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="currency" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
            itemStyle={{ fontSize: '13px', fontWeight: 500 }}
          />
          <Bar dataKey="completed" name="Completados" radius={[6, 6, 0, 0]}>
            {groups.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.currency as keyof typeof COLORS] || '#818cf8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}