import type { Express, Request, Response } from "express";
import { authenticateToken } from "./auth";
import { createTrustStamp } from "./hallmark";

interface StakingPool {
  id: string;
  name: string;
  lockDays: number;
  baseApy: number;
  boostApy: number;
  minStake: number;
  description: string;
}

const STAKING_POOLS: StakingPool[] = [
  { id: "liquid-flex", name: "Liquid Flex", lockDays: 0, baseApy: 10, boostApy: 2, minStake: 100, description: "Flexible staking with no lock period" },
  { id: "core-guard-45", name: "Core Guard 45", lockDays: 45, baseApy: 14, boostApy: 3, minStake: 500, description: "45-day lock for higher rewards" },
  { id: "core-guard-90", name: "Core Guard 90", lockDays: 90, baseApy: 18, boostApy: 4, minStake: 1000, description: "90-day lock for enhanced yields" },
  { id: "core-guard-180", name: "Core Guard 180", lockDays: 180, baseApy: 24, boostApy: 5, minStake: 2500, description: "180-day lock for premium returns" },
  { id: "founders-forge", name: "Founders Forge", lockDays: 365, baseApy: 30, boostApy: 8, minStake: 5000, description: "365-day lock for maximum yield" },
];

const SWAP_FEE = 0.003;

const SWAP_PAIRS: Record<string, Record<string, number>> = {
  SIG: { Shells: 1000, stSIG: 1, USDC: 0.01, USDT: 0.01 },
  Shells: { SIG: 0.001, stSIG: 0.001 },
  stSIG: { SIG: 1, Shells: 1000 },
  USDC: { SIG: 100 },
  USDT: { SIG: 100 },
};

const userStakes: Map<number, Map<string, { amount: number; stakedAt: Date }>> = new Map();
const userCooldowns: Map<number, { amount: number; startedAt: Date; poolId: string }> = new Map();

function getUserStakes(userId: number) {
  if (!userStakes.has(userId)) {
    userStakes.set(userId, new Map());
  }
  return userStakes.get(userId)!;
}

function calculateRewards(amount: number, apy: number, daysStaked: number): number {
  return (amount * apy / 100) * (daysStaked / 365);
}

