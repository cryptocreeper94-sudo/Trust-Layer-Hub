import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerAIRoutes } from "./ai-agent";
import { registerAuthRoutes } from "./auth";
import { registerHallmarkRoutes } from "./hallmark";
import { registerPlaidRoutes } from "./plaid";
import { registerWalletRoutes } from "./wallets";
import { registerMultisigRoutes } from "./multisig";
import { registerNewsRoutes } from "./news";
import { registerStakingRoutes } from "./staking";
import { registerAffiliateRoutes } from "./affiliate";
import { registerStripeRoutes } from "./stripe-business";
import { registerLeaderboardRoutes } from "./leaderboard";
import { registerActivityFeedRoutes } from "./activity-feed";
import { registerPublicProfileRoutes } from "./public-profiles";
import { registerChatPersistenceRoutes } from "./chat-persistence";
import { registerPulseRoutes } from "./pulse";
import { registerBlockchainRoutes } from "./blockchain";
import { registerDeveloperPortalRoutes } from "./developer-portal";
import { registerBlogRoutes } from "./blog";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check for Render
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  registerBlockchainRoutes(app);
  registerAuthRoutes(app);
  registerAIRoutes(app);
  registerHallmarkRoutes(app);
  registerPlaidRoutes(app);
  registerWalletRoutes(app);
  registerMultisigRoutes(app);
  registerNewsRoutes(app);
  registerStakingRoutes(app);
  registerAffiliateRoutes(app);
  registerStripeRoutes(app);
  registerLeaderboardRoutes(app);
  registerActivityFeedRoutes(app);
  registerPublicProfileRoutes(app);
  registerChatPersistenceRoutes(app);
  registerPulseRoutes(app);
  registerDeveloperPortalRoutes(app);
  registerBlogRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
