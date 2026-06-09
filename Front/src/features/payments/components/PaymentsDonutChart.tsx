'use client';

import type { Payment } from '@/lib/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function PaymentsDonutChart({ payments }: { payments: Payment[] }) {
  const completed = payments.filter((p) => p.estado === 'completed').length;
  const refunded = payments.filter((p) => p.estado === 'refunded').length;

  const data = [
    { name: 'Completed', value: completed, color: '#34d399' },
    { name: 'Refunded', value: refunded, color: '#fb7185' },
  ];

  if (completed === 0 && refunded === 0) {
    return <p className="secondary-text">Sin datos de estado.</p>;
  }

  return (
    <div style={{ width: '100%', height: 260, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
            itemStyle={{ fontSize: '13px', fontWeight: 500 }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }}/>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
        <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>{completed + refunded}</span>
        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>pagos</span>
      </div>
    </div>
  );
}