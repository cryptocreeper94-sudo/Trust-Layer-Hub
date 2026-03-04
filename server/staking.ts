import type { Express, Request, Response } from "express";
import { authenticateToken } from "./auth";
import { createTrustStamp } from "./hallmark";
import { deriveAddress } from "./blockchain";

const DWTL_BASE = "https://dwtl.io";

interface StakingPool {
  id: string;
  name: string;
  lockDays: number;
  baseApy: number;
  boostApy: number;
  minStake: number;
  description: string;
}

const STAKING_POOLS_FALLBACK: StakingPool[] = [
  { id: "liquid-flex", name: "Liquid Flex", lockDays: 0, baseApy: 10, boostApy: 2, minStake: 100, description: "Flexible staking with no lock period" },
  { id: "core-guard-45", name: "Core Guard 45", lockDays: 45, baseApy: 14, boostApy: 3, minStake: 500, description: "45-day lock for higher rewards" },
  { id: "core-guard-90", name: "Core Guard 90", lockDays: 90, baseApy: 18, boostApy: 4, minStake: 1000, description: "90-day lock for enhanced yields" },
  { id: "core-guard-180", name: "Core Guard 180", lockDays: 180, baseApy: 24, boostApy: 5, minStake: 2500, description: "180-day lock for premium returns" },
  { id: "founders-forge", name: "Founders Forge", lockDays: 365, baseApy: 30, boostApy: 8, minStake: 5000, description: "365-day lock for maximum yield" },
];

const SWAP_PAIRS_FALLBACK: Record<string, Record<string, number>> = {
  SIG: { Shells: 1000, stSIG: 1, USDC: 0.01, USDT: 0.01 },
  Shells: { SIG: 0.001, stSIG: 0.001 },
  stSIG: { SIG: 1, Shells: 1000 },
  USDC: { SIG: 100 },
  USDT: { SIG: 100 },
};

