import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Your API key hardcoded (for testing). Replace if you rotate keys.
const API_KEY = "AIzaSyCzBIdhqf1kWlxiVNu6FUUMWyXFGIyZiQg";

app.use(express.json());
app.use(express.static("public"));

// Health check
app.get("/", (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("API error:", errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();

    // Try to extract text from several possible locations
    let botReply = null;
    if (data.output_text) botReply = String(data.output_text);
    if (!botReply && data.candidates && data.candidates[0]) {
      const c = data.candidates[0];
      if (c.content && Array.isArray(c.content.parts)) {
        botReply = c.content.parts.map(p => p.text || "").join("");
      } else if (c.message && Array.isArray(c.message.content)) {
        botReply = c.message.content.map(p => p.text || "").join("");
      } else if (c.output) {
        botReply = String(c.output);
      }
    }
    if (!botReply && data.data && data.data[0]) {
      botReply = data.data[0].generated_text || data.data[0].text || null;
    }

    if (!botReply) {
      // return raw for debugging
      return res.json({ output_text: "⚠️ No text found in model response", raw: data });
    }

    res.json({ output_text: botReply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
