import { Icon } from '@iconify/react';
import type { Payment } from '@/lib/types';

type Group = {
  currency: string;
  completed: number;
  refunded: number;
  total: number;
};

function buildGroups(payments: Payment[]) {
  const map = new Map<string, Group>();

  payments.forEach((payment) => {
    const currency = payment.moneda.toUpperCase();
    const existing = map.get(currency) ?? { currency, completed: 0, refunded: 0, total: 0 };
    existing[payment.estado] += 1;
    existing.total += 1;
    map.set(currency, existing);
  });

  return Array.from(map.values());
}

export function PaymentsChart({ payments }: { payments: Payment[] }) {
  const groups = buildGroups(payments);
  const maxTotal = Math.max(1, ...groups.map((group) => group.total));

  const currencyIcons: Record<string, string> = {
    USD: 'mdi:currency-usd',
    COP: 'mdi:currency-usd',
    EUR: 'mdi:currency-eur',
  };

  return (
    <div className="bar-chart">
      {groups.length === 0 ? (
        <p className="secondary-text">No hay datos para mostrar el gráfico.</p>
      ) : (
        groups.map((group) => {
          const completedWidth = (group.completed / maxTotal) * 100;
          const refundedWidth = (group.refunded / maxTotal) * 100;

          return (
            <div key={group.currency} className="chart-row chart-summary-row">
              <div className="currency-tag">
                <Icon icon={currencyIcons[group.currency] ?? 'mdi:cash'} width="18" color="#60a5fa" />
                {group.currency}
              </div>
              <div style={{ width: '100%' }}>
                <div className="bar-track" style={{ marginBottom: '0.75rem' }}>
                  <div className="bar-fill bar-completed" style={{ width: `${completedWidth}%` }} />
                  <div className="bar-fill bar-refunded" style={{ width: `${refundedWidth}%`, marginLeft: '-100%' }} />
                </div>
                <div className="secondary-text summary-row-detail">
                  <span><Icon icon="mdi:check-circle" width="16" /> Completed {group.completed}</span>
                  <span><Icon icon="mdi:refresh" width="16" /> Refunded {group.refunded}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
