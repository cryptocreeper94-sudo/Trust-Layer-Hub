/**
 * Profile Management API
 * 
 * Authenticated endpoints for managing user profile:
 * - PUT /api/profile — update displayName, bio, username
 * - POST /api/profile/avatar — upload profile picture (base64)
 * - DELETE /api/profile/avatar — remove profile picture
 */
import type { Express, Request, Response } from "express";
import { db } from "./db";
import { users } from "./db/schema";
import { eq, and, ne } from "drizzle-orm";
import { authenticateToken } from "./auth";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_BIO_LENGTH = 280;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateUsername(username: string): { valid: boolean; message: string } {
  if (username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters." };
  }
  if (username.length > 30) {
    return { valid: false, message: "Username must be 30 characters or less." };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, underscores, dots, and hyphens." };
  }
  if (/^[_.-]/.test(username) || /[_.-]$/.test(username)) {
    return { valid: false, message: "Username cannot start or end with special characters." };
  }
  return { valid: true, message: "" };
}

export function registerProfileRoutes(app: Express): void {
  /**
   * PUT /api/profile — Update profile fields
   */
  app.put("/api/profile", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { displayName, bio, username } = req.body;

      const updates: Record<string, any> = { updatedAt: new Date() };

      // Display name
      if (displayName !== undefined) {
        if (displayName && displayName.length > 50) {
          return res.status(400).json({ error: "Display name must be 50 characters or less." });
        }
        updates.displayName = displayName || null;
      }

      // Bio
      if (bio !== undefined) {
        if (bio && bio.length > MAX_BIO_LENGTH) {
          return res.status(400).json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or less.` });
        }
        updates.bio = bio || null;
      }

      // Username change
      if (username !== undefined && username !== user.username) {
        const check = validateUsername(username);
        if (!check.valid) {
          return res.status(400).json({ error: check.message });
        }

        // Check availability
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(
            eq(users.username, username.toLowerCase()),
            ne(users.id, user.id)
          ));

        if (existing) {
          return res.status(409).json({ error: "This username is already taken." });
        }

        updates.username = username.toLowerCase();
      }

      // Apply updates
      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, user.id))
        .returning();

      res.json({
        user: {
          id: updated.id.toString(),
          email: updated.email,
          username: updated.username,
          firstName: updated.firstName,
          displayName: updated.displayName || updated.firstName || updated.username,
          avatarUrl: updated.avatarUrl,
          bio: updated.bio,
          emailVerified: updated.emailVerified,
          phoneVerified: updated.phoneVerified,
          twoFactorEnabled: updated.twoFactorEnabled,
        },
      });
    } catch (error: any) {
      console.error("Profile update error:", error?.message);
      res.status(500).json({ error: "Failed to update profile." });
    }
  });

  /**
   * POST /api/profile/avatar — Upload profile picture
   * 
   * Accepts JSON body: { image: "data:image/png;base64,..." }
   * Max 2MB. Stores as base64 data URI in DB.
   */
  app.post("/api/profile/avatar", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image data is required." });
      }

      // Validate data URI format
      const dataUriMatch = image.match(/^data:(image\/[a-z+]+);base64,/);
      if (!dataUriMatch) {
        return res.status(400).json({ error: "Invalid image format. Must be a base64 data URI." });
      }

      // Validate MIME type
      const mimeType = dataUriMatch[1];
      if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        return res.status(400).json({ error: `Unsupported image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` });
      }

      // Validate size (base64 is ~33% larger than binary)
      const base64Data = image.split(",")[1];
      const sizeBytes = Buffer.from(base64Data, "base64").length;
      if (sizeBytes > MAX_AVATAR_SIZE) {
        return res.status(400).json({ error: `Image too large. Maximum size is ${MAX_AVATAR_SIZE / 1024 / 1024}MB.` });
      }

      // Store avatar
      const [updated] = await db
        .update(users)
        .set({ avatarUrl: image, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();

      res.json({
        avatarUrl: updated.avatarUrl,
        message: "Profile picture updated.",
      });
    } catch (error: any) {
      console.error("Avatar upload error:", error?.message);
      res.status(500).json({ error: "Failed to upload profile picture." });
    }
  });

  /**
   * DELETE /api/profile/avatar — Remove profile picture
   */
  app.delete("/api/profile/avatar", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      await db
        .update(users)
        .set({ avatarUrl: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      res.json({ message: "Profile picture removed." });
    } catch (error: any) {
      console.error("Avatar delete error:", error?.message);
      res.status(500).json({ error: "Failed to remove profile picture." });
    }
  });

  /**
   * GET /api/profile/username-available?username=xxx
   * Check if a username is available
   */
  app.get("/api/profile/username-available", async (req: Request, res: Response) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ error: "Username is required." });
      }

      const check = validateUsername(username);
      if (!check.valid) {
        return res.json({ available: false, reason: check.message });
      }

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username.toLowerCase()));

      res.json({ available: !existing, username: username.toLowerCase() });
    } catch (error: any) {
      console.error("Username check error:", error?.message);
      res.status(500).json({ error: "Failed to check username." });
    }
  });

  /**
   * GET /api/user/ecosystem-identity
   * 
   * Returns the full identity blob for the EcosystemAccountHub V3 widget.
   * Called by all ecosystem apps to hydrate the user panel with live data.
   * CORS-open to all *.tlid.io and ecosystem domains.
   */
  app.get("/api/user/ecosystem-identity", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Set CORS for ecosystem-wide access
      const origin = req.headers.origin || "";
      const allowed = [
        "https://dwtl.io", "https://lume-lang.org", "https://lume-lang.com",
        "https://dwsc.io", "https://darkwavestudios.io", "https://signalcast.tlid.io",
        "https://trustgen.tlid.io", "https://chronicles.tlid.io", "https://trusthub.tlid.io",
        "https://tlid.io", "https://darkwavepulse.io",
      ];
      if (allowed.includes(origin) || origin.endsWith(".tlid.io")) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }

      // Fetch affiliate stats
      let affiliateStats = { totalReferrals: 0, convertedReferrals: 0, totalEarnings: 0 };
      let affiliateTier = { name: "Base", commissionRate: 10 };
      try {
        const { affiliateReferrals, affiliateCommissions } = await import("./db/schema");
        const referrals = await db
          .select()
          .from(affiliateReferrals)
          .where(eq(affiliateReferrals.referrerId, user.id));
        const commissions = await db
          .select()
          .from(affiliateCommissions)
          .where(eq(affiliateCommissions.referrerId, user.id));

        const converted = referrals.filter((r: any) => r.status === "converted").length;
        const totalEarned = commissions.reduce((s: number, c: any) => s + parseFloat(c.amount || "0"), 0);

        affiliateStats = {
          totalReferrals: referrals.length,
          convertedReferrals: converted,
          totalEarnings: totalEarned,
        };

        const TIERS = [
          { name: "Base", minReferrals: 0, commissionRate: 10 },
          { name: "Silver", minReferrals: 5, commissionRate: 12.5 },
          { name: "Gold", minReferrals: 15, commissionRate: 15 },
          { name: "Platinum", minReferrals: 30, commissionRate: 17.5 },
          { name: "Diamond", minReferrals: 50, commissionRate: 20 },
        ];
        let tier = TIERS[0];
        for (const t of TIERS) { if (converted >= t.minReferrals) tier = t; }
        affiliateTier = { name: tier.name, commissionRate: tier.commissionRate };
      } catch {}

      // Determine member tier from role
      const memberTier = user.role === "admin" ? "founder"
        : user.role === "premium" ? "premium"
        : user.role === "founder" ? "founder"
        : user.emailVerified ? "standard"
        : "free";

      const tlid = `${user.username}.tlid`;
      const referralLink = `https://trusthub.tlid.io/ref/${user.uniqueHash}`;

      res.json({
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        displayName: user.displayName || user.firstName || user.username,
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || null,
        uniqueHash: user.uniqueHash,
        tlid,
        referralCode: user.uniqueHash,
        referralLink,
        affiliateTier,
        affiliateStats,
        memberTier,
        presaleBalance: 0, // Future: query presale contract
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        role: user.role || "user",
        profileUrl: `https://trusthub.tlid.io/profile-editor`,
        trustHubUrl: "https://trusthub.tlid.io",
      });
    } catch (error: any) {
      console.error("Ecosystem identity error:", error?.message);
      res.status(500).json({ error: "Failed to load ecosystem identity." });
    }
  });
}
