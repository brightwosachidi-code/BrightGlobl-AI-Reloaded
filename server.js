import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public")); // serve your index.html

// POST /generate handles chatbot messages
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    // Use Gemini text/chat endpoint
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.GOOGLE_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: errorText });
    }

    const data = await response.json();

    // Try to extract chatbot text safely
    let outputText =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ") ||
      data?.candidates?.[0]?.output ||
      data?.output_text ||
      null;

    if (!outputText) {
      return res.json({ output_text: "⚠️ No text returned. Raw response: " + JSON.stringify(data) });
    }

    res.json({ output_text: outputText });
  } catch (error) {
    console.error("Error generating:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
