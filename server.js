import HF_TOKEN from "dotenv";
dotenv.config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); // workaround for node-fetch ESM


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));


app.post("/detect", async (req, res) => {
  const imageBase64 = req.body.image;

  if (!imageBase64) {
    console.error("❌ No image found in request body");
    return res.status(400).json({ error: "Image is required" });
  }

  console.log("✅ Received image, length:", imageBase64.length);

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: imageBase64 }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("💥 Hugging Face API Error:", data.error);
      return res.status(500).json({ error: data.error });
    }

    console.log("✅ Got response from Hugging Face:", data);
    res.json(data);
  } catch (err) {
    console.error("💥 Server Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(5000, () => console.log("🚀 Server running at http://localhost:5000"));
