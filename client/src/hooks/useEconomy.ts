import { useState, useEffect } from 'react';
import type { EconomyData } from '../types';
import { getEconomy } from '../lib/api';

const CACHE_KEY = 'vexpense_economy_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function useEconomy(countryCode: string | null) {
  const [data, setData] = useState<EconomyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) return;

    const cacheKey = `${CACHE_KEY}${countryCode}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data: cachedData, ts } = JSON.parse(cached) as { data: EconomyData; ts: number };
        if (Date.now() - ts < CACHE_TTL) {
          setData(cachedData);
          return;
        }
      } catch { /* stale cache */ }
    }

    setLoading(true);
    getEconomy(countryCode)
      .then(d => {
        setData(d);
        localStorage.setItem(cacheKey, JSON.stringify({ data: d, ts: Date.now() }));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [countryCode]);

  return { data, loading, error };
}
