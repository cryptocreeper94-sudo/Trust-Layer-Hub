import type { Express, Request, Response } from "express";
import { db } from "./db";
import { trustStamps, users } from "./db/schema";
import { desc, sql } from "drizzle-orm";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "auth-register": "joined the Trust Layer ecosystem",
  "auth-login": "signed into their account",
  "wallet-send": "sent tokens",
  "wallet-swap": "swapped assets",
  "staking-stake": "staked SIG tokens",
  "staking-unstake": "initiated unstaking",
  "stripe-connect": "connected Stripe business",
  "stripe-disconnect": "disconnected Stripe",
  "affiliate-payout-request": "requested affiliate payout",
  "hallmark-generated": "received a new hallmark",
  "purchase": "made a purchase",
  "multisig-approve": "approved a multi-sig transaction",
};

function anonymize(username: string | null): string {
  if (!username || username.length < 3) return "use***";
  return username.slice(0, 3) + "***";
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function registerActivityFeedRoutes(app: Express): void {
  app.get("/api/activity/feed", async (_req: Request, res: Response) => {
    try {
      const feedRaw = await db.execute(sql`
        SELECT ts.category, ts.created_at, u.username
        FROM trust_stamps ts
        LEFT JOIN users u ON u.id = ts.user_id
        WHERE ts.category IN (
          'auth-register', 'wallet-send', 'wallet-swap',
          'staking-stake', 'staking-unstake', 'stripe-connect',
          'affiliate-payout-request', 'hallmark-generated', 'purchase'
        )
        ORDER BY ts.created_at DESC
        LIMIT 20
      `);

      const rows = (feedRaw as any).rows || feedRaw || [];

      const events = rows.map((r: any) => ({
        category: r.category,
        user: anonymize(r.username),
        description: CATEGORY_DESCRIPTIONS[r.category] || "performed an action",
        timeAgo: timeAgo(new Date(r.created_at)),
        timestamp: r.created_at,
      }));

      res.json({ events });
    } catch (error: any) {
      console.error("Activity feed error:", error?.message);
      res.json({ events: [] });
    }
  });
}
