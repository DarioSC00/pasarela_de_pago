import type { ButtonHTMLAttributes, ReactNode } from 'react';

type HeroButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
};

export function HeroButton({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}: HeroButtonProps) {
  const variantClass =
    variant === 'secondary'
      ? 'hero-button-secondary'
      : variant === 'ghost'
      ? 'hero-button-ghost'
      : 'hero-button-primary';

  return (
    <button className={`hero-button ${variantClass} ${className}`} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
