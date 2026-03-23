import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Railway PORT (DON’T TOUCH THIS)
const PORT = process.env.PORT;

// ✅ OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ ROOT TEST
app.get("/", (req, res) => {
  res.send("API is working");
});

// ✅ SIMPLE AI ROUTE (no auth for now)
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

// ✅ START SERVER
app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