export function registerStakingRoutes(app: Express): void {
  app.get("/api/staking/pools", (_req: Request, res: Response) => {
    res.json({
      pools: STAKING_POOLS.map(p => ({
        ...p,
        totalApy: p.baseApy + p.boostApy,
      })),
    });
  });

  app.get("/api/staking/stats", (_req: Request, res: Response) => {
    let totalStaked = 0;
    let weightedApy = 0;
    let stakeCount = 0;

    userStakes.forEach((stakes) => {
      stakes.forEach((stake, poolId) => {
        const pool = STAKING_POOLS.find(p => p.id === poolId);
        if (pool) {
          totalStaked += stake.amount;
          weightedApy += stake.amount * (pool.baseApy + pool.boostApy);
          stakeCount++;
        }
      });
    });

    const averageApy = totalStaked > 0 ? weightedApy / totalStaked : 0;

    res.json({
      tvl: totalStaked,
      averageApy: parseFloat(averageApy.toFixed(2)),
      totalStakers: stakeCount,
      pools: STAKING_POOLS.length,
    });
  });

  app.get("/api/staking/info", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const stakes = getUserStakes(user.id);
      const cooldown = userCooldowns.get(user.id);

      let totalStaked = 0;
      let totalRewards = 0;
      let bestApy = 0;
      const activeStakes: Array<{
        poolId: string;
        poolName: string;
        amount: number;
        apy: number;
        lockDays: number;
        stakedAt: string;
        rewards: number;
        unlockDate: string | null;
        isLocked: boolean;
      }> = [];

      stakes.forEach((stake, poolId) => {
        const pool = STAKING_POOLS.find(p => p.id === poolId);
        if (pool) {
          totalStaked += stake.amount;
          const daysStaked = (Date.now() - stake.stakedAt.getTime()) / 86400000;
          const totalApy = pool.baseApy + pool.boostApy;
          const rewards = calculateRewards(stake.amount, totalApy, daysStaked);
          totalRewards += rewards;
          if (totalApy > bestApy) bestApy = totalApy;

          const unlockDate = pool.lockDays > 0
            ? new Date(stake.stakedAt.getTime() + pool.lockDays * 86400000)
            : null;
          const isLocked = unlockDate ? Date.now() < unlockDate.getTime() : false;

          activeStakes.push({
            poolId: pool.id,
            poolName: pool.name,
            amount: stake.amount,
            apy: totalApy,
            lockDays: pool.lockDays,
            stakedAt: stake.stakedAt.toISOString(),
            rewards: parseFloat(rewards.toFixed(4)),
            unlockDate: unlockDate?.toISOString() || null,
            isLocked,
          });
        }
      });

      const cooldownActive = cooldown
        ? Date.now() - cooldown.startedAt.getTime() < (STAKING_POOLS.find(p => p.id === cooldown.poolId)?.lockDays || 7) * 86400000
        : false;
      const pool = cooldown ? STAKING_POOLS.find(p => p.id === cooldown.poolId) : null;
      const cooldownDays = pool?.lockDays || 0;
      const cooldownRemaining = cooldown && cooldownActive
        ? Math.ceil((cooldownDays * 86400000 - (Date.now() - cooldown.startedAt.getTime())) / 86400000)
        : 0;

      const monthlyRewardEstimate = totalStaked > 0 && bestApy > 0
        ? (totalStaked * bestApy / 100 / 12)
        : 0;

      res.json({
        apy: bestApy || ((STAKING_POOLS[0]?.baseApy || 10) + (STAKING_POOLS[0]?.boostApy || 0)),
        pools: STAKING_POOLS.map(p => ({
          id: p.id,
          name: p.name,
          lockDays: p.lockDays,
          baseApy: p.baseApy,
          boostApy: p.boostApy,
          totalApy: p.baseApy + p.boostApy,
          minStake: p.minStake,
        })),
        activeStakes,
        totalStaked,
        rewardsEarned: parseFloat(totalRewards.toFixed(4)),
        monthlyRewardEstimate: parseFloat(monthlyRewardEstimate.toFixed(2)),
        yearlyRewardEstimate: parseFloat((totalStaked * bestApy / 100).toFixed(2)),
        stakedRatio: 0,
        cooldownActive,
        cooldownRemaining,
        cooldownAmount: cooldown?.amount || 0,
        cooldownDays: cooldownDays,
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

      const pool = STAKING_POOLS.find(p => p.id === (poolId || "liquid-flex"));
      if (!pool) {
        return res.status(400).json({ error: "Invalid staking pool" });
      }

      if (amount < pool.minStake) {
        return res.status(400).json({ error: `Minimum stake for ${pool.name} is ${pool.minStake.toLocaleString()} SIG` });
      }

      const stakes = getUserStakes(user.id);
      const existing = stakes.get(pool.id);
      if (existing) {
        existing.amount += amount;
      } else {
        stakes.set(pool.id, { amount, stakedAt: new Date() });
      }

      const txHash = "0x" + Date.now().toString(16) + "stake" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "staking-stake",
        data: {
          amount,
          poolId: pool.id,
          poolName: pool.name,
          apy: pool.baseApy + pool.boostApy,
          lockDays: pool.lockDays,
          txHash,
          asset: "SIG",
          timestamp: new Date().toISOString(),
        },
      }).catch((err) => console.error("Stake stamp error:", err?.message));

      const totalInPool = stakes.get(pool.id)?.amount || amount;
      const stakeTotalApy = pool.baseApy + pool.boostApy;

      res.json({
        success: true,
        message: `Staked ${amount.toLocaleString()} SIG in ${pool.name} at ${stakeTotalApy}% APY`,
        txHash,
        pool: { id: pool.id, name: pool.name, apy: stakeTotalApy, lockDays: pool.lockDays },
        newStakedBalance: totalInPool,
        estimatedMonthlyReward: (totalInPool * stakeTotalApy / 100 / 12).toFixed(2),
      });
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

      const targetPoolId = poolId || "liquid-flex";
      const pool = STAKING_POOLS.find(p => p.id === targetPoolId);
      if (!pool) {
        return res.status(400).json({ error: "Invalid staking pool" });
      }

      const stakes = getUserStakes(user.id);
      const stake = stakes.get(targetPoolId);

      if (!stake || stake.amount < amount) {
        return res.status(400).json({ error: "Insufficient staked balance in this pool" });
      }

      if (pool.lockDays > 0) {
        const unlockDate = new Date(stake.stakedAt.getTime() + pool.lockDays * 86400000);
        if (Date.now() < unlockDate.getTime()) {
          const daysRemaining = Math.ceil((unlockDate.getTime() - Date.now()) / 86400000);
          return res.status(400).json({
            error: `Stake is locked for ${daysRemaining} more days. Unlock date: ${unlockDate.toISOString().split("T")[0]}`,
          });
        }
      }

      stake.amount -= amount;
      if (stake.amount <= 0) {
        stakes.delete(targetPoolId);
      }

      if (pool.id === "liquid-flex") {
        userCooldowns.set(user.id, { amount, startedAt: new Date(), poolId: pool.id });
      }

      const txHash = "0x" + Date.now().toString(16) + "unstk" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "staking-unstake",
        data: {
          amount,
          poolId: pool.id,
          poolName: pool.name,
          txHash,
          asset: "stSIG",
          timestamp: new Date().toISOString(),
        },
      }).catch((err) => console.error("Unstake stamp error:", err?.message));

      res.json({
        success: true,
        message: `Unstaked ${amount.toLocaleString()} stSIG from ${pool.name}`,
        cooldownDays: pool.id === "liquid-flex" ? 0 : pool.lockDays,
        availableDate: new Date().toISOString(),
        txHash,
      });
    } catch (error: any) {
      console.error("Unstake error:", error?.message);
      res.status(500).json({ error: "Failed to unstake tokens" });
    }
  });

  app.post("/api/staking/claim", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const stakes = getUserStakes(user.id);
      let totalRewards = 0;

      stakes.forEach((stake, poolId) => {
        const pool = STAKING_POOLS.find(p => p.id === poolId);
        if (pool) {
          const daysStaked = (Date.now() - stake.stakedAt.getTime()) / 86400000;
          totalRewards += calculateRewards(stake.amount, pool.baseApy + pool.boostApy, daysStaked);
        }
      });

      if (totalRewards <= 0) {
        return res.status(400).json({ error: "No rewards to claim" });
      }

      const txHash = "0x" + Date.now().toString(16) + "clm" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "staking-claim",
        data: {
          rewardsClaimed: parseFloat(totalRewards.toFixed(4)),
          txHash,
          timestamp: new Date().toISOString(),
        },
      }).catch((err) => console.error("Claim stamp error:", err?.message));

      stakes.forEach((stake) => {
        stake.stakedAt = new Date();
      });

      res.json({
        success: true,
        message: `Claimed ${totalRewards.toFixed(4)} SIG in staking rewards`,
        amount: parseFloat(totalRewards.toFixed(4)),
        txHash,
      });
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

      const txHash = "0x" + Date.now().toString(16) + "lstk" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "liquid-staking-mint",
        data: { sigAmount: amount, stSigMinted: amount, rate: 1, txHash, timestamp: new Date().toISOString() },
      }).catch((err) => console.error("Liquid stake stamp error:", err?.message));

      res.json({
        success: true,
        message: `Minted ${amount.toLocaleString()} stSIG (1:1 exchange rate)`,
        stSigReceived: amount,
        rate: 1,
        txHash,
      });
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

      const txHash = "0x" + Date.now().toString(16) + "lust" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "liquid-staking-burn",
        data: { stSigBurned: amount, sigRedeemed: amount, rate: 1, txHash, timestamp: new Date().toISOString() },
      }).catch((err) => console.error("Liquid unstake stamp error:", err?.message));

      res.json({
        success: true,
        message: `Burned ${amount.toLocaleString()} stSIG, redeemed ${amount.toLocaleString()} SIG`,
        sigRedeemed: amount,
        rate: 1,
        txHash,
      });
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
      const tlidAddress = `${user.username || "user"}.tlid`;
      const hexAddress = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      res.json({
        tlidAddress,
        hexAddress,
        chain: "Trust Layer",
        supportedAssets: ["SIG", "Shells", "stSIG"],
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

      const rate = SWAP_PAIRS[fromAsset]?.[toAsset];
      if (!rate) {
        return res.status(400).json({ error: `Swap from ${fromAsset} to ${toAsset} not supported` });
      }

      const fee = amount * SWAP_FEE;
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
        fromAsset,
        toAsset,
        inputAmount: amount,
        outputAmount: parseFloat(outputAmount.toFixed(6)),
        rate,
        fee: parseFloat(fee.toFixed(6)),
        feeRate: "0.3%",
        txHash,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Swap error:", error?.message);
      res.status(500).json({ error: "Failed to swap tokens" });
    }
  });
}
