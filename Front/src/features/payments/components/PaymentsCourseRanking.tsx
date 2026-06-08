'use client';

import type { Payment } from '@/lib/types';

const COLORS = ['#6366f1', '#22d3ee', '#f472b6', '#10b981', '#f59e0b'];

export function PaymentsCourseRanking({ payments }: { payments: Payment[] }) {
  const map: Record<string, number> = {};
  payments.filter((p) => p.estado === 'completed').forEach((p) => {
    map[p.curso] = (map[p.curso] ?? 0) + 1;
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = sorted[0]?.[1] ?? 1;

  if (sorted.length === 0) return <p className="secondary-text">Sin datos.</p>;

  return (
    <div className="course-list">
      {sorted.map(([name, val], i) => (
        <div key={name} className="course-row">
          <div className="course-meta">
            <span className="course-name">{name}</span>
            <span className="course-val" style={{ color: COLORS[i] }}>{val}</span>
          </div>
          <div className="course-track">
            <div
              className="course-fill"
              style={{ width: `${(val / max) * 100}%`, background: COLORS[i] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}