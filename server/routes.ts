import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerAIRoutes } from "./ai-agent";
import { registerAuthRoutes } from "./auth";
import { registerHallmarkRoutes } from "./hallmark";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerAIRoutes(app);
  registerHallmarkRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
