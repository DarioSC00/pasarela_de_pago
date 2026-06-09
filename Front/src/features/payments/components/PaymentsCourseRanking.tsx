'use client';

import type { Payment } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#818cf8', '#22d3ee', '#f472b6', '#34d399', '#fbbf24'];

export function PaymentsCourseRanking({ payments }: { payments: Payment[] }) {
  const map: Record<string, number> = {};
  payments.filter((p) => p.estado === 'completed').forEach((p) => {
    map[p.curso] = (map[p.curso] ?? 0) + 1;
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, val]) => ({ name, value: val }));

  if (sorted.length === 0) return <p className="secondary-text">Sin datos.</p>;

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" hide />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
            itemStyle={{ fontSize: '13px', fontWeight: 500 }}
          />
          <Bar dataKey="value" name="Completados" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#f8fafc', fontSize: 12 }}>
            {sorted.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}