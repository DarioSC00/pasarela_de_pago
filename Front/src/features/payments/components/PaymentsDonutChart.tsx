'use client';

import type { Payment } from '@/lib/types';

export function PaymentsDonutChart({ payments }: { payments: Payment[] }) {
  const completed = payments.filter((p) => p.estado === 'completed').length;
  const refunded = payments.filter((p) => p.estado === 'refunded').length;
  const total = completed + refunded || 1;

  const completedPct = (completed / total) * 100;
  const refundedPct = (refunded / total) * 100;

  const r = 40;
  const circ = 2 * Math.PI * r;
  const completedDash = (completedPct / 100) * circ;
  const refundedDash = (refundedPct / 100) * circ;

  return (
    <div className="donut-wrap">
      <div className="donut-svg-wrap">
        <svg viewBox="0 0 100 100" width={110} height={110}>
          <circle cx={50} cy={50} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={12} />
          <circle
            cx={50} cy={50} r={r} fill="none"
            stroke="#10b981" strokeWidth={12}
            strokeDasharray={`${completedDash} ${circ - completedDash}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
          />
          <circle
            cx={50} cy={50} r={r} fill="none"
            stroke="#f43f5e" strokeWidth={12}
            strokeDasharray={`${refundedDash} ${circ - refundedDash}`}
            strokeDashoffset={circ / 4 - completedDash}
            strokeLinecap="round"
          />
          <text x={50} y={46} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--color-text-primary)">{total}</text>
          <text x={50} y={58} textAnchor="middle" fontSize={8} fill="var(--color-text-secondary)">pagos</text>
        </svg>
      </div>
      <div className="donut-legend">
        {[
          { label: 'Completed', val: completed, pct: completedPct, color: '#10b981' },
          { label: 'Refunded', val: refunded, pct: refundedPct, color: '#f43f5e' },
        ].map((item) => (
          <div key={item.label} className="donut-legend-row">
            <div className="donut-sq" style={{ background: item.color }} />
            <span className="donut-label">{item.label}</span>
            <span className="donut-val">{item.val}</span>
            <span className="donut-pct">{item.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}