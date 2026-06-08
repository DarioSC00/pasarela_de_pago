'use client';

import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';

type Group = { currency: string; completed: number; refunded: number; total: number };

const COLORS = {
  USD: '#6366f1',
  COP: '#22d3ee',
  EUR: '#f472b6',
  MXN: '#10b981',
  BRL: '#f59e0b',
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
  const maxTotal = Math.max(1, ...groups.map((g) => g.total));

  return (
    <div className="bar-chart-custom">
      {groups.length === 0 ? (
        <p className="secondary-text">No hay datos para mostrar.</p>
      ) : (
        groups.map((g) => {
          const color = COLORS[g.currency as keyof typeof COLORS] ?? '#888';
          const completedW = (g.completed / maxTotal) * 100;
          const refundedW = (g.refunded / maxTotal) * 100;
          return (
            <div key={g.currency} className="bar-group">
              <div className="bar-label-row">
                <div className="currency-tag" style={{ color }}>
                  <Icon icon="mdi:currency-usd" width={15} />
                  {g.currency}
                </div>
                <span className="bar-total">{g.total} pagos</span>
              </div>
              <div className="bar-track-double">
                <div className="bar-segment bar-completed" style={{ width: `${completedW}%`, background: color + 'cc' }} />
                <div className="bar-segment bar-refunded" style={{ width: `${refundedW}%`, background: '#f43f5e88' }} />
              </div>
              <div className="bar-detail">
                <span><Icon icon="mdi:check-circle" width={12} color="#10b981" /> Completed {g.completed}</span>
                <span><Icon icon="mdi:refresh" width={12} color="#f43f5e" /> Refunded {g.refunded}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}