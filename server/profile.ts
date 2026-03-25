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
}
