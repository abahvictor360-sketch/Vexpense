import { Router, Request, Response } from 'express';
import { economyCache } from '../lib/cache';

const router = Router();

interface WorldBankEntry {
  value: number | null;
  date: string;
}

router.get('/:countryCode', async (req: Request, res: Response): Promise<void> => {
  const { countryCode } = req.params;
  const code = (Array.isArray(countryCode) ? countryCode[0] : countryCode).toUpperCase();
  const cacheKey = `economy_${code}`;

  // Return cached data if available
  const cached = economyCache.get<object>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const url = `https://api.worldbank.org/v2/country/${code}/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2`;
    const response = await fetch(url);

    if (!response.ok) {
      res.status(502).json({ error: 'Failed to fetch economy data' });
      return;
    }

    const data = await response.json() as [unknown, WorldBankEntry[]];
    const entries = data[1];
    const latest = entries?.find(e => e.value !== null);

    if (!latest) {
      res.json({ countryCode: code, inflationRate: null, year: null, source: 'World Bank' });
      return;
    }

    const result = {
      countryCode: code,
      inflationRate: parseFloat(latest.value!.toFixed(2)),
      year: parseInt(latest.date),
      source: 'World Bank',
    };

    economyCache.set(cacheKey, result);
    res.json(result);
  } catch {
    // Silently fail — economy data is supplementary
    res.json({ countryCode: code, inflationRate: null, year: null, source: 'World Bank' });
  }
});

export default router;
