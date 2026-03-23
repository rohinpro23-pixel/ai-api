import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import cors from "cors";

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ✅ IMPORTANT FIX
const PORT = process.env.PORT || 3000;
const SECRET = "supersecretkey";

// ===== OPENAI SETUP =====
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== RATE LIMIT =====
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20
});
app.use(limiter);

// ===== FAKE DATABASE =====
let users = [];
let history = [];

// ===== AUTH =====
function auth(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// ===== ROOT (VERY IMPORTANT) =====
app.get("/", (req, res) => {
  res.send("API is working");
});

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).send("User exists");
  }

  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });

  res.send("Registered");
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).send("Invalid");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).send("Invalid");

  const token = jwt.sign({ username }, SECRET);
  res.json({ token });
});

// ===== AI CHAT =====
app.post("/ai/chat", auth, async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    });

    const reply = response.choices[0].message.content;

    history.push({ user: req.user.username, type: "chat", prompt, reply });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).send("AI error");
  }
});

// ===== IMAGE (MOCK) =====
app.post("/ai/image", auth, (req, res) => {
  const { prompt } = req.body;

  const imageUrl = `https://dummyimage.com/512x512/000/fff&text=${encodeURIComponent(prompt)}`;

  history.push({ user: req.user.username, type: "image", prompt, imageUrl });

  res.json({ imageUrl });
});

// ===== FILE GENERATOR =====
app.post("/generate-file", auth, (req, res) => {
  const { type, topic } = req.body;

  let fileUrl = "";

  if (type === "ppt") fileUrl = `/downloads/${topic}.pptx`;
  else if (type === "pdf") fileUrl = `/downloads/${topic}.pdf`;
  else if (type === "docx") fileUrl = `/downloads/${topic}.docx`;
  else return res.status(400).send("Invalid type");

  history.push({ user: req.user.username, type: "file", topic, fileUrl });

  res.json({ fileUrl });
});

// ===== HISTORY =====
app.get("/history", auth, (req, res) => {
  const userHistory = history.filter(h => h.user === req.user.username);
  res.json(userHistory);
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
