// server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fetch from "node-fetch";

const app = express();

// ====== CONFIG ======
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "RV61Jufh8hla0FskiCGw"; // DangerousGem
const PORT = process.env.PORT || 5174;

// allow your sites (add more if needed)
const CORS_ALLOWLIST = [
  "https://genesis.zedxiix.com",
  "https://purplehaze.zedxiix.com",
  "https://zedxiix.com",
  "https://amethyst.zedxiix.com",
  "http://localhost:5173",
  "http://localhost:5174",
];

// ====== MIDDLEWARE ======
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl/postman
      if (CORS_ALLOWLIST.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

// Preflight
app.options("*", (_req, res) => res.sendStatus(200));

// ====== ROUTES ======
app.get("/", (_req, res) => res.json({ hello: "dangerousgem alive" }));
app.get("/health", (_req, res) => res.json({ ok: true, voice: !!VOICE_ID }));

app.post("/speak", async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: "Missing ELEVENLABS_API_KEY" });
    }
    const { text = "" } = req.body || {};
    const msg = String(text).trim();
    if (!msg) return res.status(400).json({ error: "text is required" });
    if (msg.length > 800) {
      return res.status(413).json({ error: "text too long (max 800 chars)" });
    }

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: msg,
          model_id: "eleven_monolingual_v1",
          output_format: "mp3_44100_128",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!r.ok) {
      const details = await r.text().catch(() => "");
      console.error("ElevenLabs API error:", r.status, details);
      return res
        .status(r.status)
        .json({ error: "ElevenLabs API error", status: r.status });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "private, max-age=5");
    return res.send(buf);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Error generating voice" });
  }
});

// ====== START ======
app.listen(PORT, () => {
  console.log(`🎙️ Voice server running on ${PORT}`);
});
