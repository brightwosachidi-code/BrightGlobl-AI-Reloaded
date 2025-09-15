
// server.js - Hardcoded Gemini API key version

import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Hardcoded Google Gemini API key
const API_KEY = "AIzaSyCzBIdhqf1kWlxiVNu6FUUMWyXFGIyZiQg";

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }

    const data = await response.json();

    // Extract a clean text reply
    let botReply = "";
    try {
      botReply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        data.candidates?.[0]?.output ||
        data.output_text ||
        "Sorry, no response";
    } catch {
      botReply = "Sorry, something went wrong parsing the reply.";
    }

    res.json({ reply: botReply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on port " + PORT));
