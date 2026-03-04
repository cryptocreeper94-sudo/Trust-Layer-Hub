import { type Express, type Request, type Response } from "express";

const PULSE_BASE = "https://darkwavepulse.com/api/public";
const CACHE_TTL = 60000;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchPulse(path: string): Promise<unknown | null> {
  const cached = getCached(path);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${PULSE_BASE}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (data?.error) return null;
    setCache(path, data);
    return data;
  } catch {
    return getCached(path) || null;
  }
}

export function registerPulseRoutes(app: Express) {
  app.get("/api/pulse/summary", async (_req: Request, res: Response) => {
    try {
      const data = await fetchPulse("/market-summary");
      if (!data) {
        return res.json({
          available: false,
          topSignals: [],
          marketSentiment: "neutral",
          sentimentScore: 50,
          activeSignals: 0,
          totalPredictions: 0,
          predictionAccuracy: 0,
          lastUpdated: null,
        });
      }
      res.json({ available: true, ...data as object });
    } catch {
      res.json({ available: false });
    }
  });

  app.get("/api/pulse/stats", async (_req: Request, res: Response) => {
    try {
      const data = await fetchPulse("/stats");
      if (!data) {
        return res.json({
          available: false,
          totalPredictions: 0,
          accuracy: 0,
          last30dAccuracy: 0,
        });
      }
      res.json({ available: true, ...data as object });
    } catch {
      res.json({ available: false });
    }
  });
}
