const dotenv = require("dotenv");
const OpenAI = require('openai');
dotenv.config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const HF_TOKEN = process.env.HF_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const app = express();

const corsOptions = {
  origin: ["http://127.0.0.1:5500", "https://healthy-plants.netlify.app"], // 👈 Replace with your actual Netlify site URL
  methods: "GET,POST",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "10mb" }));

app.post("/detect", async (req, res) => {
  const imageBase64 = req.body.image;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image is required" });
  }
  // Disease detection
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

// Function to get suggestions from DeepSeek API
app.post("/suggest", async (req, res) => {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://healthy-plants.netlify.app',
      'X-Title': 'Plant Disease Detector',
    },
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: [
        {
          role: 'user',
          content: "What are the best practices for plant disease detection?",
        },
      ],
    });

    const suggestions = completion.choices[0].message.content; // Extracting the suggestions
    res.json({ suggestions }); // Send suggestions back to frontend
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
