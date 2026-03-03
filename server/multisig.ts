import type { Express, Request, Response } from "express";
import { db } from "./db";
import { multisigVaults, multisigTransactions } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateToken } from "./auth";

export function registerMultisigRoutes(app: Express): void {
  app.get("/api/multisig/vault", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const vaults = await db
        .select()
        .from(multisigVaults)
        .where(eq(multisigVaults.userId, user.id));

      if (vaults.length === 0) {
        return res.status(404).json({ error: "No vault found", vault: null });
      }

      const vault = vaults[0];
      res.json({ vault });
    } catch (error: any) {
      console.error("Get vault error:", error?.message);
      res.status(500).json({ error: "Failed to fetch vault" });
    }
  });

  app.get("/api/multisig/pending", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const vaults = await db
        .select()
        .from(multisigVaults)
        .where(eq(multisigVaults.userId, user.id));

      if (vaults.length === 0) {
        return res.json({ transactions: [] });
      }

      const vaultIds = vaults.map((v) => v.id);
      const allPending: any[] = [];

      for (const vaultId of vaultIds) {
        const txs = await db
          .select()
          .from(multisigTransactions)
          .where(and(eq(multisigTransactions.vaultId, vaultId), eq(multisigTransactions.status, "pending")));
        allPending.push(...txs);
      }

      res.json({ transactions: allPending });
    } catch (error: any) {
      console.error("Get pending transactions error:", error?.message);
      res.status(500).json({ error: "Failed to fetch pending transactions" });
    }
  });

  app.post("/api/multisig/approve/:txId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const txId = parseInt(req.params.txId as string);

      if (isNaN(txId)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }

      const [tx] = await db
        .select()
        .from(multisigTransactions)
        .where(eq(multisigTransactions.id, txId));

      if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (tx.status !== "pending") {
        return res.status(400).json({ error: "Transaction is not pending" });
      }

      const [vault] = await db
        .select()
        .from(multisigVaults)
        .where(eq(multisigVaults.id, tx.vaultId));

      if (!vault) {
        return res.status(404).json({ error: "Vault not found" });
      }

      const coSigners = (vault.coSigners as any[]) || [];
      const isParticipant = vault.userId === user.id || coSigners.some((s: any) => s.userId === user.id || s.email === user.email);

      if (!isParticipant) {
        return res.status(403).json({ error: "You are not a participant of this vault" });
      }

      const signatures = ((tx.signatures as any[]) || []);
      const alreadySigned = signatures.some((s: any) => s.userId === user.id);

      if (alreadySigned) {
        return res.status(400).json({ error: "You have already signed this transaction" });
      }

      const updatedSignatures = [...signatures, { userId: user.id, action: "approve", timestamp: new Date().toISOString() }];
      const approvalCount = updatedSignatures.filter((s: any) => s.action === "approve").length;
      const newStatus = approvalCount >= vault.threshold ? "approved" : "pending";

      await db
        .update(multisigTransactions)
        .set({ signatures: updatedSignatures, status: newStatus })
        .where(eq(multisigTransactions.id, txId));

      const [updated] = await db
        .select()
        .from(multisigTransactions)
        .where(eq(multisigTransactions.id, txId));

      res.json({ transaction: updated });
    } catch (error: any) {
      console.error("Approve transaction error:", error?.message);
      res.status(500).json({ error: "Failed to approve transaction" });
    }
  });

  app.post("/api/multisig/reject/:txId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const txId = parseInt(req.params.txId as string);

      if (isNaN(txId)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }

      const [tx] = await db
        .select()
        .from(multisigTransactions)
        .where(eq(multisigTransactions.id, txId));

      if (!tx) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (tx.status !== "pending") {
        return res.status(400).json({ error: "Transaction is not pending" });
      }

      const [vault] = await db
        .select()
        .from(multisigVaults)
        .where(eq(multisigVaults.id, tx.vaultId));

      if (!vault) {
        return res.status(404).json({ error: "Vault not found" });
      }

      const coSigners = (vault.coSigners as any[]) || [];
      const isParticipant = vault.userId === user.id || coSigners.some((s: any) => s.userId === user.id || s.email === user.email);

      if (!isParticipant) {
        return res.status(403).json({ error: "You are not a participant of this vault" });
      }

      const signatures = ((tx.signatures as any[]) || []);
      const updatedSignatures = [...signatures, { userId: user.id, action: "reject", timestamp: new Date().toISOString() }];

      await db
        .update(multisigTransactions)
        .set({ signatures: updatedSignatures, status: "rejected" })
        .where(eq(multisigTransactions.id, txId));

      const [updated] = await db
        .select()
        .from(multisigTransactions)
        .where(eq(multisigTransactions.id, txId));

      res.json({ transaction: updated });
    } catch (error: any) {
      console.error("Reject transaction error:", error?.message);
      res.status(500).json({ error: "Failed to reject transaction" });
    }
  });

  app.get("/api/multisig/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const vaults = await db
        .select()
        .from(multisigVaults)
        .where(eq(multisigVaults.userId, user.id));

      if (vaults.length === 0) {
        return res.json({ transactions: [] });
      }

      const allCompleted: any[] = [];

      for (const vault of vaults) {
        const txs = await db
          .select()
          .from(multisigTransactions)
          .where(eq(multisigTransactions.vaultId, vault.id));

        const completed = txs.filter((t) => t.status === "approved" || t.status === "rejected");
        allCompleted.push(...completed);
      }

      res.json({ transactions: allCompleted });
    } catch (error: any) {
      console.error("Get history error:", error?.message);
      res.status(500).json({ error: "Failed to fetch transaction history" });
    }
  });
}
