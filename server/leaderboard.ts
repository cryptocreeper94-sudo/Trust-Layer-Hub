import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users, affiliateReferrals, trustStamps } from "./db/schema";
import { eq, sql, desc } from "drizzle-orm";

export function registerLeaderboardRoutes(app: Express): void {
  app.get("/api/leaderboard", async (_req: Request, res: Response) => {
    try {
      const topAffiliatesRaw = await db.execute(sql`
        SELECT u.username, u.created_at,
          COUNT(ar.id) FILTER (WHERE ar.status = 'converted') as converted_count
        FROM users u
        LEFT JOIN affiliate_referrals ar ON ar.referrer_id = u.id
        GROUP BY u.id, u.username, u.created_at
        HAVING COUNT(ar.id) FILTER (WHERE ar.status = 'converted') > 0
        ORDER BY converted_count DESC
        LIMIT 20
      `);

      const topStakersRaw = await db.execute(sql`
        SELECT u.username, u.created_at,
          COUNT(ts.id) as stake_count
        FROM users u
        INNER JOIN trust_stamps ts ON ts.user_id = u.id AND ts.category = 'staking-stake'
        GROUP BY u.id, u.username, u.created_at
        ORDER BY stake_count DESC
        LIMIT 20
      `);

      const mostActiveRaw = await db.execute(sql`
        SELECT u.username, u.created_at,
          COUNT(ts.id) as stamp_count
        FROM users u
        INNER JOIN trust_stamps ts ON ts.user_id = u.id
        GROUP BY u.id, u.username, u.created_at
        ORDER BY stamp_count DESC
        LIMIT 20
      `);

      const tiers = [
        { name: "Diamond", min: 50 },
        { name: "Platinum", min: 30 },
        { name: "Gold", min: 15 },
        { name: "Silver", min: 5 },
        { name: "Base", min: 0 },
      ];

      function getTier(count: number) {
        for (const t of tiers) {
          if (count >= t.min) return t.name;
        }
        return "Base";
      }

      const rows = (r: any) => r.rows || r || [];

      const topAffiliates = rows(topAffiliatesRaw).map((r: any, i: number) => ({
        rank: i + 1,
        username: r.username,
        convertedReferrals: parseInt(r.converted_count) || 0,
        tier: getTier(parseInt(r.converted_count) || 0),
        memberSince: r.created_at,
      }));

      const topStakers = rows(topStakersRaw).map((r: any, i: number) => ({
        rank: i + 1,
        username: r.username,
        stakeActions: parseInt(r.stake_count) || 0,
        memberSince: r.created_at,
      }));

      const mostActive = rows(mostActiveRaw).map((r: any, i: number) => ({
        rank: i + 1,
        username: r.username,
        stampCount: parseInt(r.stamp_count) || 0,
        memberSince: r.created_at,
      }));

      res.json({ topAffiliates, topStakers, mostActive });
    } catch (error: any) {
      console.error("Leaderboard error:", error?.message);
      res.json({ topAffiliates: [], topStakers: [], mostActive: [] });
    }
  });
}
