import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  
  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    // Simple mock auth for demo
    if (username === "admin" && password === "password") {
      res.json({ token: "mock-jwt-token", user: { username: "admin", role: "ADMIN" } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // AI Inference Route (Using Gemini)
  app.post("/api/ml/predict", async (req, res) => {
    const { data } = req.body;
    
    try {
      const prompt = `Analyze this system event data and determine if it's a SECURITY THREAT or NORMAL behavior. 
      Data: ${JSON.stringify(data)}
      Respond with ONLY a JSON object: { "prediction": "THREAT" | "NORMAL", "confidence": number (0-1), "reasoning": "string" }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      
      const responseText = response.text;
      const predictionData = JSON.parse(responseText.replace(/```json|```/g, "").trim());
      
      // Log to "Splunk"
      console.log(`[SPLUNK] service=ml-model level=INFO event=prediction result=${predictionData.prediction} confidence=${predictionData.confidence} reasoning="${predictionData.reasoning}"`);
      
      res.json({ ...predictionData, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("AI Inference Error:", error);
      // Fallback
      const prediction = Math.random() > 0.8 ? "THREAT" : "NORMAL";
      res.json({ prediction, confidence: 0.95, timestamp: new Date().toISOString(), reasoning: "Fallback logic used due to AI error." });
    }
  });

  // SOAR Block IP Route
  app.post("/api/security/block-ip", (req, res) => {
    const { ip } = req.body;
    console.log(`[SOAR] Blocking IP: ${ip}`);
    io.emit("security:alert", { type: "IP_BLOCKED", ip, timestamp: new Date().toISOString() });
    res.json({ status: "success", message: `IP ${ip} blocked` });
  });

  // --- Real-time Logic ---
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    // Simulate live data stream (Kafka-like)
    const interval = setInterval(() => {
      const event = {
        id: Math.random().toString(36).substr(2, 9),
        type: Math.random() > 0.8 ? "SECURITY" : "METRIC",
        value: Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString(),
        service: ["auth-service", "ml-model", "gateway", "database"][Math.floor(Math.random() * 4)]
      };
      socket.emit("stream:event", event);
    }, 2000);

    socket.on("disconnect", () => {
      clearInterval(interval);
      console.log("Client disconnected");
    });
  });

  // --- Vite Middleware ---
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Elite Platform running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
