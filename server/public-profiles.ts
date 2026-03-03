import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, hallmarks, trustStamps, affiliateReferrals } from "./db/schema";
import { eq, sql, count } from "drizzle-orm";

export function registerPublicProfileRoutes(app: Express): void {
  app.get("/api/users/:username/public", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.username, username));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const [hallmarkCount] = await db
        .select({ count: count() })
        .from(hallmarks)
        .where(eq(hallmarks.userId, user.id));

      const [stampCount] = await db
        .select({ count: count() })
        .from(trustStamps)
        .where(eq(trustStamps.userId, user.id));

      const [referralCount] = await db
        .select({ count: count() })
        .from(affiliateReferrals)
        .where(eq(affiliateReferrals.referrerId, user.id));

      const convertedRaw = await db.execute(sql`
        SELECT COUNT(*) as cnt FROM affiliate_referrals
        WHERE referrer_id = ${user.id} AND status = 'converted'
      `);
      const rows = (convertedRaw as any).rows || convertedRaw || [];
      const converted = parseInt(rows[0]?.cnt || "0", 10);

      const tiers = [
        { name: "Diamond", min: 50 },
        { name: "Platinum", min: 30 },
        { name: "Gold", min: 15 },
        { name: "Silver", min: 5 },
        { name: "Base", min: 0 },
      ];
      let tier = "Base";
      for (const t of tiers) {
        if (converted >= t.min) { tier = t.name; break; }
      }

      res.json({
        username: user.username,
        firstName: user.firstName,
        tlid: `${user.username}.tlid`,
        memberSince: user.createdAt,
        emailVerified: user.emailVerified,
        hallmarkCount: hallmarkCount?.count || 0,
        stampCount: stampCount?.count || 0,
        referralCount: referralCount?.count || 0,
        affiliateTier: tier,
      });
    } catch (error: any) {
      console.error("Public profile error:", error?.message);
      res.status(500).json({ error: "Failed to load profile" });
    }
  });
}
