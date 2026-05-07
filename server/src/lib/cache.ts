import NodeCache from 'node-cache';

// 24-hour TTL for economy data
export const economyCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });
