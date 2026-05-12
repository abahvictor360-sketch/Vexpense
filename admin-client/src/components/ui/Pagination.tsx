import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export function Pagination({
  page,
  pages,
  onChange,
  total,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
  total?: number;
}) {
  const canPrev = page > 1;
  const canNext = page < pages;

  const windowSize = 5;
  const start = Math.max(1, Math.min(page - Math.floor(windowSize / 2), pages - windowSize + 1));
  const end = Math.min(pages, start + windowSize - 1);
  const items: number[] = [];
  for (let i = start; i <= end; i++) items.push(i);

  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <div className="text-xs text-ink-muted">
        Page {page} of {Math.max(1, pages)}
        {typeof total === 'number' && <span className="ml-2">({total.toLocaleString()} total)</span>}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={!canPrev}
          className="btn-ghost p-1.5 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {items.map((i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={clsx(
              'min-w-[32px] h-8 rounded-md text-sm transition-colors',
              i === page ? 'bg-accent text-white' : 'text-ink-dim hover:bg-bg-hover'
            )}
          >
            {i}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={!canNext}
          className="btn-ghost p-1.5 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
