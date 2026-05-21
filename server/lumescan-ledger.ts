/**
 * LumeScan — Trust Layer Ledger (TLL) Scan Ledger API
 * ====================================================
 * Records diagnostic scans to Firestore, hashes payloads with SHA-256,
 * and makes them verifiable via public scan ID or hash lookup.
 *
 * This is the first TLL integration — the same pattern will be
 * replicated for CAL (Cox Automotive Ledger) and VET (Verified
 * Enterprise Trust).
 *
 * Firestore Collection: scan_ledger
 *
 * DarkWave Studios LLC — Copyright 2026
 */

import type { Express, Request, Response } from "express";
import crypto from "crypto";
import admin from "./firebase-admin";
import { verifyFirebaseToken } from "./firebase-admin";

const firestore = admin.firestore();
const SCAN_COLLECTION = "scan_ledger";
const COUNTER_DOC = "scan_ledger_meta/counter";

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateScanHash(payload: object): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

async function getNextScanSequence(): Promise<number> {
  const counterRef = firestore.doc(COUNTER_DOC);
  const result = await firestore.runTransaction(async (tx) => {
    const doc = await tx.get(counterRef);
    const current = doc.exists ? (doc.data()?.sequence || 0) : 0;
    const next = current + 1;
    tx.set(counterRef, { sequence: next }, { merge: true });
    return next;
  });
  return result;
}

function formatScanId(sequence: number): string {
  return "TLL-LS-" + sequence.toString().padStart(8, "0");
}

