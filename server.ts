import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize Gemini AI lazily
  const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/gemini/pre-event-plan", async (req, res) => {
    try {
      const ai = getAi();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key not configured" });
      }

      const input = req.body;
      const prompt = `You are FlowNavigator AI, an intelligent crowd management and IoT safety engineer.
Generate an event crowd management plan for the following event details:
- Event Name: ${input.eventName}
- Venue: ${input.venueName}
- Expected Attendees: ${input.expectedCrowd}
- Zones Count: ${input.zonesCount}
- Average Zone Capacity: ${input.avgZoneCapacity}
- Entrances Count: ${input.entrancesCount}
- Exits Count: ${input.exitsCount}
- Event Schedule: ${input.startTime} to ${input.endTime}
- Special Notes: ${input.specialNotes || 'None'}

Return a structured JSON response.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              eventName: { type: Type.STRING },
              riskAssessment: {
                type: Type.OBJECT,
                properties: {
                  overallRiskLevel: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  highRiskZones: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["overallRiskLevel", "summary", "highRiskZones"]
              },
              recommendedSensorsCount: { type: Type.INTEGER },
              sensorPlacements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    location: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["location", "reason"]
                }
              },
              suggestedRouteDistribution: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    routeName: { type: Type.STRING },
                    allocationPercentage: { type: Type.INTEGER },
                    note: { type: Type.STRING }
                  },
                  required: ["routeName", "allocationPercentage", "note"]
                }
              },
              peakTimeEstimate: { type: Type.STRING },
              staffDeploymentAreas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    area: { type: Type.STRING },
                    personnelNeeded: { type: Type.INTEGER },
                    primaryTask: { type: Type.STRING }
                  },
                  required: ["area", "personnelNeeded", "primaryTask"]
                }
              },
              bottleneckPredictions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: [
              "eventName",
              "riskAssessment",
              "recommendedSensorsCount",
              "sensorPlacements",
              "suggestedRouteDistribution",
              "peakTimeEstimate",
              "staffDeploymentAreas",
              "bottleneckPredictions"
            ]
          }
        }
      });

      const resultText = response.text || "{}";
      res.json(JSON.parse(resultText));
    } catch (error) {
      console.error("Gemini event planner error:", error);
      res.status(500).json({ error: "Failed to generate AI event plan" });
    }
  });

  // Serve Vite app
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FlowNavigator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
