const dotenv = require("dotenv");
const OpenAI = require("openai");
dotenv.config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const HF_TOKEN = process.env.HF_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const app = express();

// ✅ CORS Config
const corsOptions = {
  origin: ["http://127.0.0.1:5500", "https://healthy-plants.netlify.app"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ Handle preflight requests

app.use(bodyParser.json({ limit: "10mb" }));

// 🧪 Disease Detection Endpoint
app.post("/detect", async (req, res) => {
  const imageBase64 = req.body.image;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image is required" });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageBase64 }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// 💡 AI Suggestions Endpoint
app.post("/suggest", async (req, res) => {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://healthy-plants.netlify.app",
      "X-Title": "Plant Disease Detector",
    },
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "user",
          content:
            "What are the best practices for plant disease detection? give me 5 points each and every points must be under 8 words and also don't ask for anything later and don't give any explanation",
        },
      ],
    });

    const suggestions = completion.choices[0].message.content;
    res.json({ suggestions });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🧠 Backend running at http://localhost:${PORT}`)
);
