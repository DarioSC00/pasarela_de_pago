'use client';

import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/format';

export function PaymentsRecentActivity({ payments }: { payments: Payment[] }) {
  const recent = [...payments]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5);

  if (recent.length === 0) return <p className="secondary-text">Sin actividad reciente.</p>;

  return (
    <div className="activity-list">
      {recent.map((p) => (
        <div key={p.id_pago} className="activity-row">
          <div className={`activity-dot dot-${p.estado}`} />
          <div className="activity-info">
            <span className="activity-name">{p.nombre}</span>
            <span className="activity-course">{p.curso}</span>
          </div>
          <div className="activity-right">
            <span className="activity-amount">{formatCurrency(p.importe, p.moneda)}</span>
            <span className={`status-pill status-${p.estado}`}>
              <Icon icon={p.estado === 'completed' ? 'mdi:check-circle' : 'mdi:refresh-circle'} width={11} />
              {p.estado}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}