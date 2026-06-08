'use client';

import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';

export function PaymentsTrendChart({ payments }: { payments: Payment[] }) {
  const dailyData = payments.reduce<Record<string, { completed: number; refunded: number; date: Date }>>(
    (acc, p) => {
      const d = new Date(p.fecha).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      const cur = acc[d] ?? { completed: 0, refunded: 0, date: new Date(p.fecha) };
      if (p.estado === 'completed') cur.completed += 1;
      if (p.estado === 'refunded') cur.refunded += 1;
      acc[d] = cur;
      return acc;
    },
    {}
  );

  const sorted = Object.entries(dailyData)
    .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
    .slice(-7);

  const maxValue = Math.max(1, ...sorted.map(([, d]) => Math.max(d.completed, d.refunded)));

  if (sorted.length === 0) {
    return <p className="secondary-text">Sin datos de tendencia.</p>;
  }

  return (
    <div className="trend-chart">
      {sorted.map(([date, data]) => {
        const compH = (data.completed / maxValue) * 100;
        const refH = (data.refunded / maxValue) * 100;
        return (
          <div key={date} className="trend-group">
            <div className="trend-bars">
              <div className="trend-bar trend-completed" style={{ height: `${compH}%` }} title={`Completed: ${data.completed}`} />
              <div className="trend-bar trend-refunded" style={{ height: `${refH}%` }} title={`Refunded: ${data.refunded}`} />
            </div>
            <span className="trend-date">{date}</span>
            <span className="trend-count">{data.completed + data.refunded}</span>
          </div>
        );
      })}
    </div>
  );
}