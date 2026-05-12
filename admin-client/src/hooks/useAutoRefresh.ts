import { useEffect, useRef } from 'react';

export function useAutoRefresh(fn: () => void, intervalMs: number, deps: unknown[] = []) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    const id = window.setInterval(() => saved.current(), intervalMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
}
