import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db";
import { users, verificationCodes, sessions } from "./db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendVerificationEmail, sendPasswordResetEmail } from "./services/resend";
import { sendSMS2FACode, isTwilioConfigured } from "./services/twilio";
import { generateTrustHubHallmark, createTrustStamp } from "./hallmark";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character." };
  }
  return { valid: true, message: "" };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7);
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

    if (!session) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as any).user = user;
    (req as any).sessionToken = token;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Authentication failed" });
  }
}

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, username, password, firstName, phone } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ error: "Email, username, and password are required." });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }

      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.message });
      }

      if (username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters." });
      }

      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (existingEmail) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const [existingUsername] = await db
        .select()
        .from(users)
        .where(eq(users.username, username.toLowerCase()));

      if (existingUsername) {
        return res.status(409).json({ error: "This username is already taken." });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          firstName: firstName || null,
          passwordHash,
          phone: phone || null,
          emailVerified: false,
          phoneVerified: false,
          twoFactorEnabled: false,
        })
        .returning();

      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.insert(verificationCodes).values({
        userId: newUser.id,
        code,
        type: "email_verify",
        expiresAt,
      });

      await sendVerificationEmail(email, code, firstName);

      const token = generateToken();
      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.insert(sessions).values({
        userId: newUser.id,
        token,
        expiresAt: sessionExpiresAt,
      });

      generateTrustHubHallmark({
        userId: newUser.id,
        appId: "trusthub",
        appName: "Trust Hub",
        productName: "User Registration",
        releaseType: "verification",
        metadata: {
          userId: newUser.id,
          emailHash: crypto.createHash("sha256").update(newUser.email).digest("hex"),
          username: newUser.username,
          registeredAt: new Date().toISOString(),
        },
      }).catch((err) => console.error("Hallmark error:", err?.message));

      res.status(201).json({
        user: {
          id: newUser.id.toString(),
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.firstName,
          displayName: newUser.firstName || newUser.username,
          emailVerified: newUser.emailVerified,
          phoneVerified: newUser.phoneVerified,
          twoFactorEnabled: newUser.twoFactorEnabled,
        },
        sessionToken: token,
        requiresEmailVerification: true,
      });
    } catch (error: any) {
      console.error("Registration error:", error?.message);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      if (!user.emailVerified) {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await db.insert(verificationCodes).values({
          userId: user.id,
          code,
          type: "email_verify",
          expiresAt,
        });

        await sendVerificationEmail(user.email, code, user.firstName || undefined);

        const tempToken = generateToken();
        const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await db.insert(sessions).values({
          userId: user.id,
          token: tempToken,
          expiresAt: sessionExpiresAt,
        });

        return res.json({
          user: {
            id: user.id.toString(),
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            displayName: user.firstName || user.username,
            emailVerified: false,
          },
          sessionToken: tempToken,
          requiresEmailVerification: true,
        });
      }

      if (user.twoFactorEnabled && user.phone && isTwilioConfigured()) {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.insert(verificationCodes).values({
          userId: user.id,
          code,
          type: "sms_2fa",
          expiresAt,
        });

        await sendSMS2FACode(user.phone, code);

        const tempToken = generateToken();
        const sessionExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.insert(sessions).values({
          userId: user.id,
          token: tempToken,
          expiresAt: sessionExpiresAt,
        });

        return res.json({
          user: {
            id: user.id.toString(),
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            displayName: user.firstName || user.username,
          },
          sessionToken: tempToken,
          requires2FA: true,
          phoneHint: user.phone.slice(0, 4) + "****" + user.phone.slice(-2),
        });
      }

      const token = generateToken();
      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: sessionExpiresAt,
      });

      createTrustStamp({
        userId: user.id,
        category: "trusthub-login",
        data: {
          userId: user.id,
          emailHash: crypto.createHash("sha256").update(user.email).digest("hex"),
          timestamp: new Date().toISOString(),
        },
      }).catch((err) => console.error("Trust stamp error:", err?.message));

      res.json({
        user: {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          displayName: user.firstName || user.username,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        sessionToken: token,
      });
    } catch (error: any) {
      console.error("Login error:", error?.message);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const token = authHeader.slice(7);
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Verification code is required." });
      }

      const MAX_ATTEMPTS = 5;

      const [latestCode] = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, session.userId),
            eq(verificationCodes.type, "email_verify"),
            eq(verificationCodes.used, false),
            gt(verificationCodes.expiresAt, new Date())
          )
        );

      if (!latestCode) {
        return res.status(400).json({ error: "No active verification code. Please request a new one." });
      }

      if (latestCode.attempts >= MAX_ATTEMPTS) {
        return res.status(429).json({ error: "Too many attempts. Please request a new code." });
      }

      await db
        .update(verificationCodes)
        .set({ attempts: latestCode.attempts + 1 })
        .where(eq(verificationCodes.id, latestCode.id));

      if (latestCode.code !== code) {
        return res.status(400).json({ error: "Invalid verification code.", attemptsRemaining: MAX_ATTEMPTS - latestCode.attempts - 1 });
      }

      await db
        .update(verificationCodes)
        .set({ used: true })
        .where(eq(verificationCodes.id, latestCode.id));

      await db
        .update(users)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, session.userId));

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      res.json({
        success: true,
        user: {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          displayName: user.firstName || user.username,
          emailVerified: true,
          phoneVerified: user.phoneVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      });
    } catch (error: any) {
      console.error("Email verification error:", error?.message);
      res.status(500).json({ error: "Verification failed." });
    }
  });

  app.post("/api/auth/phone/verify", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const tempToken = authHeader.slice(7);
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.token, tempToken), gt(sessions.expiresAt, new Date())));

      if (!session) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "2FA code is required." });
      }

      const MAX_ATTEMPTS = 5;

      const [latestCode] = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, session.userId),
            eq(verificationCodes.type, "sms_2fa"),
            eq(verificationCodes.used, false),
            gt(verificationCodes.expiresAt, new Date())
          )
        );

      if (!latestCode) {
        return res.status(400).json({ error: "No active 2FA code. Please request a new one." });
      }

      if (latestCode.attempts >= MAX_ATTEMPTS) {
        return res.status(429).json({ error: "Too many attempts. Please request a new code." });
      }

      await db
        .update(verificationCodes)
        .set({ attempts: latestCode.attempts + 1 })
        .where(eq(verificationCodes.id, latestCode.id));

      if (latestCode.code !== code) {
        return res.status(400).json({ error: "Invalid 2FA code.", attemptsRemaining: MAX_ATTEMPTS - latestCode.attempts - 1 });
      }

      await db
        .update(verificationCodes)
        .set({ used: true })
        .where(eq(verificationCodes.id, latestCode.id));

      await db.delete(sessions).where(eq(sessions.token, tempToken));

      const newToken = generateToken();
      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.insert(sessions).values({
        userId: session.userId,
        token: newToken,
        expiresAt: sessionExpiresAt,
      });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      res.json({
        user: {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          displayName: user.firstName || user.username,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        sessionToken: newToken,
      });
    } catch (error: any) {
      console.error("2FA verification error:", error?.message);
      res.status(500).json({ error: "2FA verification failed." });
    }
  });

  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const token = authHeader.slice(7);
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

      if (!session) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { type } = req.body;
      const code = generateCode();

      if (type === "sms_2fa" && user.phone && isTwilioConfigured()) {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await db.insert(verificationCodes).values({
          userId: user.id,
          code,
          type: "sms_2fa",
          expiresAt,
        });
        await sendSMS2FACode(user.phone, code);
        return res.json({ success: true, message: "2FA code sent." });
      } else {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.insert(verificationCodes).values({
          userId: user.id,
          code,
          type: "email_verify",
          expiresAt,
        });
        await sendVerificationEmail(user.email, code, user.firstName || undefined);
        return res.json({ success: true, message: "Verification code sent." });
      }
    } catch (error: any) {
      console.error("Resend code error:", error?.message);
      res.status(500).json({ error: "Failed to resend code." });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        displayName: user.firstName || user.username,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  });

  app.post("/api/auth/exchange-token", async (req: Request, res: Response) => {
    try {
      const { hubSessionToken } = req.body;
      if (!hubSessionToken) {
        return res.status(400).json({ error: "hubSessionToken is required" });
      }

      const [session] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.token, hubSessionToken), gt(sessions.expiresAt, new Date())));

      if (!session) {
        return res.status(401).json({ error: "Invalid or expired session token" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const ecosystemToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(sessions).values({
        userId: user.id,
        token: ecosystemToken,
        expiresAt,
      });

      res.json({
        ecosystemToken,
        expiresIn: 3600,
        userId: user.id.toString(),
        email: user.email,
        displayName: user.firstName || user.username,
      });
    } catch (error: any) {
      console.error("Token exchange error:", error?.message);
      res.status(500).json({ error: "Token exchange failed" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: Request, res: Response) => {
    try {
      const token = (req as any).sessionToken;
      await db.delete(sessions).where(eq(sessions.token, token));
      res.json({ success: true });
    } catch {
      res.json({ success: true });
    }
  });

  app.post("/api/user/phone-settings", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: "Phone number is required." });
      }

      const cleaned = phone.replace(/[^\d+]/g, "");
      if (!cleaned.startsWith("+") || cleaned.length < 10) {
        return res.status(400).json({ error: "Please enter a valid phone number with country code (e.g. +1...)." });
      }

      await db
        .update(users)
        .set({ phone: cleaned, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      createTrustStamp({
        userId: user.id,
        category: "trusthub-profile-update",
        data: {
          userId: user.id,
          fieldsChanged: ["phone"],
          timestamp: new Date().toISOString(),
        },
      }).catch((err) => console.error("Trust stamp error:", err?.message));

      if (isTwilioConfigured()) {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await db.insert(verificationCodes).values({
          userId: user.id,
          code,
          type: "sms_2fa",
          expiresAt,
        });
        await sendSMS2FACode(cleaned, code);

        return res.json({
          success: true,
          requiresVerification: true,
          message: "Verification code sent to your phone.",
        });
      }

      res.json({ success: true, message: "Phone number updated." });
    } catch (error: any) {
      console.error("Update phone error:", error?.message);
      res.status(500).json({ error: "Failed to update phone number." });
    }
  });

  app.post("/api/auth/phone/verify-setup", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Verification code is required." });
      }

      const [verification] = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, user.id),
            eq(verificationCodes.code, code),
            eq(verificationCodes.type, "sms_2fa"),
            eq(verificationCodes.used, false),
            gt(verificationCodes.expiresAt, new Date())
          )
        );

      if (!verification) {
        return res.status(400).json({ error: "Invalid or expired verification code." });
      }

      await db
        .update(verificationCodes)
        .set({ used: true })
        .where(eq(verificationCodes.id, verification.id));

      await db
        .update(users)
        .set({ phoneVerified: true, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      res.json({ success: true, message: "Phone number verified." });
    } catch (error: any) {
      console.error("Verify phone error:", error?.message);
      res.status(500).json({ error: "Phone verification failed." });
    }
  });
}
