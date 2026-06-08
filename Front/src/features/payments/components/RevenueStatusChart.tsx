'use client';

import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';

export function RevenueStatusChart({ payments }: { payments: Payment[] }) {
  const completed = payments.filter((p) => p.estado === 'completed').length;
  const refunded = payments.filter((p) => p.estado === 'refunded').length;
  const total = payments.length;

  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const refundedPercent = total > 0 ? (refunded / total) * 100 : 0;

  const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';

  return (
    <div>
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Tasa de éxito</h3>
          <p className="secondary-text">Distribución de estados de pago</p>
        </div>
        <Icon icon="mdi:check-all" width="24" color="#34d399" />
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="status-stat">
          <div className="status-stat-content">
            <span className="status-stat-label">Completados</span>
            <span className="status-stat-number" style={{ color: '#22c55e' }}>
              {completed}
            </span>
          </div>
          <div className="status-stat-bar">
            <div
              className="status-stat-bar-fill"
              style={{ width: `${completedPercent}%`, background: 'linear-gradient(90deg, #22c55e, #14b8a6)' }}
            />
          </div>
          <span className="status-stat-percent">{completedPercent.toFixed(1)}%</span>
        </div>

        <div className="status-stat">
          <div className="status-stat-content">
            <span className="status-stat-label">Reembolsos</span>
            <span className="status-stat-number" style={{ color: '#f97316' }}>
              {refunded}
            </span>
          </div>
          <div className="status-stat-bar">
            <div
              className="status-stat-bar-fill"
              style={{ width: `${refundedPercent}%`, background: 'linear-gradient(90deg, #fb923c, #f97316)' }}
            />
          </div>
          <span className="status-stat-percent">{refundedPercent.toFixed(1)}%</span>
        </div>

        <div className="success-rate-card">
          <Icon icon="mdi:trending-up" width="32" color="#10b981" />
          <div>
            <span className="success-rate-label">Tasa de éxito</span>
            <span className="success-rate-value">{successRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
