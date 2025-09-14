// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Google Gemini API key from environment variable
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

app.post("/generate", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-mini:generateImage?key=${GOOGLE_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prompt: prompt,
                    imageConfig: {
                        height: 512,
                        width: 512
                    }
                })
            }
        );

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Failed to generate image");
        }

        const data = await response.json();
        const base64 = data.candidates?.[0]?.image?.imageBytes;
        if (!base64) throw new Error("No image data received");

        const imgBuffer = Buffer.from(base64, "base64");

        res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": imgBuffer.length
        });
        res.end(imgBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
