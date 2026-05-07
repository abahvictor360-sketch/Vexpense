import { clsx } from '../../utils/clsx';

interface ProgressBarProps {
  value: number;       // 0-100
  max?: number;
  color?: string;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color,
  className,
  height = 'md',
  animated = false,
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

  const getColor = () => {
    if (color) return color;
    if (pct >= 90) return '#ef4444';
    if (pct >= 75) return '#f59e0b';
    return '#534AB7';
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full bg-gray-100 rounded-full overflow-hidden', heights[height])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', animated && 'transition-[width]')}
          style={{ width: `${pct}%`, backgroundColor: getColor() }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
