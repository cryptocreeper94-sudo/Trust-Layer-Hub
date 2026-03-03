import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, affiliateReferrals, affiliateCommissions } from "./db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { authenticateToken } from "./auth";

const AFFILIATE_TIERS = [
  { name: "Base", minReferrals: 0, commissionRate: 10 },
  { name: "Silver", minReferrals: 5, commissionRate: 12.5 },
  { name: "Gold", minReferrals: 15, commissionRate: 15 },
  { name: "Platinum", minReferrals: 30, commissionRate: 17.5 },
  { name: "Diamond", minReferrals: 50, commissionRate: 20 },
];

function getAffiliateTier(referralCount: number) {
  let tier = AFFILIATE_TIERS[0];
  for (const t of AFFILIATE_TIERS) {
    if (referralCount >= t.minReferrals) tier = t;
  }
  return tier;
}

export function registerAffiliateRoutes(app: Express): void {
  app.get("/api/affiliate/dashboard", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const referrals = await db
        .select()
        .from(affiliateReferrals)
        .where(eq(affiliateReferrals.referrerId, user.id))
        .orderBy(desc(affiliateReferrals.createdAt));

      const commissions = await db
        .select()
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.referrerId, user.id))
        .orderBy(desc(affiliateCommissions.createdAt));

      const totalReferrals = referrals.length;
      const convertedReferrals = referrals.filter(r => r.status === "converted").length;
      const pendingReferrals = referrals.filter(r => r.status === "pending").length;

      const totalEarnings = commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      const pendingEarnings = commissions.filter(c => c.status === "pending").reduce((sum, c) => sum + parseFloat(c.amount), 0);
      const paidEarnings = commissions.filter(c => c.status === "paid").reduce((sum, c) => sum + parseFloat(c.amount), 0);

      const tier = getAffiliateTier(convertedReferrals);

      const nextTier = AFFILIATE_TIERS.find(t => t.minReferrals > convertedReferrals) || null;
      const referralsToNextTier = nextTier ? nextTier.minReferrals - convertedReferrals : 0;

      const referralLink = `https://trusthub.tlid.io/ref/${user.uniqueHash}`;

      res.json({
        uniqueHash: user.uniqueHash,
        referralLink,
        tier: {
          name: tier.name,
          commissionRate: tier.commissionRate,
        },
        nextTier: nextTier ? {
          name: nextTier.name,
          commissionRate: nextTier.commissionRate,
          referralsNeeded: referralsToNextTier,
        } : null,
        stats: {
          totalReferrals,
          convertedReferrals,
          pendingReferrals,
          totalEarnings,
          pendingEarnings,
          paidEarnings,
        },
        tiers: AFFILIATE_TIERS,
        recentReferrals: referrals.slice(0, 10).map(r => ({
          id: r.id,
          platform: r.platform,
          status: r.status,
          convertedAt: r.convertedAt,
          createdAt: r.createdAt,
        })),
        recentCommissions: commissions.slice(0, 10).map(c => ({
          id: c.id,
          amount: c.amount,
          currency: c.currency,
          tier: c.tier,
          status: c.status,
          paidAt: c.paidAt,
          createdAt: c.createdAt,
        })),
      });
    } catch (error) {
      console.error("Affiliate dashboard error:", error);
      res.status(500).json({ error: "Failed to load affiliate dashboard" });
    }
  });

  app.get("/api/affiliate/link", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const referralLink = `https://trusthub.tlid.io/ref/${user.uniqueHash}`;
      res.json({
        uniqueHash: user.uniqueHash,
        referralLink,
        platforms: [
          { name: "Trust Layer Hub", url: `https://trusthub.tlid.io/ref/${user.uniqueHash}` },
          { name: "TrustVault", url: `https://trustvault.tlid.io/ref/${user.uniqueHash}` },
          { name: "THE VOID", url: `https://thevoid.tlid.io/ref/${user.uniqueHash}` },
          { name: "TradeWorks AI", url: `https://tradeworks.tlid.io/ref/${user.uniqueHash}` },
          { name: "Signal Chat", url: `https://signalchat.tlid.io/ref/${user.uniqueHash}` },
        ],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get affiliate link" });
    }
  });

  app.post("/api/affiliate/track", async (req: Request, res: Response) => {
    try {
      const { referralHash, platform } = req.body;
      if (!referralHash) {
        return res.status(400).json({ error: "Referral hash is required" });
      }

      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.uniqueHash, referralHash));

      if (!referrer) {
        return res.status(404).json({ error: "Invalid referral code" });
      }

      const [referral] = await db
        .insert(affiliateReferrals)
        .values({
          referrerId: referrer.id,
          referralHash,
          platform: platform || "trusthub",
          status: "pending",
        })
        .returning();

      res.json({ tracked: true, referralId: referral.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to track referral" });
    }
  });

  app.post("/api/affiliate/request-payout", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const pendingCommissions = await db
        .select()
        .from(affiliateCommissions)
        .where(and(
          eq(affiliateCommissions.referrerId, user.id),
          eq(affiliateCommissions.status, "pending")
        ));

      const totalPending = pendingCommissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);

      if (totalPending < 10) {
        return res.status(400).json({ error: "Minimum payout is 10 SIG" });
      }

      res.json({
        message: "Payout request submitted. You will receive your SIG tokens within 48 hours.",
        amount: totalPending,
        currency: "SIG",
        commissionsCount: pendingCommissions.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to request payout" });
    }
  });
}
