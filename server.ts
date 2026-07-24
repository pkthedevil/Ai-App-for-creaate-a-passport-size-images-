import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
function getGenAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return ai;
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", geminiEnabled: !!process.env.GEMINI_API_KEY });
});

// AI Auto Face Detection & Framing Analysis Endpoint
app.post("/api/ai/detect-face", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const client = getGenAI();
    if (!client) {
      return res.status(503).json({
        error: "Gemini API Key not configured. Using client-side canvas face heuristic detection.",
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this uploaded photograph for passport/stamp photo creation.
Locate the main human face and head in normalized coordinates from 0 to 1000 [ymin, xmin, ymax, xmax].
Evaluate photo quality (lighting, blur, face posture, background uniformity).
Suggest recommended crop box [ymin, xmin, ymax, xmax] ensuring standard passport photo framing:
- Top head space: ~10% margin above crown
- Chin to head top: ~60-70% of total frame height
- Centered eyes horizontally
- Shoulders visible at bottom.`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faceBox: {
              type: Type.OBJECT,
              description: "Face bounding box normalized (0-1000 scale)",
              properties: {
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER },
              },
              required: ["ymin", "xmin", "ymax", "xmax"],
            },
            suggestedCropBox: {
              type: Type.OBJECT,
              description: "Ideal passport crop box normalized (0-1000 scale)",
              properties: {
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER },
              },
              required: ["ymin", "xmin", "ymax", "xmax"],
            },
            qualityAnalysis: {
              type: Type.OBJECT,
              properties: {
                lightingScore: { type: Type.NUMBER, description: "1 to 10 scale" },
                clarityScore: { type: Type.NUMBER, description: "1 to 10 scale" },
                backgroundUniformity: { type: Type.STRING },
                complianceStatus: { type: Type.STRING, description: "Pass or Warning notes" },
                recommendations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["lightingScore", "clarityScore", "complianceStatus"],
            },
          },
          required: ["faceBox", "suggestedCropBox", "qualityAnalysis"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(text);
    return res.json(data);
  } catch (error: any) {
    console.error("AI Face Detection error:", error);
    return res.status(500).json({
      error: error.message || "Failed to process image with AI",
    });
  }
});

// AI Enhancements / Studio Retouch Advice or Background Suggestions
app.post("/api/ai/enhance-advice", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", targetSize = "Passport" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const client = getGenAI();
    if (!client) {
      return res.status(503).json({ error: "Gemini API key not configured" });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Provide precise photo adjustments for a studio-quality ${targetSize} photo.
Suggest optimal slider values from -100 to +100 for:
- brightness (-100 to 100, 0 neutral)
- contrast (-100 to 100, 0 neutral)
- sharpness (0 to 100)
- warmth (-100 to 100)
- noiseReduction (0 to 100)
- backgroundType (white, light-blue, off-white, light-gray)
And brief studio technician tips.`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: cleanBase64 } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brightness: { type: Type.NUMBER },
            contrast: { type: Type.NUMBER },
            sharpness: { type: Type.NUMBER },
            warmth: { type: Type.NUMBER },
            noiseReduction: { type: Type.NUMBER },
            recommendedBackground: { type: Type.STRING },
            technicianTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "brightness",
            "contrast",
            "sharpness",
            "warmth",
            "noiseReduction",
            "recommendedBackground",
            "technicianTips",
          ],
        },
      },
    });

    return res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("AI Enhance advice error:", error);
    return res.status(500).json({ error: error.message || "Failed AI advice" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
