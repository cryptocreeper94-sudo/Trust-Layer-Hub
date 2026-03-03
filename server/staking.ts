import type { Express, Request, Response } from "express";
import { authenticateToken } from "./auth";
import { createTrustStamp } from "./hallmark";

const STAKING_APY = 12.5;
const COOLDOWN_DAYS = 7;

const userCooldowns: Map<number, { amount: number; startedAt: Date }> = new Map();

export function registerStakingRoutes(app: Express): void {
  app.get("/api/staking/info", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const cooldown = userCooldowns.get(user.id);
      const cooldownActive = cooldown
        ? Date.now() - cooldown.startedAt.getTime() < COOLDOWN_DAYS * 86400000
        : false;
      const cooldownRemaining = cooldown && cooldownActive
        ? Math.ceil((COOLDOWN_DAYS * 86400000 - (Date.now() - cooldown.startedAt.getTime())) / 86400000)
        : 0;

      res.json({
        apy: STAKING_APY,
        cooldownDays: COOLDOWN_DAYS,
        totalStaked: 50000,
        rewardsEarned: 1562.5,
        monthlyRewardEstimate: 520.83,
        yearlyRewardEstimate: 6250,
        stakedRatio: 0.397,
        cooldownActive,
        cooldownRemaining,
        cooldownAmount: cooldown?.amount || 0,
      });
    } catch (error: any) {
      console.error("Staking info error:", error?.message);
      res.status(500).json({ error: "Failed to fetch staking info" });
    }
  });

  app.post("/api/staking/stake", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid stake amount" });
      }

      const txHash = "0x" + Date.now().toString(16) + "stake" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "staking-stake",
        data: { amount, txHash, asset: "SIG", newStakedBalance: 50000 + amount, timestamp: new Date().toISOString() },
      }).catch((err) => console.error("Stake stamp error:", err?.message));

      res.json({
        success: true,
        message: `Successfully staked ${amount.toLocaleString()} SIG`,
        txHash,
        newStakedBalance: 50000 + amount,
        estimatedMonthlyReward: ((50000 + amount) * STAKING_APY / 100 / 12).toFixed(2),
      });
    } catch (error: any) {
      console.error("Stake error:", error?.message);
      res.status(500).json({ error: "Failed to stake tokens" });
    }
  });

  app.post("/api/staking/unstake", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid unstake amount" });
      }

      userCooldowns.set(user.id, { amount, startedAt: new Date() });

      const txHash = "0x" + Date.now().toString(16) + "unstk" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "staking-unstake",
        data: { amount, txHash, asset: "stSIG", cooldownDays: COOLDOWN_DAYS, timestamp: new Date().toISOString() },
      }).catch((err) => console.error("Unstake stamp error:", err?.message));

      res.json({
        success: true,
        message: `Unstaking ${amount.toLocaleString()} stSIG initiated`,
        cooldownDays: COOLDOWN_DAYS,
        availableDate: new Date(Date.now() + COOLDOWN_DAYS * 86400000).toISOString(),
        txHash,
      });
    } catch (error: any) {
      console.error("Unstake error:", error?.message);
      res.status(500).json({ error: "Failed to unstake tokens" });
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

      const rates: Record<string, Record<string, number>> = {
        SIG: { Shells: 1000, stSIG: 1 },
        Shells: { SIG: 0.001, stSIG: 0.001 },
        stSIG: { SIG: 1, Shells: 1000 },
      };

      const rate = rates[fromAsset]?.[toAsset];
      if (!rate) {
        return res.status(400).json({ error: `Swap from ${fromAsset} to ${toAsset} not supported` });
      }

      const outputAmount = amount * rate;
      const txHash = "0x" + Date.now().toString(16) + "swap" + Math.random().toString(16).slice(2, 10);

      createTrustStamp({
        userId: user.id,
        category: "wallet-swap",
        data: { fromAsset, toAsset, inputAmount: amount, outputAmount, rate, txHash, timestamp: new Date().toISOString() },
      }).catch((err) => console.error("Swap stamp error:", err?.message));

      res.json({
        success: true,
        message: `Swapped ${amount.toLocaleString()} ${fromAsset} for ${outputAmount.toLocaleString()} ${toAsset}`,
        fromAsset,
        toAsset,
        inputAmount: amount,
        outputAmount,
        rate,
        txHash,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Swap error:", error?.message);
      res.status(500).json({ error: "Failed to swap tokens" });
    }
  });
}
