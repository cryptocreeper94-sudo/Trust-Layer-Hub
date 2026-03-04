import { createHash } from "crypto";
import type { Express, Request, Response } from "express";
import { authenticateToken } from "./auth";
import { createTrustStamp } from "./hallmark";

const DWTL_BASE = "https://dwtl.io";
const CACHE_TTL = 30000;

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

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function deriveAddress(userId: number): string {
  const hash = createHash("sha256")
    .update("trustlayer:member:" + userId)
    .digest("hex");
  return "0x" + hash.slice(0, 40);
}

async function fetchChain(path: string, options?: RequestInit): Promise<any> {
  const url = DWTL_BASE + path;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Chain API ${res.status}: ${text}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchChainCached(path: string): Promise<any> {
  const cached = getCached(path);
  if (cached) return cached;
  const data = await fetchChain(path);
  setCache(path, data);
  return data;
}

async function getEcosystemToken(hubToken: string): Promise<string | null> {
  try {
    const data = await fetchChain("/api/auth/exchange-token", {
      method: "POST",
      body: JSON.stringify({ hubSessionToken: hubToken }),
    });
    return data.ecosystemToken || null;
  } catch (err: any) {
    console.error("[Blockchain] Token exchange failed:", err?.message);
    return null;
  }
}

export function registerBlockchainRoutes(app: Express): void {
  app.get("/api/balance", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const address = deriveAddress(user.id);
      const data = await fetchChainCached(`/api/wallets/${address}/balances`);
      res.json({
        totalTokens: parseFloat(data.SIG || "0"),
        presaleTokens: 0,
        stakedTokens: parseFloat(data.stSIG || "0"),
        liquidTokens: parseFloat(data.SIG || "0"),
      });
    } catch (err: any) {
      console.error("[Blockchain] Balance error:", err?.message);
      res.json({ totalTokens: 0, presaleTokens: 0, stakedTokens: 0, liquidTokens: 0 });
    }
  });

  app.get("/api/shells/my-balance", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const address = deriveAddress(user.id);
      const data = await fetchChainCached(`/api/wallets/${address}/balances`);
      res.json({ balance: parseFloat(data.Shells || "0") });
    } catch (err: any) {
      console.error("[Blockchain] Shell balance error:", err?.message);
      res.json({ balance: 0 });
    }
  });

  app.get("/api/user/transactions", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const address = deriveAddress(user.id);
      const data = await fetchChain(`/api/transactions/${address}?limit=20`);
      const transactions = (data.transactions || data || []).map((tx: any) => ({
        id: tx.txHash || tx.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: tx.type || "received",
        amount: parseFloat(tx.amount || "0"),
        tokenAmount: parseFloat(tx.amount || "0"),
        asset: tx.asset || "SIG",
        title: tx.description || tx.type || "",
        from: tx.from || "",
        to: tx.to || "",
        txHash: tx.txHash || "",
        status: tx.status || "confirmed",
        date: tx.timestamp || tx.createdAt || new Date().toISOString(),
        createdAt: tx.timestamp || tx.createdAt || new Date().toISOString(),
      }));
      res.json({ transactions });
    } catch (err: any) {
      console.error("[Blockchain] Transactions error:", err?.message);
      res.json({ transactions: [] });
    }
  });

  app.get("/api/user/dwc-bag", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const address = deriveAddress(user.id);
      const data = await fetchChainCached(`/api/wallets/${address}/balances`);
      const sig = parseFloat(data.SIG || "0");
      const shells = parseFloat(data.Shells || "0");
      const echoes = parseFloat(data.Echoes || "0");
      res.json({
        totalDwc: sig + shells * 10 + echoes * 100,
        currentValue: sig * 0.01 + shells * 0.001 + echoes * 0.0001,
        launchProjectedValue: sig * 0.01 + shells * 0.001 + echoes * 0.0001,
        sources: { presale: sig, shells, airdrops: echoes, earlyAdopterBonus: 0 },
      });
    } catch (err: any) {
      console.error("[Blockchain] DWC bag error:", err?.message);
      res.json({
        totalDwc: 0, currentValue: 0, launchProjectedValue: 0,
        sources: { presale: 0, shells: 0, airdrops: 0, earlyAdopterBonus: 0 },
      });
    }
  });

  app.get("/api/user/reward-profile", authenticateToken, async (_req: Request, res: Response) => {
    res.json({
      profile: { tier: "Explorer", multiplier: 1, totalQuestsCompleted: 0 },
      shellBalance: 0,
      tiers: [],
      conversion: { rate: 1, tgeDate: "2026-08-23" },
    });
  });

  app.get("/api/network/stats", async (_req: Request, res: Response) => {
    try {
      const data = await fetchChainCached("/api/network/stats");
      res.json(data);
    } catch (err: any) {
      console.error("[Blockchain] Network stats error:", err?.message);
      res.json({
        blockTime: "400ms", blockTimeMs: 400, tps: 200000,
        totalAccounts: 0, totalSupply: "1000000000",
        circulatingSupply: "0", consensus: "BFT-PoA",
        chainId: "trustlayer-mainnet-1", nativeAsset: "SIG",
        nativeAssetPrice: "0.01", isTestnet: true,
      });
    }
  });

  app.get("/api/blockchain/wallet", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const address = deriveAddress(user.id);
      const [balances, wallet] = await Promise.all([
        fetchChainCached(`/api/wallets/${address}/balances`),
        fetchChainCached(`/api/wallets/${address}`).catch(() => null),
      ]);
      res.json({ address, balances, wallet });
    } catch (err: any) {
      console.error("[Blockchain] Wallet info error:", err?.message);
      const address = deriveAddress((req as any).user.id);
      res.json({ address, balances: { SIG: "0", Shells: "0", stSIG: "0", Echoes: "0" }, wallet: null });
    }
  });

  app.get("/api/blockchain/tlid/:tlidId", async (req: Request, res: Response) => {
    try {
      const data = await fetchChainCached(`/api/tlid/${req.params.tlidId}`);
      res.json(data);
    } catch (err: any) {
      console.error("[Blockchain] TLID resolve error:", err?.message);
      res.status(404).json({ error: "TLID not found" });
    }
  });

  app.get("/api/swap/pairs", async (_req: Request, res: Response) => {
    try {
      const data = await fetchChainCached("/api/swap/pairs");
      res.json(data);
    } catch (err: any) {
      console.error("[Blockchain] Swap pairs error:", err?.message);
      res.json({ pairs: [], feeRate: "0.003", feeBasisPoints: 30 });
    }
  });

  app.get("/api/swap/quote", async (req: Request, res: Response) => {
    try {
      const { tokenIn, tokenOut, amountIn } = req.query;
      const data = await fetchChain(`/api/swap/quote?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}`);
      res.json(data);
    } catch (err: any) {
      console.error("[Blockchain] Swap quote error:", err?.message);
      res.status(400).json({ error: "Failed to get quote" });
    }
  });

  app.get("/api/liquid-staking/rate", async (_req: Request, res: Response) => {
    try {
      const data = await fetchChainCached("/api/liquid-staking/rate");
      res.json(data);
    } catch (err: any) {
      console.error("[Blockchain] Liquid staking rate error:", err?.message);
      res.json({ stSIG_to_SIG: "1", SIG_to_stSIG: "1", apy: "12" });
    }
  });
}
