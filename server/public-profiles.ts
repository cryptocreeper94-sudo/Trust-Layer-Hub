import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, hallmarks, trustStamps, affiliateReferrals } from "./db/schema";
import { eq, sql, count, or, ilike } from "drizzle-orm";

export function registerPublicProfileRoutes(app: Express): void {
  /**
   * GET /api/users/search?q=query&limit=20&offset=0
   * Search users by username or displayName
   */
  app.get("/api/users/search", async (req: Request, res: Response) => {
    try {
      const { q, limit: limitStr, offset: offsetStr } = req.query;

      if (!q || typeof q !== "string" || q.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters." });
      }

      const limit = Math.min(parseInt(limitStr as string) || 20, 50);
      const offset = parseInt(offsetStr as string) || 0;
      const searchTerm = `%${q.trim().toLowerCase()}%`;

      const results = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          bio: users.bio,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(or(
          ilike(users.username, searchTerm),
          ilike(users.displayName, searchTerm),
          ilike(users.firstName, searchTerm),
        ))
        .limit(limit)
        .offset(offset);

      const mapped = results.map(u => ({
        username: u.username,
        displayName: u.displayName || u.firstName || u.username,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        tlid: `${u.username}.tlid`,
        memberSince: u.createdAt,
      }));

      res.json({ users: mapped, total: mapped.length, query: q });
    } catch (error: any) {
      console.error("User search error:", error?.message);
      res.status(500).json({ error: "Search failed." });
    }
  });

  /**
   * GET /api/users/:username/public — Public profile
   */
  app.get("/api/users/:username/public", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          bio: users.bio,
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
        displayName: user.displayName || user.firstName || user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
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

