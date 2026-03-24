// index.js
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(express.json());
app.use(cors());

// ✅ PORT from Railway
const PORT = process.env.PORT;

// ===== OPENAI SETUP =====
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== ROOT TEST =====
app.get("/", (req, res) => {
  res.send("API is working");
});

// ===== SIMPLE AI CHAT =====
app.post("/ai/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).send("AI error");
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT; 
app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
});
