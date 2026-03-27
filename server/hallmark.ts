import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { db } from "./db";
import { hallmarks, trustStamps, trusthubCounter } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { authenticateToken } from "./auth";

const TRUST_LAYER_API_URL = process.env.TRUST_LAYER_API_URL || "https://dwtl.io";
const TRUST_LAYER_API_KEY = process.env.TRUST_LAYER_API_KEY || "";

if (!TRUST_LAYER_API_KEY) {
  console.warn("[Hallmark] ⚠️  TRUST_LAYER_API_KEY not set — hallmarks will be SIMULATED (not anchored on-chain)");
} else {
  console.log("[Hallmark] ✅ Mode: LIVE — anchoring to Trust Layer chain at", TRUST_LAYER_API_URL);
}

function generateSHA256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function submitToTrustLayer(dataHash: string, appId: string, category: string): Promise<{ txHash: string; blockHeight: string }> {
  if (!TRUST_LAYER_API_KEY) {
    const txHash = "SIMULATED:0x" + crypto.randomBytes(32).toString("hex");
    const blockHeight = "SIMULATED:" + Math.floor(1000000 + Math.random() * 9000000).toString();
    return { txHash, blockHeight };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${TRUST_LAYER_API_URL}/api/hash/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TRUST_LAYER_API_KEY,
      },
      body: JSON.stringify({ dataHash: "0x" + dataHash, category, appId }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      console.error(`[Hallmark] Trust Layer API ${res.status}: ${text}`);
      return {
        txHash: "SIMULATED:0x" + crypto.randomBytes(32).toString("hex"),
        blockHeight: "SIMULATED:API_ERROR",
      };
    }

    const result = await res.json();
    console.log(`[Hallmark] ✅ Anchored on-chain: tx=${(result.txHash || "").slice(0, 18)}... block=${result.blockHeight}`);
    return {
      txHash: result.txHash,
      blockHeight: result.blockHeight?.toString() || "0",
    };
  } catch (err: any) {
    console.error("[Hallmark] Trust Layer API error:", err?.message);
    return {
      txHash: "SIMULATED:0x" + crypto.randomBytes(32).toString("hex"),
      blockHeight: "SIMULATED:UNREACHABLE",
    };
  }
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
  const { txHash, blockHeight } = await submitToTrustLayer(dataHash, params.appId || "trusthub", "hallmark");

  const verificationUrl = `/api/hallmark/${thId}/verify`;

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
  const { txHash, blockHeight } = await submitToTrustLayer(dataHash, "trusthub", params.category);

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

const GENESIS_HALLMARK = {
  appId: "trusthub-genesis",
  appName: "Trust Layer Hub",
  productName: "Genesis Block",
  releaseType: "genesis",
  metadata: {
    ecosystem: "Trust Layer",
    version: "1.0.0",
    domain: "trusthub.tlid.io",
    operator: "DarkWave Studios LLC",
    chain: "Trust Layer Blockchain",
    consensus: "Proof of Trust",
    launchDate: "2026-08-23T00:00:00.000Z",
    totalApps: 32,
    nativeAsset: "SIG",
    utilityToken: "Shells",
  },
};

export async function seedGenesisHallmark(): Promise<void> {
  try {
    const [existing] = await db
      .select()
      .from(hallmarks)
      .where(eq(hallmarks.thId, "TH-00000001"));

    if (existing) {
      console.log("Genesis hallmark TH-00000001 already exists");
      return;
    }

    await db.execute(
      sql`INSERT INTO trusthub_counter (id, current_sequence) VALUES ('th-master', '0') ON CONFLICT (id) DO UPDATE SET current_sequence = '0'`
    );

    const hallmark = await generateTrustHubHallmark(GENESIS_HALLMARK);
    console.log(`Genesis hallmark created: ${hallmark.thId}`);
  } catch (error: any) {
    console.error("Failed to seed genesis hallmark:", error?.message);
  }
}

export function registerHallmarkRoutes(app: Express): void {
  app.get("/api/hallmark/genesis", async (_req: Request, res: Response) => {
    try {
      const [genesis] = await db
        .select()
        .from(hallmarks)
        .where(eq(hallmarks.thId, "TH-00000001"));

      if (!genesis) {
        return res.json({
          thId: "TH-00000001",
          appName: "Trust Layer Hub",
          productName: "Genesis Block",
          releaseType: "genesis",
          dataHash: "pending",
          txHash: "pending",
          blockHeight: "pending",
          verified: false,
          metadata: GENESIS_HALLMARK.metadata,
        });
      }

      res.json({
        verified: true,
        thId: genesis.thId,
        appName: genesis.appName,
        productName: genesis.productName,
        releaseType: genesis.releaseType,
        dataHash: genesis.dataHash,
        txHash: genesis.txHash,
        blockHeight: genesis.blockHeight,
        createdAt: genesis.createdAt,
        metadata: genesis.metadata,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch genesis hallmark" });
    }
  });

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

  app.get("/api/hallmark/:hallmarkId/verify", async (req: Request, res: Response) => {
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

  app.get("/api/hallmarks/timeline", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const timelineRaw = await db.execute(
        sql`(
          SELECT 'hallmark' as type, th_id as identifier, app_name as category,
                 product_name as detail, data_hash, created_at
          FROM hallmarks WHERE user_id = ${user.id}
        ) UNION ALL (
          SELECT 'stamp' as type, category as identifier, category,
                 NULL as detail, data_hash, created_at
          FROM trust_stamps WHERE user_id = ${user.id}
        )
        ORDER BY created_at DESC
        LIMIT 20`
      );

      const rows = (timelineRaw as any).rows || timelineRaw || [];

      const timeline = rows.map((r: any) => ({
        type: r.type,
        identifier: r.identifier,
        category: r.category,
        detail: r.detail,
        dataHash: r.data_hash,
        createdAt: r.created_at,
      }));

      res.json({ timeline });
    } catch (error: any) {
      console.error("Hallmark timeline error:", error?.message);
      res.json({ timeline: [] });
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
