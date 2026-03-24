// FULL CUSTOM AI API
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import cors from "cors";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 8000;
const SECRET = "supersecretkey";

// ===== RATE LIMIT =====
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 50
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

// ===== REGISTER =====
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.status(400).send("User exists");

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

// ===== FAKE AI CHAT =====
function fakeAIResponse(prompt) {
  prompt = prompt.toLowerCase();
  if (prompt.includes("hello")) return "Hey there! I am your AI.";
  if (prompt.includes("time")) return "I cannot tell the exact time yet.";
  return "This is a generic AI response for your custom API.";
}

app.post("/ai/chat", auth, (req, res) => {
  const { prompt } = req.body;
  const reply = fakeAIResponse(prompt);

  history.push({ user: req.user.username, type: "chat", prompt, reply });
  res.json({ reply });
});

// ===== IMAGE (MOCK) =====
app.post("/ai/image", auth, (req, res) => {
  const { prompt } = req.body;
  const imageUrl = `https://dummyimage.com/512x512/000/fff&text=${encodeURIComponent(prompt)}`;

  history.push({ user: req.user.username, type: "image", prompt, imageUrl });
  res.json({ imageUrl });
});

// ===== FILE GENERATOR (BASIC) =====
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
