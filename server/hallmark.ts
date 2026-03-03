import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { db } from "./db";
import { hallmarks, trustStamps, trusthubCounter } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { authenticateToken } from "./auth";

function generateSHA256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function simulateBlockchain(): { txHash: string; blockHeight: string } {
  const txHash = "0x" + crypto.randomBytes(32).toString("hex");
  const blockHeight = Math.floor(1000000 + Math.random() * 9000000).toString();
  return { txHash, blockHeight };
}

async function getNextSequence(): Promise<number> {
  const result = await db.execute(
    sql`INSERT INTO trusthub_counter (id, current_sequence)
        VALUES ('th-master', '1')
        ON CONFLICT (id)
        DO UPDATE SET current_sequence = (CAST(trusthub_counter.current_sequence AS INTEGER) + 1)::TEXT
        RETURNING current_sequence`
  );
  return parseInt((result as any).rows?.[0]?.current_sequence ?? (result as any)[0]?.current_sequence ?? "1", 10);
}

function formatThId(sequence: number): string {
  return "TH-" + sequence.toString().padStart(8, "0");
}

interface HallmarkParams {
  userId?: number;
  appId?: string;
  appName?: string;
  productName?: string;
  releaseType?: string;
  metadata?: Record<string, any>;
}

export async function generateTrustHubHallmark(params: HallmarkParams) {
  const sequence = await getNextSequence();
  const thId = formatThId(sequence);

  const payload = JSON.stringify({
    thId,
    ...params,
    timestamp: new Date().toISOString(),
  });

  const dataHash = generateSHA256(payload);
  const { txHash, blockHeight } = simulateBlockchain();

  const verificationUrl = `/api/hallmark/verify/${thId}`;

  const [hallmark] = await db
    .insert(hallmarks)
    .values({
      thId,
      userId: params.userId ?? null,
      appId: params.appId ?? null,
      appName: params.appName ?? null,
      productName: params.productName ?? null,
      releaseType: params.releaseType ?? null,
      metadata: params.metadata ?? null,
      dataHash,
      txHash,
      blockHeight,
      verificationUrl,
      hallmarkId: sequence,
    })
    .returning();

  return hallmark;
}

interface TrustStampParams {
  userId?: number;
  category: string;
  data: Record<string, any>;
}

export async function createTrustStamp(params: TrustStampParams) {
  const payload = JSON.stringify({
    category: params.category,
    data: params.data,
    timestamp: new Date().toISOString(),
  });

  const dataHash = generateSHA256(payload);
  const { txHash, blockHeight } = simulateBlockchain();

  const [stamp] = await db
    .insert(trustStamps)
    .values({
      userId: params.userId ?? null,
      category: params.category,
      data: params.data,
      dataHash,
      txHash,
      blockHeight,
    })
    .returning();

  return stamp;
}

export function registerHallmarkRoutes(app: Express): void {
  app.post("/api/hallmark/generate", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { appId, appName, productName, releaseType, metadata } = req.body;

      const hallmark = await generateTrustHubHallmark({
        userId: user.id,
        appId,
        appName,
        productName,
        releaseType,
        metadata,
      });

      res.status(201).json({ hallmark });
    } catch (error: any) {
      console.error("Hallmark generation error:", error?.message);
      res.status(500).json({ error: "Failed to generate hallmark." });
    }
  });

  app.get("/api/hallmark/verify/:hallmarkId", async (req: Request, res: Response) => {
    try {
      const hallmarkId = req.params.hallmarkId as string;

      const [hallmark] = await db
        .select()
        .from(hallmarks)
        .where(eq(hallmarks.thId, hallmarkId));

      if (!hallmark) {
        return res.status(404).json({ error: "Hallmark not found.", verified: false });
      }

      res.json({
        verified: true,
        hallmark: {
          thId: hallmark.thId,
          appName: hallmark.appName,
          productName: hallmark.productName,
          releaseType: hallmark.releaseType,
          dataHash: hallmark.dataHash,
          txHash: hallmark.txHash,
          blockHeight: hallmark.blockHeight,
          createdAt: hallmark.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Hallmark verification error:", error?.message);
      res.status(500).json({ error: "Verification failed." });
    }
  });

  app.post("/api/trust-stamp", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { category, data } = req.body;

      if (!category) {
        return res.status(400).json({ error: "Category is required." });
      }

      const stamp = await createTrustStamp({
        userId: user.id,
        category,
        data: data || {},
      });

      res.status(201).json({ stamp });
    } catch (error: any) {
      console.error("Trust stamp creation error:", error?.message);
      res.status(500).json({ error: "Failed to create trust stamp." });
    }
  });

  app.get("/api/trust-stamps/:userId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const userIdParam = req.params.userId as string;
      const userIdNum = parseInt(userIdParam, 10);

      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: "Invalid user ID." });
      }

      if (userIdNum !== user.id) {
        return res.status(403).json({ error: "You can only view your own trust stamps." });
      }

      const stamps = await db
        .select()
        .from(trustStamps)
        .where(eq(trustStamps.userId, userIdNum));

      res.json({ stamps });
    } catch (error: any) {
      console.error("Trust stamps fetch error:", error?.message);
      res.status(500).json({ error: "Failed to fetch trust stamps." });
    }
  });
}
