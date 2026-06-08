'use client';

import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/format';

export function TopCoursesChart({ payments }: { payments: Payment[] }) {
  const courseData = payments.reduce(
    (acc, payment) => {
      const course = payment.curso;
      const existing = acc.find((c) => c.name === course) || { name: course, count: 0, revenue: 0 };
      existing.count += 1;
      if (payment.estado === 'completed') existing.revenue += payment.importe;
      if (!acc.includes(existing)) acc.push(existing);
      else Object.assign(acc.find((c) => c.name === course)!, existing);
      return acc;
    },
    [] as Array<{ name: string; count: number; revenue: number }>
  );

  const sorted = courseData.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const maxRevenue = Math.max(1, ...sorted.map((c) => c.revenue));

  const icons = ['mdi:star-circle', 'mdi:numeric-2-circle', 'mdi:numeric-3-circle', 'mdi:numeric-4-circle', 'mdi:numeric-5-circle'];

  return (
    <div>
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Top 5 Cursos</h3>
          <p className="secondary-text">Cursos con mayor ingresos</p>
        </div>
        <Icon icon="mdi:school" width="24" color="#fbbf24" />
      </div>

      <div style={{ display: 'grid', gap: '1.2rem' }}>
        {sorted.map((course, idx) => {
          const barWidth = (course.revenue / maxRevenue) * 100;
          return (
            <div key={course.name} className="course-item">
              <div className="course-header">
                <div className="course-rank">
                  <Icon icon={icons[idx]} width="24" color="#fbbf24" />
                </div>
                <div className="course-info">
                  <span className="course-name">{course.name}</span>
                  <span className="course-stats">
                    <Icon icon="mdi:shopping-bag" width="14" /> {course.count} pagos
                  </span>
                </div>
                <span className="course-revenue">{formatCurrency(course.revenue, 'COP')}</span>
              </div>
              <div className="course-bar-track">
                <div className="course-bar-fill" style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
