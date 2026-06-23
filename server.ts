import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Helper to route to Custom OpenAI-compatible server or Google Gemini API
  async function generateAIResponse(
    contentsOrPrompt: string | Array<{ role: string; parts: Array<{ text: string }> }>,
    customSystemMessage?: string
  ): Promise<string> {
    const customUrl = process.env.CUSTOM_AI_URL;
    const customModel = process.env.CUSTOM_AI_MODEL || "llama3";
    const customKey = process.env.CUSTOM_AI_KEY || "";

    if (customUrl) {
      console.log(`[CustomLLMAdapter] Forwarding to endpoint: ${customUrl} using model: ${customModel}`);
      
      const endpoint = customUrl.endsWith("/chat/completions") 
        ? customUrl 
        : `${customUrl.replace(/\/$/, "")}/chat/completions`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (customKey) {
        headers["Authorization"] = `Bearer ${customKey}`;
      }

      const messages = [];
      if (customSystemMessage) {
        messages.push({ role: "system", content: customSystemMessage });
      }

      if (typeof contentsOrPrompt === "string") {
        messages.push({ role: "user", content: contentsOrPrompt });
      } else {
        // Map Gemini roles to OpenAI roles
        for (const turn of contentsOrPrompt) {
          const role = turn.role === "model" ? "assistant" : "user";
          const content = turn.parts?.[0]?.text || "";
          messages.push({ role, content });
        }
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: customModel,
          messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Custom AI server returned status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Custom AI response payload was missing message text");
      }
      return text;
    }

    // Default Fallback: Gemini API
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Neither CUSTOM_AI_URL nor GEMINI_API_KEY is configured on the server");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const config: any = {
      thinkingConfig: {
        thinkingBudget: 0, // Disable thinking budget for instant responses
      }
    };

    if (customSystemMessage) {
      config.systemInstruction = customSystemMessage;
    }

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[GeminiAPI] Attempting generation with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contentsOrPrompt,
          config,
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        console.warn(`[GeminiAPI] Model ${modelName} failed:`, err.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error("All Gemini models failed to generate content");
  }

  // API route for general AI generation calls
  app.post("/api/gemini", async (req, res) => {
    try {
      const { prompt, contents, systemMessage } = req.body;
      if (!prompt && !contents) {
        return res.status(400).json({ error: "Missing prompt or contents" });
      }
      const text = await generateAIResponse(contents || prompt, systemMessage);
      res.json({ text });
    } catch (error: any) {
      console.error('Error in general AI generation:', error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // API route to exchange Strava auth code for tokens
  app.post("/api/strava/token", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Missing authorization code" });

      const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.VITE_STRAVA_CLIENT_ID || "233128",
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Strava Token Exchange failed: ${errText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Strava Token Exchange Error:", error);
      res.status(500).json({ error: error.message || "Failed to exchange Strava token" });
    }
  });

  // API route to refresh Strava access token
  app.post("/api/strava/refresh", async (req, res) => {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) return res.status(400).json({ error: "Missing refresh token" });

      const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.VITE_STRAVA_CLIENT_ID || "233128",
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Strava Token Refresh failed: ${errText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Strava Token Refresh Error:", error);
      res.status(500).json({ error: error.message || "Failed to refresh Strava token" });
    }
  });

  // API route for getting a daily affirmation
  app.get("/api/affirmation", async (req, res) => {
    try {
      const systemMessage = "Write a short, single-sentence uplifting and motivating daily affirmation for a university student. Keep it under 15 words. Write it in Indonesian.";
      const text = await generateAIResponse("Give me my daily affirmation.", systemMessage);
      res.json({ affirmation: text });
    } catch (error: any) {
      console.error('Error generating affirmation:', error);
      // Clean fallback in case of all failures
      res.json({ affirmation: 'Fokus pada proses, bukan hanya hasil akhir.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
