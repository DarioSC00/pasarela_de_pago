import type { ReactNode } from 'react';

export function HeroCard({
  title,
  children,
  topRight,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  topRight?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || topRight) && (
        <div className="panel-header">
          {title ? <h2 className="panel-title">{title}</h2> : <div />}
          {topRight ?? null}
        </div>
      )}
      {children}
    </section>
  );
}
