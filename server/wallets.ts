import type { Express, Request, Response } from "express";
import { db } from "./db";
import { externalWallets } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateToken } from "./auth";

const DEMO_BALANCES: Record<string, { native: string; usd: string; tokens: Array<{ symbol: string; balance: string; usd: string }> }> = {
  ethereum: {
    native: "2.4531",
    usd: "8,921.47",
    tokens: [
      { symbol: "USDC", balance: "1,250.00", usd: "1,250.00" },
      { symbol: "LINK", balance: "45.2", usd: "678.00" },
    ],
  },
  solana: {
    native: "127.85",
    usd: "18,412.60",
    tokens: [
      { symbol: "USDC", balance: "3,500.00", usd: "3,500.00" },
      { symbol: "RAY", balance: "200.0", usd: "340.00" },
    ],
  },
  polygon: {
    native: "5,230.12",
    usd: "3,138.07",
    tokens: [
      { symbol: "USDC", balance: "800.00", usd: "800.00" },
    ],
  },
  bitcoin: {
    native: "0.0842",
    usd: "5,473.00",
    tokens: [],
  },
};

function getDemoBalance(chain: string) {
  return DEMO_BALANCES[chain.toLowerCase()] || {
    native: "0.00",
    usd: "0.00",
    tokens: [],
  };
}

export function registerWalletRoutes(app: Express): void {
  app.post("/api/wallets/connect", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { address, chain, walletType, label } = req.body;

      if (!address || !chain || !walletType) {
        return res.status(400).json({ error: "address, chain, and walletType are required" });
      }

      if (!["walletconnect", "phantom"].includes(walletType)) {
        return res.status(400).json({ error: "walletType must be 'walletconnect' or 'phantom'" });
      }

      const existing = await db
        .select()
        .from(externalWallets)
        .where(and(eq(externalWallets.userId, user.id), eq(externalWallets.address, address), eq(externalWallets.chain, chain)));

      if (existing.length > 0) {
        return res.status(409).json({ error: "This wallet is already connected" });
      }

      const [wallet] = await db
        .insert(externalWallets)
        .values({
          userId: user.id,
          address,
          chain,
          walletType,
          label: label || null,
          lastSynced: new Date(),
        })
        .returning();

      const balances = getDemoBalance(chain);

      res.status(201).json({ wallet: { ...wallet, balances } });
    } catch (error: any) {
      console.error("Connect wallet error:", error?.message);
      res.status(500).json({ error: "Failed to connect wallet" });
    }
  });

  app.get("/api/wallets", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const wallets = await db
        .select()
        .from(externalWallets)
        .where(eq(externalWallets.userId, user.id));

      const walletsWithBalances = wallets.map((w) => ({
        ...w,
        balances: getDemoBalance(w.chain),
      }));

      res.json({ wallets: walletsWithBalances });
    } catch (error: any) {
      console.error("Get wallets error:", error?.message);
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  });

  app.delete("/api/wallets/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const walletId = parseInt(req.params.id as string);

      if (isNaN(walletId)) {
        return res.status(400).json({ error: "Invalid wallet ID" });
      }

      const [wallet] = await db
        .select()
        .from(externalWallets)
        .where(and(eq(externalWallets.id, walletId), eq(externalWallets.userId, user.id)));

      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      await db
        .delete(externalWallets)
        .where(eq(externalWallets.id, walletId));

      res.json({ success: true });
    } catch (error: any) {
      console.error("Disconnect wallet error:", error?.message);
      res.status(500).json({ error: "Failed to disconnect wallet" });
    }
  });

  app.get("/api/wallets/:id/balances", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const walletId = parseInt(req.params.id as string);

      if (isNaN(walletId)) {
        return res.status(400).json({ error: "Invalid wallet ID" });
      }

      const [wallet] = await db
        .select()
        .from(externalWallets)
        .where(and(eq(externalWallets.id, walletId), eq(externalWallets.userId, user.id)));

      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      const balances = getDemoBalance(wallet.chain);

      res.json({ wallet: { id: wallet.id, address: wallet.address, chain: wallet.chain }, balances });
    } catch (error: any) {
      console.error("Get wallet balances error:", error?.message);
      res.status(500).json({ error: "Failed to fetch wallet balances" });
    }
  });
}
