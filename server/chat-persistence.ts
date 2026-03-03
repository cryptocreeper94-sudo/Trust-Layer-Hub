import type { Express, Request, Response } from "express";
import { db } from "./db";
import { chatChannels, chatMessages, users } from "./db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { authenticateToken } from "./auth";

const DEFAULT_CHANNELS = [
  { name: "general", description: "General discussion", icon: "chatbubbles" },
  { name: "trading", description: "Trading signals and analysis", icon: "trending-up" },
  { name: "development", description: "Developer discussions", icon: "code-slash" },
  { name: "announcements", description: "Official announcements", icon: "megaphone" },
  { name: "support", description: "Help and support", icon: "help-circle" },
];

async function seedChannels(): Promise<void> {
  for (const ch of DEFAULT_CHANNELS) {
    await db.execute(sql`
      INSERT INTO chat_channels (name, description, icon)
      VALUES (${ch.name}, ${ch.description}, ${ch.icon})
      ON CONFLICT (name) DO NOTHING
    `);
  }
}

export function registerChatPersistenceRoutes(app: Express): void {
  app.get("/api/chat/channels", authenticateToken, async (_req: Request, res: Response) => {
    try {
      await seedChannels();

      const channels = await db
        .select()
        .from(chatChannels)
        .orderBy(chatChannels.id);

      const channelsWithCounts = await Promise.all(
        channels.map(async (ch) => {
          const [msgCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(chatMessages)
            .where(eq(chatMessages.channelId, ch.id));

          return {
            id: ch.id,
            name: ch.name,
            description: ch.description,
            icon: ch.icon,
            messageCount: Number(msgCount?.count || 0),
          };
        })
      );

      res.json({ channels: channelsWithCounts });
    } catch (error: any) {
      console.error("Chat channels error:", error?.message);
      res.json({ channels: [] });
    }
  });

  app.get("/api/chat/messages/:channelId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const channelId = parseInt(req.params.channelId, 10);
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }

      const messagesRaw = await db.execute(sql`
        SELECT cm.id, cm.content, cm.created_at, cm.channel_id,
               u.username, u.first_name
        FROM chat_messages cm
        INNER JOIN users u ON u.id = cm.user_id
        WHERE cm.channel_id = ${channelId}
        ORDER BY cm.created_at DESC
        LIMIT 50
      `);

      const rows = (messagesRaw as any).rows || messagesRaw || [];

      const messages = rows.reverse().map((r: any) => ({
        id: r.id,
        content: r.content,
        channelId: r.channel_id,
        username: r.username,
        firstName: r.first_name,
        createdAt: r.created_at,
      }));

      res.json({ messages });
    } catch (error: any) {
      console.error("Chat messages error:", error?.message);
      res.json({ messages: [] });
    }
  });

  app.post("/api/chat/messages", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { channelId, content } = req.body;

      if (!channelId || !content || !content.trim()) {
        return res.status(400).json({ error: "channelId and content are required" });
      }

      const [channel] = await db
        .select()
        .from(chatChannels)
        .where(eq(chatChannels.id, channelId));

      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }

      const [message] = await db
        .insert(chatMessages)
        .values({
          channelId,
          userId: user.id,
          content: content.trim(),
        })
        .returning();

      res.status(201).json({
        id: message.id,
        content: message.content,
        channelId: message.channelId,
        username: user.username,
        firstName: user.firstName,
        createdAt: message.createdAt,
      });
    } catch (error: any) {
      console.error("Chat send error:", error?.message);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
}
