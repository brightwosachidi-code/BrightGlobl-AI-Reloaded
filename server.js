// server.js
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 Hardcoded Google API key (you provided this)
const API_KEY = "AIzaSyCzBIdhqf1kWlxiVNu6FUUMWyXFGIyZiQg";

app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      }),
    });

    const text = await response.text();
    if (!text) return res.status(500).json({ error: "Empty response from API" });

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON from API", raw: text });
    }

    // Try common fields for returned image bytes
    const base64 =
      data?.candidates?.[0]?.image?.imageBytes ||
      data?.data?.[0]?.b64_json ||
      data?.image?.imageBytes ||
      null;

    if (!base64) return res.status(500).json({ error: "No image returned", raw: data });

    const imgBuffer = Buffer.from(base64, "base64");
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": imgBuffer.length,
    });
    res.end(imgBuffer);
  } catch (err) {
    console.error("Error generating image:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
