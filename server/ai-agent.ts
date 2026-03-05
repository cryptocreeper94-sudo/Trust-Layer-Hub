import type { Express, Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const ELEVENLABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

const SYSTEM_PROMPT = `You are the Trust Layer AI Agent — a knowledgeable and friendly assistant for the Trust Layer blockchain ecosystem. You help users understand and navigate the 34-app ecosystem built by DarkWave Studios LLC.

Key knowledge:
- Trust Layer is a unified blockchain ecosystem launching August 23, 2026 (CST)
- Signal (SIG) is the NATIVE ASSET of the ecosystem — never call it a "token"
- Shells are the in-app currency used for transactions and upgrades
- stSIG is staked Signal that earns rewards
- The ecosystem includes 34 apps (33 in the directory + the Hub itself) across categories: DeFi, Social, Security, Governance, NFT/Metaverse, Utility, Infrastructure, AI/Data, Creative
- Guardian Security Scanner protects wallets from threats
- THE VOID is the staking/yield protocol
- Signal Chat provides encrypted messaging with blockchain-verified identities
- TrustShield.tech provides security infrastructure
- Protected by TrustShield.tech

Core ecosystem apps include: PulseChain Bridge, NexGen DEX, SynthVault, AnchorStake, Trust Layer DAO, ChainForge, SentinelAI, and more.

Subscription tiers: Free, Pulse Pro, Strike Agent, Complete Bundle.

You should:
- Be concise but thorough
- Use a professional yet approachable tone
- Help with ecosystem navigation, app recommendations, and general blockchain questions
- Never give financial advice — remind users to do their own research
- Reference specific ecosystem apps when relevant
- Keep responses focused and mobile-friendly (short paragraphs)`;

export function registerAIRoutes(app: Express): void {
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    // Also accessible at /api/ai/chat for backward compatibility
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("AI chat error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "AI processing failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "AI chat failed" });
      }
    }
  });

  app.post("/api/voice/tts", async (req: Request, res: Response) => {
    try {
      const { text, voice_id } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      let base64Audio: string | null = null;

      if (ELEVENLABS_API_KEY) {
        try {
          const voiceId = voice_id || "21m00Tcm4TlvDq8ikWAM";
          const ttsResponse = await globalThis.fetch(`${ELEVENLABS_BASE_URL}/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true,
              },
            }),
          });

          if (ttsResponse.ok) {
            const arrayBuffer = await ttsResponse.arrayBuffer();
            base64Audio = Buffer.from(arrayBuffer).toString("base64");
            console.log("TTS: ElevenLabs success");
          } else {
            const errText = await ttsResponse.text();
            console.error("ElevenLabs TTS error:", ttsResponse.status, errText, "— falling back to OpenAI");
          }
        } catch (elevenErr: any) {
          console.error("ElevenLabs TTS exception:", elevenErr?.message, "— falling back to OpenAI");
        }
      } else {
        console.log("TTS: No ElevenLabs key, using OpenAI");
      }

      if (!base64Audio) {
        try {
          const mp3Response = await openai.audio.speech.create({
            model: "tts-1",
            voice: "nova",
            input: text,
            response_format: "mp3",
          });

          const arrayBuffer = await mp3Response.arrayBuffer();
          base64Audio = Buffer.from(arrayBuffer).toString("base64");
          console.log("TTS: OpenAI fallback success");
        } catch (openaiErr: any) {
          console.error("OpenAI TTS fallback error:", openaiErr?.message);
          return res.status(500).json({ error: "TTS generation failed on both providers" });
        }
      }

      res.json({ audio: base64Audio, contentType: "audio/mpeg" });
    } catch (error: any) {
      console.error("TTS error:", error?.message || error);
      res.status(500).json({ error: "TTS generation failed" });
    }
  });

  app.get("/api/voice/voices", async (_req: Request, res: Response) => {
    try {
      if (!ELEVENLABS_API_KEY) {
        throw new Error("No API key");
      }

      const voicesResponse = await globalThis.fetch(`${ELEVENLABS_BASE_URL}/v1/voices`, {
        method: "GET",
        headers: { "xi-api-key": ELEVENLABS_API_KEY },
      });

      if (!voicesResponse.ok) {
        return res.json({
          voices: [
            { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
            { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
            { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
            { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli" },
            { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
          ],
        });
      }

      const data = await voicesResponse.json();
      res.json(data);
    } catch (error) {
      console.error("Voices error:", error);
      res.json({
        voices: [
          { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
          { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
          { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
        ],
      });
    }
  });
}