function generateHealthNarrative(
  vehicle: { year?: number; make?: string; model?: string },
  healthScore: number,
  dtcCount: number,
  signalsRead: number,
  dtcCodes: string[]
): string {
  const name = vehicle.year && vehicle.make && vehicle.model
    ? `Your ${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "Your vehicle";

  if (healthScore >= 85 && dtcCount === 0) {
    const extras = [];
    if (signalsRead >= 40) extras.push(`All ${signalsRead} signals nominal.`);
    return `${name} is running healthy. ${extras.join(" ")} No active trouble codes detected. Keep it up.`;
  }

  if (healthScore >= 70 && dtcCount === 0) {
    return `${name} is in good condition with a health score of ${healthScore}. No trouble codes, but some signals suggest minor wear. Routine maintenance recommended.`;
  }

  if (healthScore >= 70 && dtcCount > 0) {
    return `${name} has ${dtcCount} active trouble code${dtcCount > 1 ? "s" : ""}: ${dtcCodes.join(", ")}. Health score ${healthScore}/100. Review the codes below — attention may be needed soon.`;
  }

  if (healthScore >= 50) {
    return `${name} needs attention. Health score ${healthScore}/100 with ${dtcCount} active code${dtcCount > 1 ? "s" : ""}. We recommend addressing ${dtcCodes[0] || "the flagged issues"} before they worsen.`;
  }

  return `${name} requires immediate attention. Health score ${healthScore}/100. ${dtcCount} active trouble code${dtcCount > 1 ? "s" : ""} detected. Please consult a qualified mechanic as soon as possible.`;
}

// ── Firebase Auth Middleware ────────────────────────────────────────────────

async function requireFirebaseAuth(req: Request, res: Response): Promise<admin.auth.DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization required" });
    return null;
  }
  const token = authHeader.slice(7);
  const decoded = await verifyFirebaseToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
  return decoded;
}

// ── Routes ──────────────────────────────────────────────────────────────────

export function registerLumeScanLedgerRoutes(app: Express): void {
  console.log("[TLL] LumeScan Ledger routes registered");

  // ━━━ POST /api/lumescan/record-scan ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Seal a diagnostic scan to the Trust Layer Ledger
  app.post("/api/lumescan/record-scan", async (req: Request, res: Response) => {
    try {
      const user = await requireFirebaseAuth(req, res);
      if (!user) return;

      const {
        vin,
        vehicle,       // { year, make, model }
        healthScore,
        dtcCount = 0,
        dtcCodes = [],
        signalCount = 42,
        signalsRead = 0,
        signals,       // raw signal data for hashing
        mode = "consumer", // "consumer" | "mechanic"
        snapshotType = "scan", // "scan" | "daily"
      } = req.body;

      if (!vin || healthScore === undefined) {
        return res.status(400).json({ error: "vin and healthScore are required" });
      }

      // Generate the scan hash from the raw signal payload
      const hashPayload = {
        vin,
        signals: signals || {},
        healthScore,
        dtcCodes,
        timestamp: new Date().toISOString(),
      };
      const scanHash = generateScanHash(hashPayload);

      // Get next sequence ID
      const sequence = await getNextScanSequence();
      const scanId = formatScanId(sequence);

      // Generate human-readable health narrative
      const healthNarrative = generateHealthNarrative(
        vehicle || {},
        healthScore,
        dtcCount,
        signalsRead,
        dtcCodes
      );

      // Build the ledger record
      const record = {
        scanId,
        userId: user.uid,
        userEmail: user.email || null,
        vin: vin.toUpperCase(),
        vehicle: vehicle || null,
        scanHash,
        healthScore,
        healthNarrative,
        dtcCount,
        dtcCodes,
        signalCount,
        signalsRead,
        mode,
        snapshotType,
        appVersion: req.body.appVersion || "1.0.0",
        verified: true,
        hallmark: {
          version: "TLL-1.0",
          sealedAt: new Date().toISOString(),
          recordId: scanId,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: new Date().toISOString(),
      };

      // Write to Firestore
      await firestore.collection(SCAN_COLLECTION).doc(scanId).set(record);

      console.log(`[TLL] Scan sealed: ${scanId} | VIN: ${vin} | Score: ${healthScore} | Hash: ${scanHash.slice(0, 12)}...`);

      res.status(201).json({
        scanId,
        scanHash,
        healthNarrative,
        hallmark: record.hallmark,
        verified: true,
        explorerUrl: `https://lumescan.tech/explorer.html?id=${scanId}`,
      });
    } catch (error: any) {
      console.error("[TLL] Record scan error:", error?.message);
      res.status(500).json({ error: "Failed to record scan" });
    }
  });

  // ━━━ GET /api/lumescan/scan/:scanId ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Public — verify a single scan by its TLL ID
  app.get("/api/lumescan/scan/:scanId", async (req: Request, res: Response) => {
    try {
      const { scanId } = req.params;
      const doc = await firestore.collection(SCAN_COLLECTION).doc(scanId).get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Scan not found", verified: false });
      }

      const data = doc.data()!;
      res.json({
        verified: true,
        scan: {
          scanId: data.scanId,
          vin: data.vin,
          vehicle: data.vehicle,
          healthScore: data.healthScore,
          healthNarrative: data.healthNarrative,
          dtcCount: data.dtcCount,
          dtcCodes: data.dtcCodes,
          signalCount: data.signalCount,
          signalsRead: data.signalsRead,
          mode: data.mode,
          snapshotType: data.snapshotType,
          scanHash: data.scanHash,
          hallmark: data.hallmark,
          timestamp: data.timestamp,
        },
      });
    } catch (error: any) {
      console.error("[TLL] Scan lookup error:", error?.message);
      res.status(500).json({ error: "Lookup failed" });
    }
  });

  // ━━━ GET /api/lumescan/verify/:hash ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Public — verify a scan by its SHA-256 hash
  app.get("/api/lumescan/verify/:hash", async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      const snapshot = await firestore
        .collection(SCAN_COLLECTION)
        .where("scanHash", "==", hash)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.json({ verified: false, message: "No scan found with this hash" });
      }

      const data = snapshot.docs[0].data();
      res.json({
        verified: true,
        scanId: data.scanId,
        vin: data.vin,
        healthScore: data.healthScore,
        hallmark: data.hallmark,
        timestamp: data.timestamp,
      });
    } catch (error: any) {
      console.error("[TLL] Hash verification error:", error?.message);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // ━━━ GET /api/lumescan/history ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Authenticated — user's full scan history
  app.get("/api/lumescan/history", async (req: Request, res: Response) => {
    try {
      const user = await requireFirebaseAuth(req, res);
      if (!user) return;

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const vinFilter = req.query.vin as string | undefined;

      let query = firestore
        .collection(SCAN_COLLECTION)
        .where("userId", "==", user.uid)
        .orderBy("timestamp", "desc")
        .limit(limit);

      if (vinFilter) {
        query = firestore
          .collection(SCAN_COLLECTION)
          .where("userId", "==", user.uid)
          .where("vin", "==", vinFilter.toUpperCase())
          .orderBy("timestamp", "desc")
          .limit(limit);
      }

      const snapshot = await query.get();
      const scans = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          scanId: d.scanId,
          vin: d.vin,
          vehicle: d.vehicle,
          healthScore: d.healthScore,
          healthNarrative: d.healthNarrative,
          dtcCount: d.dtcCount,
          signalsRead: d.signalsRead,
          mode: d.mode,
          snapshotType: d.snapshotType,
          scanHash: d.scanHash,
          hallmark: d.hallmark,
          timestamp: d.timestamp,
          verified: d.verified,
        };
      });

      res.json({ scans, total: scans.length });
    } catch (error: any) {
      console.error("[TLL] History error:", error?.message);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // ━━━ GET /api/lumescan/stats ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Authenticated — aggregated stats for the user
  app.get("/api/lumescan/stats", async (req: Request, res: Response) => {
    try {
      const user = await requireFirebaseAuth(req, res);
      if (!user) return;

      const snapshot = await firestore
        .collection(SCAN_COLLECTION)
        .where("userId", "==", user.uid)
        .orderBy("timestamp", "desc")
        .get();

      const scans = snapshot.docs.map((d) => d.data());

      if (scans.length === 0) {
        return res.json({
          totalScans: 0,
          averageHealthScore: 0,
          totalDtcsDetected: 0,
          vehicles: [],
          recentTrend: [],
        });
      }

      // Aggregate
      const totalScans = scans.length;
      const averageHealthScore = Math.round(
        scans.reduce((sum, s) => sum + (s.healthScore || 0), 0) / totalScans
      );
      const totalDtcsDetected = scans.reduce((sum, s) => sum + (s.dtcCount || 0), 0);

      // Unique vehicles
      const vehicleMap = new Map<string, any>();
      for (const s of scans) {
        if (s.vin && !vehicleMap.has(s.vin)) {
          vehicleMap.set(s.vin, {
            vin: s.vin,
            vehicle: s.vehicle,
            lastScan: s.timestamp,
            lastHealthScore: s.healthScore,
            scanCount: scans.filter((x) => x.vin === s.vin).length,
          });
        }
      }

      // Recent trend (last 30 scans, newest first)
      const recentTrend = scans.slice(0, 30).map((s) => ({
        date: s.timestamp,
        healthScore: s.healthScore,
        dtcCount: s.dtcCount,
        vin: s.vin,
      }));

      res.json({
        totalScans,
        averageHealthScore,
        totalDtcsDetected,
        vehicles: Array.from(vehicleMap.values()),
        recentTrend,
      });
    } catch (error: any) {
      console.error("[TLL] Stats error:", error?.message);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ━━━ GET /api/lumescan/vehicle/:vin ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Authenticated — all scans for a specific VIN
  app.get("/api/lumescan/vehicle/:vin", async (req: Request, res: Response) => {
    try {
      const user = await requireFirebaseAuth(req, res);
      if (!user) return;

      const vin = req.params.vin.toUpperCase();

      const snapshot = await firestore
        .collection(SCAN_COLLECTION)
        .where("userId", "==", user.uid)
        .where("vin", "==", vin)
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      const scans = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          scanId: d.scanId,
          healthScore: d.healthScore,
          healthNarrative: d.healthNarrative,
          dtcCount: d.dtcCount,
          dtcCodes: d.dtcCodes,
          signalsRead: d.signalsRead,
          mode: d.mode,
          snapshotType: d.snapshotType,
          scanHash: d.scanHash,
          hallmark: d.hallmark,
          timestamp: d.timestamp,
        };
      });

      res.json({ vin, scans, total: scans.length });
    } catch (error: any) {
      console.error("[TLL] Vehicle scans error:", error?.message);
      res.status(500).json({ error: "Failed to fetch vehicle scans" });
    }
  });
}
