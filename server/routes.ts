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

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerAIRoutes(app);
  registerHallmarkRoutes(app);
  registerPlaidRoutes(app);
  registerWalletRoutes(app);
  registerMultisigRoutes(app);
  registerNewsRoutes(app);
  registerStakingRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
