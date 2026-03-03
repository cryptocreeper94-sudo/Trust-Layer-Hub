import type { Express, Request, Response } from "express";
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";
import { db } from "./db";
import { linkedAccounts } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateToken } from "./auth";

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
      "PLAID-SECRET": process.env.PLAID_SECRET || "",
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

function isPlaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export function registerPlaidRoutes(app: Express): void {
  app.post("/api/plaid/create-link-token", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!isPlaidConfigured()) {
        return res.status(503).json({ error: "Plaid integration is not configured." });
      }

      const user = (req as any).user;

      const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: user.id.toString() },
        client_name: "Trust Layer Hub",
        products: [Products.Auth, Products.Transactions],
        country_codes: [CountryCode.Us],
        language: "en",
      });

      res.json({ linkToken: response.data.link_token });
    } catch (error: any) {
      console.error("Plaid link token error:", error?.response?.data || error?.message);
      res.status(500).json({ error: "Failed to create link token." });
    }
  });

  app.post("/api/plaid/exchange-token", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!isPlaidConfigured()) {
        return res.status(503).json({ error: "Plaid integration is not configured." });
      }

      const user = (req as any).user;
      const { publicToken } = req.body;

      if (!publicToken) {
        return res.status(400).json({ error: "publicToken is required." });
      }

      const exchangeResponse = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      const accountsResponse = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      const accounts = accountsResponse.data.accounts;
      const item = accountsResponse.data.item;

      let institutionName = "Unknown Bank";
      let institutionId = item.institution_id || null;

      if (institutionId) {
        try {
          const instResponse = await plaidClient.institutionsGetById({
            institution_id: institutionId,
            country_codes: [CountryCode.Us],
          });
          institutionName = instResponse.data.institution.name;
        } catch {
          institutionName = "Unknown Bank";
        }
      }

      const insertedAccounts = [];
      for (const account of accounts) {
        const [inserted] = await db
          .insert(linkedAccounts)
          .values({
            userId: user.id,
            plaidAccessToken: accessToken,
            plaidItemId: itemId,
            accountId: account.account_id,
            institutionName,
            institutionId,
            accountType: account.type,
            accountSubtype: account.subtype || null,
            accountMask: account.mask || null,
            balance: (account.balances.current ?? 0).toString(),
            currency: account.balances.iso_currency_code || "USD",
            lastSynced: new Date(),
          })
          .returning();
        insertedAccounts.push(inserted);
      }

      res.status(201).json({ accounts: insertedAccounts });
    } catch (error: any) {
      console.error("Plaid exchange token error:", error?.response?.data || error?.message);
      res.status(500).json({ error: "Failed to exchange token." });
    }
  });

  app.get("/api/plaid/accounts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const accounts = await db
        .select()
        .from(linkedAccounts)
        .where(eq(linkedAccounts.userId, user.id));

      if (isPlaidConfigured() && accounts.length > 0) {
        const staleThreshold = 5 * 60 * 1000;
        const now = Date.now();

        const accessTokensToRefresh = new Set<string>();
        for (const account of accounts) {
          const lastSynced = account.lastSynced ? new Date(account.lastSynced).getTime() : 0;
          if (now - lastSynced > staleThreshold) {
            accessTokensToRefresh.add(account.plaidAccessToken);
          }
        }

        for (const accessToken of accessTokensToRefresh) {
          try {
            const balancesResponse = await plaidClient.accountsBalanceGet({
              access_token: accessToken,
            });

            for (const plaidAccount of balancesResponse.data.accounts) {
              await db
                .update(linkedAccounts)
                .set({
                  balance: (plaidAccount.balances.current ?? 0).toString(),
                  lastSynced: new Date(),
                })
                .where(
                  and(
                    eq(linkedAccounts.userId, user.id),
                    eq(linkedAccounts.accountId, plaidAccount.account_id)
                  )
                );
            }
          } catch (err: any) {
            console.error("Plaid balance refresh error:", err?.response?.data || err?.message);
          }
        }

        const refreshedAccounts = await db
          .select()
          .from(linkedAccounts)
          .where(eq(linkedAccounts.userId, user.id));

        return res.json({
          accounts: refreshedAccounts.map((a) => ({
            id: a.id,
            accountId: a.accountId,
            institutionName: a.institutionName,
            institutionId: a.institutionId,
            accountType: a.accountType,
            accountSubtype: a.accountSubtype,
            accountMask: a.accountMask,
            balance: a.balance,
            currency: a.currency,
            lastSynced: a.lastSynced,
          })),
        });
      }

      res.json({
        accounts: accounts.map((a) => ({
          id: a.id,
          accountId: a.accountId,
          institutionName: a.institutionName,
          institutionId: a.institutionId,
          accountType: a.accountType,
          accountSubtype: a.accountSubtype,
          accountMask: a.accountMask,
          balance: a.balance,
          currency: a.currency,
          lastSynced: a.lastSynced,
        })),
      });
    } catch (error: any) {
      console.error("Plaid accounts error:", error?.message);
      res.status(500).json({ error: "Failed to fetch accounts." });
    }
  });

  app.get("/api/plaid/transactions/:accountId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const accountIdParam = parseInt(req.params.accountId as string, 10);

      if (isNaN(accountIdParam)) {
        return res.status(400).json({ error: "Invalid account ID." });
      }

      const [account] = await db
        .select()
        .from(linkedAccounts)
        .where(
          and(
            eq(linkedAccounts.id, accountIdParam),
            eq(linkedAccounts.userId, user.id)
          )
        );

      if (!account) {
        return res.status(404).json({ error: "Account not found." });
      }

      if (!isPlaidConfigured()) {
        return res.json({ transactions: [], totalTransactions: 0 });
      }

      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startDate = thirtyDaysAgo.toISOString().split("T")[0];
        const endDate = now.toISOString().split("T")[0];

        const txResponse = await plaidClient.transactionsGet({
          access_token: account.plaidAccessToken,
          start_date: startDate,
          end_date: endDate,
          options: {
            account_ids: [account.accountId],
            count: 50,
            offset: 0,
          },
        });

        const transactions = txResponse.data.transactions.map((tx) => ({
          id: tx.transaction_id,
          name: tx.name,
          amount: tx.amount,
          date: tx.date,
          category: tx.category,
          pending: tx.pending,
          merchantName: tx.merchant_name,
        }));

        res.json({ transactions, totalTransactions: txResponse.data.total_transactions });
      } catch (err: any) {
        console.error("Plaid transactions error:", err?.response?.data || err?.message);
        res.json({ transactions: [], totalTransactions: 0 });
      }
    } catch (error: any) {
      console.error("Plaid transactions fetch error:", error?.message);
      res.status(500).json({ error: "Failed to fetch transactions." });
    }
  });

  app.delete("/api/plaid/accounts/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const accountId = parseInt(req.params.id as string, 10);

      if (isNaN(accountId)) {
        return res.status(400).json({ error: "Invalid account ID." });
      }

      const [account] = await db
        .select()
        .from(linkedAccounts)
        .where(
          and(
            eq(linkedAccounts.id, accountId),
            eq(linkedAccounts.userId, user.id)
          )
        );

      if (!account) {
        return res.status(404).json({ error: "Account not found." });
      }

      const otherAccountsWithSameToken = await db
        .select()
        .from(linkedAccounts)
        .where(
          and(
            eq(linkedAccounts.plaidAccessToken, account.plaidAccessToken),
            eq(linkedAccounts.userId, user.id)
          )
        );

      await db
        .delete(linkedAccounts)
        .where(
          and(
            eq(linkedAccounts.id, accountId),
            eq(linkedAccounts.userId, user.id)
          )
        );

      if (otherAccountsWithSameToken.length <= 1 && isPlaidConfigured()) {
        try {
          await plaidClient.itemRemove({
            access_token: account.plaidAccessToken,
          });
        } catch (err: any) {
          console.error("Plaid item remove error:", err?.response?.data || err?.message);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Plaid account delete error:", error?.message);
      res.status(500).json({ error: "Failed to remove account." });
    }
  });
}
