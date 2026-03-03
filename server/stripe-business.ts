import type { Express, Request, Response } from "express";
import { db } from "./db";
import { stripeConnections } from "./db/schema";
import { eq } from "drizzle-orm";
import { authenticateToken } from "./auth";
import { createTrustStamp } from "./hallmark";

function getStripeClientForUser(connection: any) {
  if (connection?.accessToken) {
    try {
      const Stripe = require("stripe");
      return new Stripe(connection.accessToken, { apiVersion: "2024-12-18.acacia" });
    } catch {
      return null;
    }
  }
  return null;
}

function getPlatformStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const Stripe = require("stripe");
    return new Stripe(key, { apiVersion: "2024-12-18.acacia" });
  } catch {
    return null;
  }
}

export function registerStripeRoutes(app: Express): void {
  app.get("/api/stripe/status", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const [connection] = await db
        .select()
        .from(stripeConnections)
        .where(eq(stripeConnections.userId, user.id));

      const isAdmin = user.role === "admin" || user.role === "developer";
      const hasPlatformKey = !!process.env.STRIPE_SECRET_KEY;

      res.json({
        configured: isAdmin ? hasPlatformKey : !!connection?.accessToken,
        connected: !!connection?.connected,
        businessName: connection?.businessName || null,
        stripeAccountId: connection?.stripeAccountId || null,
        isAdmin,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check Stripe status" });
    }
  });

  app.get("/api/stripe/dashboard", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const isAdmin = user.role === "admin" || user.role === "developer";

      const [connection] = await db
        .select()
        .from(stripeConnections)
        .where(eq(stripeConnections.userId, user.id));

      const stripe = isAdmin
        ? getPlatformStripeClient()
        : getStripeClientForUser(connection);

      if (!stripe) {
        if (!connection?.connected) {
          return res.json({
            configured: false,
            connected: false,
            message: isAdmin
              ? "Add your STRIPE_SECRET_KEY to environment variables."
              : "Connect your Stripe account to view your business data.",
            balance: { available: 0, pending: 0, currency: "usd" },
            recentPayments: [],
            recentPayouts: [],
            stats: { totalRevenue: 0, totalPayouts: 0, activeSubscriptions: 0, totalCustomers: 0 },
          });
        }
        return res.json({
          configured: false,
          connected: true,
          message: "Your Stripe API key could not be validated. Please reconnect.",
          balance: { available: 0, pending: 0, currency: "usd" },
          recentPayments: [],
          recentPayouts: [],
          stats: { totalRevenue: 0, totalPayouts: 0, activeSubscriptions: 0, totalCustomers: 0 },
        });
      }

      try {
        const balance = await stripe.balance.retrieve();
        const payments = await stripe.paymentIntents.list({ limit: 10 });
        const payouts = await stripe.payouts.list({ limit: 10 });

        const availableBalance = balance.available.reduce((sum: number, b: any) => sum + b.amount, 0) / 100;
        const pendingBalance = balance.pending.reduce((sum: number, b: any) => sum + b.amount, 0) / 100;

        res.json({
          configured: true,
          connected: true,
          businessName: connection?.businessName || null,
          balance: {
            available: availableBalance,
            pending: pendingBalance,
            currency: balance.available[0]?.currency || "usd",
          },
          recentPayments: payments.data.map((p: any) => ({
            id: p.id,
            amount: (p.amount || 0) / 100,
            currency: p.currency,
            status: p.status,
            description: p.description,
            customerEmail: p.receipt_email,
            createdAt: new Date(p.created * 1000).toISOString(),
          })),
          recentPayouts: payouts.data.map((p: any) => ({
            id: p.id,
            amount: (p.amount || 0) / 100,
            currency: p.currency,
            status: p.status,
            arrivalDate: new Date(p.arrival_date * 1000).toISOString(),
            createdAt: new Date(p.created * 1000).toISOString(),
          })),
          stats: {
            totalRevenue: payments.data
              .filter((p: any) => p.status === "succeeded")
              .reduce((sum: number, p: any) => sum + (p.amount || 0) / 100, 0),
            totalPayouts: payouts.data
              .filter((p: any) => p.status === "paid")
              .reduce((sum: number, p: any) => sum + (p.amount || 0) / 100, 0),
            activeSubscriptions: 0,
            totalCustomers: 0,
          },
        });
      } catch (stripeErr: any) {
        console.error("Stripe API error:", stripeErr?.message);
        res.json({
          configured: true,
          connected: !!connection?.connected,
          error: "Unable to fetch Stripe data. Please check your API keys.",
          balance: { available: 0, pending: 0, currency: "usd" },
          recentPayments: [],
          recentPayouts: [],
          stats: { totalRevenue: 0, totalPayouts: 0, activeSubscriptions: 0, totalCustomers: 0 },
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to load Stripe dashboard" });
    }
  });

  app.post("/api/stripe/connect", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { businessName, stripeSecretKey } = req.body;

      if (!stripeSecretKey && !(user.role === "admin" || user.role === "developer")) {
        return res.status(400).json({ error: "Stripe API key is required to connect your account." });
      }

      if (stripeSecretKey) {
        try {
          const Stripe = require("stripe");
          const testClient = new Stripe(stripeSecretKey, { apiVersion: "2024-12-18.acacia" });
          await testClient.balance.retrieve();
        } catch (err: any) {
          return res.status(400).json({ error: "Invalid Stripe API key. Please check and try again." });
        }
      }

      const [existing] = await db
        .select()
        .from(stripeConnections)
        .where(eq(stripeConnections.userId, user.id));

      if (existing) {
        await db
          .update(stripeConnections)
          .set({
            connected: true,
            businessName: businessName || existing.businessName,
            accessToken: stripeSecretKey || existing.accessToken,
            updatedAt: new Date(),
          })
          .where(eq(stripeConnections.userId, user.id));
      } else {
        await db
          .insert(stripeConnections)
          .values({
            userId: user.id,
            connected: true,
            businessName: businessName || null,
            accessToken: stripeSecretKey || null,
          });
      }

      createTrustStamp({
        userId: user.id,
        category: "stripe-connect",
        data: { businessName: businessName || "Unknown", timestamp: new Date().toISOString() },
      }).catch((err) => console.error("Stripe connect stamp error:", err?.message));

      res.json({ connected: true, message: "Stripe account connected successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to connect Stripe" });
    }
  });

  app.delete("/api/stripe/disconnect", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      await db
        .update(stripeConnections)
        .set({ connected: false, accessToken: null, updatedAt: new Date() })
        .where(eq(stripeConnections.userId, user.id));

      createTrustStamp({
        userId: user.id,
        category: "stripe-disconnect",
        data: { timestamp: new Date().toISOString() },
      }).catch((err) => console.error("Stripe disconnect stamp error:", err?.message));

      res.json({ disconnected: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect Stripe" });
    }
  });
}
