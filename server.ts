import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to get sanitized API key
  function getSanitizedKey(): string | null {
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.GOOGLE_API_KEY,
      process.env.API_KEY,
    ];

    for (const k of keys) {
      if (!k || typeof k !== 'string') continue;
      let s = k.trim().replace(/^["']|["']$/g, '');
      
      const placeholders = ['your_api_key', 'my_api_key', 'undefined', 'null', 'placeholder', 'paste_your_key_here', 'your_gemini_api_key'];
      if (placeholders.some(p => s.toLowerCase().includes(p))) continue;
      
      // Standard Gemini keys start with AIza
      if (!s.startsWith('AIza') && s.length < 20) continue;

      return s;
    }
    return null;
  }

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    try {
      const apiKey = getSanitizedKey();
      if (!apiKey) {
        const envNames = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'API_KEY'];
        const debug = envNames.map(name => {
          const val = process.env[name];
          if (!val) return `${name}: missing`;
          return `${name}: len=${val.length}, startsWith=${val.trim().slice(0, 5)}...`;
        }).join(' | ');

        return res.status(500).json({ 
          error: `Mochi's AI magic is not ready yet. ✨ A valid Gemini API key starting with 'AIza' is required in Settings -> Secrets. 🎀 Debug: ${debug}` 
        });
      }

      const { model, contents, config } = req.body;
      const client = new GoogleGenAI({ apiKey });
      
      // Map contents for the new SDK
      const contentsArray = Array.isArray(contents) 
        ? contents 
        : [{ role: 'user', parts: [{ text: String(contents) }] }];

      const response = await client.models.generateContent({
        model: model || "gemini-1.5-flash",
        contents: contentsArray,
        config: {
          systemInstruction: config?.systemInstruction,
          responseMimeType: config?.responseMimeType,
          responseSchema: config?.responseSchema
        }
      });

      return res.json({
        text: response.text,
        candidates: response.candidates
      });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      const msg = error.message || "";
      if (msg.includes("API key not valid") || msg.includes("INVALID_ARGUMENT") || error.status === "INVALID_ARGUMENT") {
        return res.status(400).json({ error: "The provided Gemini API key is not valid. 🎀 Please check Settings -> Secrets." });
      }
      res.status(500).json({ error: msg || "Mochi is having trouble thinking. 🍡" });
    }
  });

  app.get("/api/mochi-health", (req, res) => {
    const apiKey = getSanitizedKey();
    res.json({
      status: "online",
      message: "Mochi is ready! 🍡",
      time: new Date().toISOString(),
      ai: {
        configured: !!apiKey,
        keyLength: apiKey?.length || 0,
        prefix: apiKey ? `${apiKey.slice(0, 6)}...` : null
      }
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
