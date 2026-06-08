import type { ReactNode } from 'react';

const badgeClasses = {
  success: 'hero-badge hero-badge-success',
  warning: 'hero-badge hero-badge-warning',
  danger: 'hero-badge hero-badge-danger',
} as const;

type HeroBadgeVariant = keyof typeof badgeClasses;

type HeroBadgeProps = {
  children: ReactNode;
  variant?: HeroBadgeVariant;
};

export function HeroBadge({ children, variant = 'success' }: HeroBadgeProps) {
  return <span className={badgeClasses[variant]}>{children}</span>;
}
