'use client';

import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';

export function CurrencyDistributionChart({ payments }: { payments: Payment[] }) {
  const distribution = payments.reduce(
    (acc, payment) => {
      const currency = payment.moneda.toUpperCase();
      acc[currency] = (acc[currency] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = payments.length;
  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const colors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899'];

  const currencyIcons: Record<string, string> = {
    USD: 'mdi:currency-usd',
    COP: 'mdi:currency-usd',
    EUR: 'mdi:currency-eur',
  };

  return (
    <div>
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Distribución por moneda</h3>
          <p className="secondary-text">Total de pagos por moneda</p>
        </div>
        <Icon icon="mdi:pie-chart" width="24" color="#a5f3d0" />
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {sorted.map(([currency, count], idx) => {
          const percentage = (count / total) * 100;
          return (
            <div key={currency} className="distribution-item">
              <div className="distribution-label">
                <Icon
                  icon={currencyIcons[currency] ?? 'mdi:cash'}
                  width="20"
                  color={colors[idx % colors.length]}
                />
                <span className="distribution-name">{currency}</span>
                <span className="distribution-count">{count}</span>
              </div>
              <div className="distribution-bar-track">
                <div
                  className="distribution-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[(idx + 1) % colors.length]})`,
                  }}
                />
              </div>
              <div className="distribution-percentage">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
