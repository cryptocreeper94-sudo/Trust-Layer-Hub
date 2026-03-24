import type { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Ecosystem sync endpoints — receives member, hallmark, and log data
 * from other Trust Layer apps (Happy Eats, Driver Connect, etc.)
 * 
 * Authentication is via X-API-Key / X-API-Secret headers.
 * In production, these would be verified against an app registry.
 * For now, we accept any request with valid headers and store the data.
 */

function validateEcosystemHeaders(req: Request): { appName: string; appId: string } | null {
  const apiKey = req.headers['x-api-key'] as string;
  const appName = req.headers['x-app-name'] as string || 'Unknown';
  const appId = req.headers['x-app-id'] as string || 'unknown';

  // Accept all requests for now — in production, validate apiKey against registry
  if (!apiKey) return null;
  return { appName, appId };
}

// In-memory store for ecosystem members (will be DB-backed later)
const ecosystemMembers: any[] = [];
const ecosystemHallmarks: any[] = [];
const ecosystemLogs: any[] = [];

export function registerEcosystemRoutes(app: Express): void {

  // Status check — ecosystem apps ping this to verify connectivity
  app.get("/api/ecosystem/status", (req: Request, res: Response) => {
    const auth = validateEcosystemHeaders(req);
    res.json({
      connected: true,
      hubName: "Trust Layer Hub",
      appName: auth?.appName || "Unknown",
      ecosystem: "Trust Layer",
      version: "1.0.0",
    });
  });

  // Sync a member (vendor, worker, user) from an ecosystem app
  app.post("/api/ecosystem/sync/member", async (req: Request, res: Response) => {
    const auth = validateEcosystemHeaders(req);
    if (!auth) {
      return res.status(401).json({ error: "Missing ecosystem API credentials" });
    }

    try {
      const memberData = {
        ...req.body,
        sourceApp: auth.appId,
        syncedAt: new Date().toISOString(),
      };

      ecosystemMembers.push(memberData);

      console.log(`[Ecosystem] Member synced from ${auth.appName}: ${memberData.trustLayerId || memberData.name} (${memberData.memberType || 'member'})`);

      res.json({
        synced: true,
        trustLayerId: memberData.trustLayerId,
        sourceApp: auth.appId,
      });
    } catch (error: any) {
      console.error("[Ecosystem] Member sync error:", error?.message);
      res.status(500).json({ error: "Member sync failed" });
    }
  });

  // Sync a hallmark from an ecosystem app to the global timeline
  app.post("/api/ecosystem/sync/hallmark", async (req: Request, res: Response) => {
    const auth = validateEcosystemHeaders(req);
    if (!auth) {
      return res.status(401).json({ error: "Missing ecosystem API credentials" });
    }

    try {
      const hallmarkData = {
        ...req.body,
        syncedFrom: auth.appId,
        syncedAt: new Date().toISOString(),
      };

      ecosystemHallmarks.push(hallmarkData);

      console.log(`[Ecosystem] Hallmark synced from ${auth.appName}: ${hallmarkData.thId}`);

      res.json({
        synced: true,
        thId: hallmarkData.thId,
        sourceApp: auth.appId,
      });
    } catch (error: any) {
      console.error("[Ecosystem] Hallmark sync error:", error?.message);
      res.status(500).json({ error: "Hallmark sync failed" });
    }
  });

  // Sync a worker from an ecosystem app
  app.post("/api/ecosystem/sync/worker", async (req: Request, res: Response) => {
    const auth = validateEcosystemHeaders(req);
    if (!auth) {
      return res.status(401).json({ error: "Missing ecosystem API credentials" });
    }

    try {
      const workerData = {
        ...req.body,
        sourceApp: auth.appId,
        syncedAt: new Date().toISOString(),
      };

      ecosystemMembers.push({ ...workerData, memberType: 'worker' });

      console.log(`[Ecosystem] Worker synced from ${auth.appName}: ${workerData.name}`);

      res.json({ synced: true, sourceApp: auth.appId });
    } catch (error: any) {
      console.error("[Ecosystem] Worker sync error:", error?.message);
      res.status(500).json({ error: "Worker sync failed" });
    }
  });

  // Log activity from an ecosystem app
  app.post("/api/ecosystem/logs", async (req: Request, res: Response) => {
    const auth = validateEcosystemHeaders(req);
    if (!auth) {
      return res.status(401).json({ error: "Missing ecosystem API credentials" });
    }

    try {
      const logEntry = {
        ...req.body,
        sourceApp: auth.appId,
        receivedAt: new Date().toISOString(),
      };

      ecosystemLogs.push(logEntry);

      console.log(`[Ecosystem] Activity from ${auth.appName}: ${logEntry.action}`);

      res.json({ logged: true });
    } catch (error: any) {
      console.error("[Ecosystem] Log error:", error?.message);
      res.status(500).json({ error: "Logging failed" });
    }
  });

  // List ecosystem apps (returns the registry of known apps)
  app.get("/api/ecosystem/apps", (_req: Request, res: Response) => {
    res.json({
      apps: [
        { id: "happyeats", name: "Happy Eats", prefix: "HE", domain: "happyeats.app", status: "active" },
        { id: "driverconnect", name: "TL Driver Connect", prefix: "DC", domain: "tldriverconnect.com", status: "active" },
        { id: "trusthub", name: "Trust Hub", prefix: "TH", domain: "trusthub.tlid.io", status: "active" },
        { id: "lotopspro", name: "Lot Ops Pro", prefix: "LP", domain: "lotopspro.io", status: "active" },
        { id: "paintpros", name: "PaintPros", prefix: "PP", domain: "paintpros.io", status: "active" },
        { id: "arbora", name: "Arbora", prefix: "AR", domain: "arbora.tlid.io", status: "active" },
        { id: "bomber3d", name: "Bomber 3D", prefix: "B3", domain: "bomber.tlid.io", status: "active" },
        { id: "trustvault", name: "TrustVault", prefix: "TV", domain: "trustvault.tlid.io", status: "active" },
        { id: "signalchat", name: "Signal Chat", prefix: "SC", domain: "signalchat.tlid.io", status: "active" },
        { id: "trustgen3d", name: "TrustGen 3D", prefix: "TG", domain: "trustgen.tlid.io", status: "active" },
        { id: "garagebot", name: "GarageBot", prefix: "GB", domain: "garagebot.io", status: "active" },
        { id: "lume", name: "Lume", prefix: "LM", domain: "lume-lang.org", status: "active" },
        { id: "verdara", name: "Verdara", prefix: "VD", domain: "verdara.tlid.io", status: "active" },
        { id: "tradeworks", name: "TradeWorks AI", prefix: "TW", domain: "tradeworksai.io", status: "active" },
        { id: "strikeagent", name: "StrikeAgent", prefix: "SA", domain: "strikeagent.io", status: "active" },
        { id: "chronicles", name: "Chronicles", prefix: "CH", domain: "yourlegacy.io", status: "active" },
        { id: "trustgolf", name: "Trust Golf", prefix: "TF", domain: "trustgolf.app", status: "active" },
        { id: "orbit", name: "ORBIT Staffing", prefix: "OR", domain: "orbitstaffing.io", status: "active" },
        { id: "brewandboard", name: "Brew & Board", prefix: "BB", domain: "brewandboard.coffee", status: "active" },
        { id: "thevoid", name: "THE VOID", prefix: "VE", domain: "intothevoid.app", status: "active" },
        { id: "signalcast", name: "SignalCast", prefix: "SI", domain: "signalcast.ad", status: "active" },
      ],
    });
  });

  // Get synced members (for dashboard display)
  app.get("/api/ecosystem/members", (_req: Request, res: Response) => {
    res.json({ members: ecosystemMembers, total: ecosystemMembers.length });
  });

  // Get synced hallmarks from ecosystem apps
  app.get("/api/ecosystem/hallmarks", (_req: Request, res: Response) => {
    res.json({ hallmarks: ecosystemHallmarks, total: ecosystemHallmarks.length });
  });
}
