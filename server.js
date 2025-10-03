import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors()); // later you can restrict to your domains
app.use(express.json());

const ELEVENLABS_API_KEY = process.env.sk_07d66e43c0fc53d1c8d2fc6c06584d80d423dfd768bbfaee;
const VOICE_ID = "RV61Jufh8hla0FskiCGw"; // DangerousGem voice ID

// sanity check routes
app.get("/", (_req, res) => res.json({ hello: "dangerousgem alive" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/speak", async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ error: "Missing ELEVENLABS_API_KEY" });
    }
    const { text = "" } = req.body || {};
    const msg = String(text).trim();
    if (!msg) return res.status(400).json({ error: "text is required" });

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text: msg,
        model_id: "eleven_monolingual_v1",
        output_format: "mp3_44100_128",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!r.ok) {
      const details = await r.text().catch(() => "");
      console.error("ElevenLabs API error:", r.status, details);
      return res.status(r.status).json({ error: "ElevenLabs API error" });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.send(buf);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Error generating voice" });
  }
});

const port = process.env.PORT || 5174;
app.listen(port, () => console.log(`🎙️ Voice server running on ${port}`));
