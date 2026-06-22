import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

// Helper to route to Custom OpenAI-compatible server or Google Gemini API
async function generateAIResponse(
  contentsOrPrompt: string | Array<{ role: string; parts: Array<{ text: string }> }>,
  customSystemMessage?: string
): Promise<string> {
  const customUrl = process.env.CUSTOM_AI_URL;
  const customModel = process.env.CUSTOM_AI_MODEL || "llama3";
  const customKey = process.env.CUSTOM_AI_KEY || "";

  if (customUrl) {
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

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Neither CUSTOM_AI_URL nor GEMINI_API_KEY is configured on the server");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const config: any = {
    thinkingConfig: {
      thinkingBudget: 0, // Disable thinking budget for sub-second responses
    }
  };

  if (customSystemMessage) {
    config.systemInstruction = customSystemMessage;
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentsOrPrompt,
        config,
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
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
    console.error("Error in general AI generation:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// API route for getting a daily affirmation
app.get("/api/affirmation", async (req, res) => {
  try {
    const systemMessage = "Write a short, single-sentence daily affirmation for a student in Indonesian under 15 words.";
    const text = await generateAIResponse("Give me my daily affirmation.", systemMessage);
    res.json({ affirmation: text });
  } catch (error: any) {
    console.error("Error generating affirmation:", error);
    res.json({ affirmation: "Fokus pada proses, bukan hanya hasil akhir." });
  }
});

export default app;