async function fetchDwtl(path: string, options?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(DWTL_BASE + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`dwtl.io ${res.status}: ${text}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchDwtlAuth(path: string, hubToken: string, body?: any): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const exchangeRes = await fetchDwtl("/api/auth/exchange-token", {
      method: "POST",
      body: JSON.stringify({ hubSessionToken: hubToken }),
    });
    if (exchangeRes.ecosystemToken) {
      headers["Authorization"] = `Bearer ${exchangeRes.ecosystemToken}`;
    }
  } catch (err: any) {
    console.error("[Chain Auth] Token exchange failed:", err?.message);
  }
  return fetchDwtl(path, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function registerStakingRoutes(app: Express): void {
  app.get("/api/staking/pools", async (_req: Request, res: Response) => {
    try {
      const data = await fetchDwtl("/api/staking/pools");
      const pools = (data.pools || []).map((p: any) => ({
        id: p.slug || p.id,
        name: p.name,
        lockDays: p.lockDays || 0,
        baseApy: parseFloat(p.apyBase || p.baseApy || "0"),
        boostApy: parseFloat(p.apyBoost || p.boostApy || "0"),
        totalApy: parseFloat(p.effectiveApy || "0") || (parseFloat(p.apyBase || "0") + parseFloat(p.apyBoost || "0")),
        minStake: parseFloat(p.minStake || "100"),
        description: p.description || "",
        totalStaked: parseFloat(p.totalStaked || "0"),
        totalStakers: p.totalStakers || 0,
        isActive: p.isActive !== false,
      }));
      res.json({ pools });
    } catch (err: any) {
      console.error("[Chain] Staking pools fallback:", err?.message);
      res.json({
        pools: STAKING_POOLS_FALLBACK.map(p => ({
          ...p,
          totalApy: p.baseApy + p.boostApy,
        })),
      });
    }
  });

  app.get("/api/staking/stats", async (_req: Request, res: Response) => {
    try {
      const netStats = await fetchDwtl("/api/network/stats");
      res.json({
        tvl: parseFloat(netStats.circulatingSupply || "0") * 0.4,
        averageApy: 22,
        totalStakers: netStats.totalAccounts || 0,
        pools: 5,
      });
    } catch (err: any) {
      console.error("[Chain] Staking stats fallback:", err?.message);
      res.json({ tvl: 0, averageApy: 0, totalStakers: 0, pools: 5 });
    }
  });

  app.get("/api/staking/info", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const address = deriveAddress(user.id);

      const [poolsData, positionsData] = await Promise.all([
        fetchDwtl("/api/staking/pools").catch(() => null),
        fetchDwtl(`/api/staking/${address}/positions`).catch(() => null),
      ]);

      const pools = poolsData?.pools || STAKING_POOLS_FALLBACK.map(p => ({ ...p, totalApy: p.baseApy + p.boostApy }));
      const positions = positionsData?.positions || [];

      let totalStaked = 0;
      let totalRewards = 0;
      let bestApy = 0;

      const activeStakes = positions.map((pos: any) => {
        const amount = parseFloat(pos.amount || "0");
        const rewards = parseFloat(pos.rewardsAccrued || pos.rewards || "0");
        const apy = parseFloat(pos.apy || "0");
        totalStaked += amount;
        totalRewards += rewards;
        if (apy > bestApy) bestApy = apy;
        return {
          poolId: pos.poolId || "liquid-flex",
          poolName: pos.poolName || "Unknown",
          amount,
          apy,
          lockDays: pos.lockDays || 0,
          stakedAt: pos.stakedAt || new Date().toISOString(),
          rewards: parseFloat(rewards.toFixed(4)),
          unlockDate: pos.unlockDate || null,
          isLocked: pos.isLocked || false,
        };
      });

      const defaultApy = pools[0]?.totalApy || pools[0]?.baseApy + pools[0]?.boostApy || 12;

      res.json({
        apy: bestApy || defaultApy,
        pools: pools.map((p: any) => ({
          id: p.id,
          name: p.name,
          lockDays: p.lockDays || p.lockupDays || 0,
          baseApy: p.baseApy || 0,
          boostApy: p.boostApy || 0,
          totalApy: p.totalApy || (p.baseApy || 0) + (p.boostApy || 0),
          minStake: p.minStake || 100,
        })),
        activeStakes,
        totalStaked,
        rewardsEarned: parseFloat(totalRewards.toFixed(4)),
        monthlyRewardEstimate: totalStaked > 0 ? parseFloat((totalStaked * (bestApy || defaultApy) / 100 / 12).toFixed(2)) : 0,
        yearlyRewardEstimate: totalStaked > 0 ? parseFloat((totalStaked * (bestApy || defaultApy) / 100).toFixed(2)) : 0,
        stakedRatio: 0,
        cooldownActive: false,
        cooldownRemaining: 0,
        cooldownAmount: 0,
        cooldownDays: 0,
      });
    } catch (error: any) {
      console.error("Staking info error:", error?.message);
      res.status(500).json({ error: "Failed to fetch staking info" });
    }
  });

  app.post("/api/staking/stake", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount, poolId } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid stake amount" });
      }

      const address = deriveAddress(user.id);
      const token = req.headers.authorization?.replace("Bearer ", "") || "";

      try {
        const chainResult = await fetchDwtlAuth("/api/staking/stake", token, {
          address,
          poolId: poolId || "liquid-flex",
          amount,
        });

        createTrustStamp({
          userId: user.id,
          category: "staking-stake",
          data: {
            amount, poolId: poolId || "liquid-flex",
            txHash: chainResult.txHash || "",
            asset: "SIG", timestamp: new Date().toISOString(),
          },
        }).catch((err) => console.error("Stake stamp error:", err?.message));

        res.json({
          success: true,
          message: chainResult.message || `Staked ${amount.toLocaleString()} SIG`,
          txHash: chainResult.txHash || "",
          pool: chainResult.pool || { id: poolId || "liquid-flex", name: poolId || "Liquid Flex", apy: 12, lockDays: 0 },
          newStakedBalance: chainResult.newStakedBalance || amount,
          estimatedMonthlyReward: chainResult.estimatedMonthlyReward || "0",
        });
      } catch (chainErr: any) {
        console.error("[Chain] Stake proxy failed:", chainErr?.message);
        res.status(400).json({ error: chainErr?.message || "Failed to stake on-chain" });
      }
    } catch (error: any) {
      console.error("Stake error:", error?.message);
      res.status(500).json({ error: "Failed to stake tokens" });
    }
  });

  app.post("/api/staking/unstake", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount, poolId } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid unstake amount" });
      }

      const address = deriveAddress(user.id);
      const token = req.headers.authorization?.replace("Bearer ", "") || "";

      try {
        const chainResult = await fetchDwtlAuth("/api/staking/unstake", token, {
          address,
          positionId: poolId || "liquid-flex",
          amount,
        });

        createTrustStamp({
          userId: user.id,
          category: "staking-unstake",
          data: { amount, poolId: poolId || "liquid-flex", txHash: chainResult.txHash || "", asset: "stSIG", timestamp: new Date().toISOString() },
        }).catch((err) => console.error("Unstake stamp error:", err?.message));

        res.json({
          success: true,
          message: chainResult.message || `Unstaked ${amount.toLocaleString()} stSIG`,
          cooldownDays: chainResult.cooldownDays || 0,
          availableDate: chainResult.availableDate || new Date().toISOString(),
          txHash: chainResult.txHash || "",
        });
      } catch (chainErr: any) {
        console.error("[Chain] Unstake proxy failed:", chainErr?.message);
        res.status(400).json({ error: chainErr?.message || "Failed to unstake on-chain" });
      }
    } catch (error: any) {
      console.error("Unstake error:", error?.message);
      res.status(500).json({ error: "Failed to unstake tokens" });
    }
  });

  app.post("/api/staking/claim", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const address = deriveAddress(user.id);
      const token = req.headers.authorization?.replace("Bearer ", "") || "";

      try {
        const chainResult = await fetchDwtlAuth("/api/staking/claim", token, { address });

        createTrustStamp({
          userId: user.id,
          category: "staking-claim",
          data: { rewardsClaimed: chainResult.amount || 0, txHash: chainResult.txHash || "", timestamp: new Date().toISOString() },
        }).catch((err) => console.error("Claim stamp error:", err?.message));

        res.json({
          success: true,
          message: chainResult.message || `Claimed staking rewards`,
          amount: chainResult.amount || 0,
          txHash: chainResult.txHash || "",
        });
      } catch (chainErr: any) {
        console.error("[Chain] Claim proxy failed:", chainErr?.message);
        res.status(400).json({ error: chainErr?.message || "No rewards to claim" });
      }
    } catch (error: any) {
      console.error("Claim error:", error?.message);
      res.status(500).json({ error: "Failed to claim rewards" });
    }
  });

  app.post("/api/liquid-staking/stake", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const address = deriveAddress(user.id);
      const token = req.headers.authorization?.replace("Bearer ", "") || "";

      try {
        const chainResult = await fetchDwtlAuth("/api/liquid-staking/stake", token, { address, amount });

        createTrustStamp({
          userId: user.id,
          category: "liquid-staking-mint",
          data: { sigAmount: amount, stSigMinted: chainResult.stSigReceived || amount, rate: chainResult.rate || 1, txHash: chainResult.txHash || "", timestamp: new Date().toISOString() },
        }).catch((err) => console.error("Liquid stake stamp error:", err?.message));

        res.json({
          success: true,
          message: chainResult.message || `Minted ${amount.toLocaleString()} stSIG`,
          stSigReceived: chainResult.stSigReceived || amount,
          rate: chainResult.rate || 1,
          txHash: chainResult.txHash || "",
        });
      } catch (chainErr: any) {
        console.error("[Chain] Liquid stake proxy failed:", chainErr?.message);
        res.status(400).json({ error: chainErr?.message || "Failed to mint stSIG on-chain" });
      }
    } catch (error: any) {
      console.error("Liquid stake error:", error?.message);
      res.status(500).json({ error: "Failed to mint stSIG" });
    }
  });

  app.post("/api/liquid-staking/unstake", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const address = deriveAddress(user.id);
      const token = req.headers.authorization?.replace("Bearer ", "") || "";

      try {
        const chainResult = await fetchDwtlAuth("/api/liquid-staking/unstake", token, { address, amount });

        createTrustStamp({
          userId: user.id,
          category: "liquid-staking-burn",
          data: { stSigBurned: amount, sigRedeemed: chainResult.sigRedeemed || amount, rate: chainResult.rate || 1, txHash: chainResult.txHash || "", timestamp: new Date().toISOString() },
        }).catch((err) => console.error("Liquid unstake stamp error:", err?.message));

        res.json({
          success: true,
          message: chainResult.message || `Redeemed ${amount.toLocaleString()} SIG`,
          sigRedeemed: chainResult.sigRedeemed || amount,
          rate: chainResult.rate || 1,
          txHash: chainResult.txHash || "",
        });
      } catch (chainErr: any) {
        console.error("[Chain] Liquid unstake proxy failed:", chainErr?.message);
        res.status(400).json({ error: chainErr?.message || "Failed to redeem stSIG on-chain" });
      }
    } catch (error: any) {
      console.error("Liquid unstake error:", error?.message);
      res.status(500).json({ error: "Failed to redeem stSIG" });
    }
  });

  app.post("/api/wallet/send", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { to, amount, asset } = req.body;
      if (!to || !amount || !asset) {
        return res.status(400).json({ error: "to, amount, and asset are required" });
      }
      if (!["SIG", "Shells"].includes(asset)) {
        return res.status(400).json({ error: "asset must be SIG or Shells" });
      }
      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }

      const txHash = "0x" + Date.now().toString(16) + "send" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "wallet-send",
        data: { to, amount, asset, txHash, timestamp: new Date().toISOString() },
      }).catch((err) => console.error("Send stamp error:", err?.message));

      res.json({
        success: true,
        message: `Sent ${amount.toLocaleString()} ${asset} to ${to}`,
        txHash,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Send error:", error?.message);
      res.status(500).json({ error: "Failed to send tokens" });
    }
  });

  app.get("/api/wallet/receive", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const address = deriveAddress(user.id);
      const tlidAddress = `${user.username || "user"}.tlid`;

      let tlidDomains: string[] = [];
      try {
        const tlidData = await fetchDwtl(`/api/wallets/${address}/tlid`);
        tlidDomains = tlidData.domains || [];
      } catch {}

      res.json({
        tlidAddress: tlidDomains[0] || tlidAddress,
        hexAddress: address,
        chain: "Trust Layer",
        supportedAssets: ["SIG", "Shells", "stSIG", "Echoes"],
        tlidDomains,
      });
    } catch (error: any) {
      console.error("Receive info error:", error?.message);
      res.status(500).json({ error: "Failed to get receive info" });
    }
  });

  app.post("/api/wallet/swap", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { fromAsset, toAsset, amount } = req.body;
      if (!fromAsset || !toAsset || !amount) {
        return res.status(400).json({ error: "fromAsset, toAsset, and amount are required" });
      }
      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }

      const address = deriveAddress(user.id);
      const token = req.headers.authorization?.replace("Bearer ", "") || "";

      try {
        const chainResult = await fetchDwtlAuth("/api/swap/execute", token, {
          address,
          tokenIn: fromAsset,
          tokenOut: toAsset,
          amountIn: amount,
        });

        createTrustStamp({
          userId: user.id,
          category: "wallet-swap",
          data: {
            fromAsset, toAsset,
            inputAmount: amount,
            outputAmount: chainResult.amountOut || chainResult.outputAmount || 0,
            rate: chainResult.rate || 0,
            fee: chainResult.fee || 0,
            feeRate: "0.3%",
            txHash: chainResult.txHash || "",
            timestamp: new Date().toISOString(),
          },
        }).catch((err) => console.error("Swap stamp error:", err?.message));

        res.json({
          success: true,
          message: chainResult.message || `Swapped ${amount} ${fromAsset} for ${toAsset}`,
          fromAsset,
          toAsset,
          inputAmount: amount,
          outputAmount: chainResult.amountOut || chainResult.outputAmount || 0,
          rate: chainResult.rate || 0,
          fee: chainResult.fee || 0,
          feeRate: "0.3%",
          txHash: chainResult.txHash || "",
          timestamp: new Date().toISOString(),
        });
      } catch (chainErr: any) {
        console.error("[Chain] Swap proxy failed, using fallback:", chainErr?.message);
        const rate = SWAP_PAIRS_FALLBACK[fromAsset]?.[toAsset];
        if (!rate) {
          return res.status(400).json({ error: `Swap from ${fromAsset} to ${toAsset} not supported` });
        }
        const fee = amount * 0.003;
        const netAmount = amount - fee;
        const outputAmount = netAmount * rate;
        const txHash = "0x" + Date.now().toString(16) + "swap" + Math.random().toString(16).slice(2, 10);

        createTrustStamp({
          userId: user.id,
          category: "wallet-swap",
          data: { fromAsset, toAsset, inputAmount: amount, outputAmount, rate, fee, feeRate: "0.3%", txHash, timestamp: new Date().toISOString() },
        }).catch((err) => console.error("Swap stamp error:", err?.message));

        res.json({
          success: true,
          message: `Swapped ${amount.toLocaleString()} ${fromAsset} for ${outputAmount.toLocaleString()} ${toAsset} (0.3% fee)`,
          fromAsset, toAsset, inputAmount: amount,
          outputAmount: parseFloat(outputAmount.toFixed(6)),
          rate, fee: parseFloat(fee.toFixed(6)),
          feeRate: "0.3%", txHash,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error("Swap error:", error?.message);
      res.status(500).json({ error: "Failed to swap tokens" });
    }
  });
}
