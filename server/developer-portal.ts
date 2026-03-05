import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, sessions, hallmarks, trustStamps, chatChannels, chatMessages, linkedAccounts, stripeConnections } from "./db/schema";
import { sql, eq, and, gt } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { authenticateToken } from "./auth";

const BOOT_TIME = Date.now();

async function requireAdmin(req: Request, res: Response, next: Function) {
  const user = (req as any).user;
  if (!user || (user.role !== "admin" && user.role !== "developer")) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

const API_ENDPOINTS = [
  { method: "POST", path: "/api/auth/register", auth: false, desc: "Register new user" },
  { method: "POST", path: "/api/auth/login", auth: false, desc: "Login with credentials" },
  { method: "POST", path: "/api/auth/logout", auth: true, desc: "Logout current session" },
  { method: "GET", path: "/api/auth/me", auth: true, desc: "Get current user profile" },
  { method: "POST", path: "/api/auth/verify-email", auth: true, desc: "Verify email with code" },
  { method: "POST", path: "/api/auth/send-verification", auth: true, desc: "Send verification email" },
  { method: "POST", path: "/api/auth/send-sms-code", auth: true, desc: "Send SMS 2FA code" },
  { method: "POST", path: "/api/auth/verify-sms", auth: true, desc: "Verify SMS 2FA code" },
  { method: "POST", path: "/api/auth/enable-2fa", auth: true, desc: "Enable two-factor auth" },
  { method: "GET", path: "/api/balance", auth: true, desc: "Get SIG/Shells/stSIG balances" },
  { method: "GET", path: "/api/user/transactions", auth: true, desc: "Get transaction history" },
  { method: "GET", path: "/api/user/dwc-bag", auth: true, desc: "Get DWC token bag" },
  { method: "GET", path: "/api/shells/my-balance", auth: true, desc: "Get Shells balance" },
  { method: "POST", path: "/api/shells/purchase", auth: true, desc: "Purchase Shells" },
  { method: "GET", path: "/api/network/stats", auth: false, desc: "Blockchain network stats" },
  { method: "GET", path: "/api/swap/pairs", auth: false, desc: "Available swap pairs" },
  { method: "GET", path: "/api/swap/quote", auth: false, desc: "Get swap quote" },
  { method: "POST", path: "/api/swap/execute", auth: true, desc: "Execute token swap" },
  { method: "GET", path: "/api/staking/pools", auth: false, desc: "List staking pools" },
  { method: "GET", path: "/api/staking/positions", auth: true, desc: "User staking positions" },
  { method: "POST", path: "/api/staking/stake", auth: true, desc: "Stake SIG tokens" },
  { method: "POST", path: "/api/staking/unstake", auth: true, desc: "Unstake SIG tokens" },
  { method: "POST", path: "/api/staking/claim", auth: true, desc: "Claim staking rewards" },
  { method: "GET", path: "/api/liquid-staking/rate", auth: false, desc: "stSIG exchange rate" },
  { method: "GET", path: "/api/news/national", auth: false, desc: "National news feed" },
  { method: "GET", path: "/api/news/world", auth: false, desc: "World news feed" },
  { method: "GET", path: "/api/news/crypto", auth: false, desc: "Crypto news feed" },
  { method: "GET", path: "/api/pulse/summary", auth: false, desc: "DarkWave Pulse market signals" },
  { method: "GET", path: "/api/hallmarks/genesis", auth: false, desc: "Genesis hallmark data" },
  { method: "POST", path: "/api/hallmarks", auth: true, desc: "Create new hallmark" },
  { method: "GET", path: "/api/hallmarks/timeline", auth: true, desc: "User hallmark timeline" },
  { method: "GET", path: "/api/leaderboard", auth: false, desc: "Community leaderboard" },
  { method: "GET", path: "/api/activity/feed", auth: false, desc: "Ecosystem activity feed" },
  { method: "GET", path: "/api/users/:username/public", auth: false, desc: "Public trust profile" },
  { method: "GET", path: "/api/affiliate/stats", auth: true, desc: "Affiliate dashboard stats" },
  { method: "GET", path: "/api/affiliate/referrals", auth: true, desc: "Affiliate referrals list" },
  { method: "GET", path: "/api/chat/channels", auth: true, desc: "List chat channels" },
  { method: "GET", path: "/api/chat/messages/:channelId", auth: true, desc: "Channel message history" },
  { method: "POST", path: "/api/chat/messages", auth: true, desc: "Send chat message" },
  { method: "POST", path: "/api/ai/chat", auth: true, desc: "AI agent chat" },
  { method: "GET", path: "/api/stripe/status", auth: true, desc: "Stripe connection status" },
  { method: "GET", path: "/api/plaid/accounts", auth: true, desc: "Linked bank accounts" },
  { method: "POST", path: "/api/plaid/create-link-token", auth: true, desc: "Create Plaid link token" },
];

export function registerDeveloperPortalRoutes(app: Express) {
  app.get("/api/developer/stats", authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const [
        userCount,
        sessionCount,
        hallmarkCount,
        stampCount,
        channelCount,
        messageCount,
        linkedCount,
        stripeCount,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users).then(r => Number(r[0]?.count || 0)),
        db.select({ count: sql<number>`count(*)` }).from(sessions).then(r => Number(r[0]?.count || 0)),
        db.select({ count: sql<number>`count(*)` }).from(hallmarks).then(r => Number(r[0]?.count || 0)),
        db.select({ count: sql<number>`count(*)` }).from(trustStamps).then(r => Number(r[0]?.count || 0)),
        db.select({ count: sql<number>`count(*)` }).from(chatChannels).then(r => Number(r[0]?.count || 0)),
        db.select({ count: sql<number>`count(*)` }).from(chatMessages).then(r => Number(r[0]?.count || 0)),
        db.select({ count: sql<number>`count(*)` }).from(linkedAccounts).then(r => Number(r[0]?.count || 0)),
        db.select({ count: sql<number>`count(*)` }).from(stripeConnections).then(r => Number(r[0]?.count || 0)),
      ]);

      let networkStats = null;
      {
        const nc = new AbortController();
        const nt = setTimeout(() => nc.abort(), 5000);
        try {
          const nRes = await fetch("https://dwtl.io/api/network/stats", { signal: nc.signal });
          if (nRes.ok) networkStats = await nRes.json();
        } catch {} finally { clearTimeout(nt); }
      }

      let pulseStats = null;
      {
        const pc = new AbortController();
        const pt = setTimeout(() => pc.abort(), 5000);
        try {
          const pRes = await fetch("https://darkwavepulse.com/api/public/market-summary", { signal: pc.signal });
          if (pRes.ok) pulseStats = await pRes.json();
        } catch {} finally { clearTimeout(pt); }
      }

      const uptimeMs = Date.now() - BOOT_TIME;
      const uptimeHours = Math.floor(uptimeMs / 3600000);
      const uptimeMinutes = Math.floor((uptimeMs % 3600000) / 60000);

      res.json({
        system: {
          uptime: `${uptimeHours}h ${uptimeMinutes}m`,
          uptimeMs,
          bootTime: new Date(BOOT_TIME).toISOString(),
          nodeVersion: process.version,
          env: process.env.NODE_ENV || "development",
          memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
        database: {
          users: userCount,
          activeSessions: sessionCount,
          hallmarks: hallmarkCount,
          trustStamps: stampCount,
          chatChannels: channelCount,
          chatMessages: messageCount,
          linkedAccounts: linkedCount,
          stripeConnections: stripeCount,
        },
        blockchain: networkStats ? {
          status: "connected",
          blockTime: networkStats.blockTime,
          tps: networkStats.tps,
          lastBlock: networkStats.lastBlock,
          totalAccounts: networkStats.totalAccounts,
          consensus: networkStats.consensus,
          chainId: networkStats.chainId,
          isTestnet: networkStats.isTestnet,
        } : { status: "unreachable" },
        pulse: pulseStats ? {
          status: "connected",
          activeSignals: pulseStats.activeSignals,
          sentiment: pulseStats.marketSentiment,
          sentimentScore: pulseStats.sentimentScore,
          accuracy: pulseStats.predictionAccuracy,
          totalPredictions: pulseStats.totalPredictions,
        } : { status: "unreachable" },
        endpoints: {
          total: API_ENDPOINTS.length,
          public: API_ENDPOINTS.filter(e => !e.auth).length,
          authenticated: API_ENDPOINTS.filter(e => e.auth).length,
          list: API_ENDPOINTS,
        },
      });
    } catch (err: any) {
      console.error("[DevPortal] Stats error:", err?.message);
      res.status(500).json({ error: "Failed to load developer stats" });
    }
  });

  app.get("/api/developer/health", authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    const checks: Record<string, string> = {};

    try {
      await db.select({ count: sql<number>`1` }).from(users);
      checks.database = "healthy";
    } catch {
      checks.database = "unhealthy";
    }

    {
      const bc = new AbortController();
      const bt = setTimeout(() => bc.abort(), 5000);
      try {
        const r = await fetch("https://dwtl.io/api/network/stats", { signal: bc.signal });
        checks.blockchain = r.ok ? "healthy" : "degraded";
      } catch {
        checks.blockchain = "unreachable";
      } finally { clearTimeout(bt); }
    }

    {
      const pc = new AbortController();
      const pt = setTimeout(() => pc.abort(), 5000);
      try {
        const r = await fetch("https://darkwavepulse.com/api/public/market-summary", { signal: pc.signal });
        checks.pulse = r.ok ? "healthy" : "degraded";
      } catch {
        checks.pulse = "unreachable";
      } finally { clearTimeout(pt); }
    }

    checks.server = "healthy";

    const allHealthy = Object.values(checks).every(v => v === "healthy");
    res.json({ status: allHealthy ? "healthy" : "degraded", checks });
  });

  app.get("/developer", (_req: Request, res: Response) => {
    const templatePath = path.resolve(process.cwd(), "server", "templates", "developer-portal.html");
    if (!fs.existsSync(templatePath)) {
      return res.status(404).send("Developer portal not found");
    }
    const html = fs.readFileSync(templatePath, "utf-8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });
}
