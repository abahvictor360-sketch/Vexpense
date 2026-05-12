import clsx from 'clsx';
import { ReactNode } from 'react';

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const VARIANT_CLASSES: Record<Variant, string> = {
  neutral: 'bg-bg-hover text-ink-dim border-line',
  success: 'bg-ok/10 text-ok border-ok/30',
  warning: 'bg-warn/10 text-warn border-warn/30',
  danger: 'bg-err/10 text-err border-err/30',
  info: 'bg-accent/10 text-accent border-accent/30',
  accent: 'bg-accent/20 text-white border-accent/40',
};

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
