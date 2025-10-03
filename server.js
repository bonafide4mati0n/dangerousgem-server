import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // or axios

const app = express();
app.use(cors());
app.use(express.json());

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY; // store key in Render settings

app.post("/speak", async (req, res) => {
  try {
    const { text } = req.body;
    const voice = "DangerousGem"; // your custom voice name

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "xi-api-key": sk_44417504ba00b6f192c95845e92e241dfb8afea08436bf96,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    const arrayBuffer = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating voice");
  }
});

const port = process.env.PORT || 5174;
app.listen(port, () => console.log(`Voice server running on ${port}`));
