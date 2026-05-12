import { ReactNode } from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from './Skeleton';

export function KpiCard({
  title,
  value,
  icon,
  trend,
  loading = false,
  hint,
}: {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  loading?: boolean;
  hint?: string;
}) {
  const trendDir = trend ? (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'flat') : null;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="label">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24 mb-2" />
      ) : (
        <div className="text-2xl font-semibold text-ink tabular-nums mb-2">{value}</div>
      )}
      <div className="flex items-center justify-between text-xs">
        {trend ? (
          <span
            className={clsx(
              'inline-flex items-center gap-1',
              trendDir === 'up' && 'text-ok',
              trendDir === 'down' && 'text-err',
              trendDir === 'flat' && 'text-ink-muted'
            )}
          >
            {trendDir === 'up' && <TrendingUp className="w-3 h-3" />}
            {trendDir === 'down' && <TrendingDown className="w-3 h-3" />}
            {trendDir === 'flat' && <Minus className="w-3 h-3" />}
            {Math.abs(trend.value)}% {trend.label ?? ''}
          </span>
        ) : (
          <span />
        )}
        {hint && <span className="text-ink-muted">{hint}</span>}
      </div>
    </div>
  );
}
