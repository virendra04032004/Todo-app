require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/todo-app";

// ── Database ─────────────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅  Connected to MongoDB"))
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    console.error("    Make sure MongoDB is running and MONGO_URI is correct.");
  });

// ── Schema & Model ────────────────────────────────────────────────────────────
const todoSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true, maxlength: 500 },
    completed: { type: Boolean, default: false },
    priority:  { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", todoSchema);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/todos  — list all, optional ?filter=all|active|completed
app.get("/api/todos", async (req, res) => {
  try {
    const { filter } = req.query;
    const query =
      filter === "active"
        ? { completed: false }
        : filter === "completed"
        ? { completed: true }
        : {};
    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    console.error("GET /api/todos:", err);
    res.status(500).json({ error: "Failed to fetch todos." });
  }
});

// GET /api/todos/stats  — counts
app.get("/api/todos/stats", async (req, res) => {
  try {
    const [total, completed] = await Promise.all([
      Todo.countDocuments(),
      Todo.countDocuments({ completed: true }),
    ]);
    res.json({ total, completed, active: total - completed });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// POST /api/todos  — create
app.post("/api/todos", async (req, res) => {
  const { text, priority } = req.body;
  if (!text || text.trim().length === 0)
    return res.status(400).json({ error: "Todo text is required." });

  try {
    const todo = await Todo.create({ text: text.trim(), priority: priority || "medium" });
    res.status(201).json(todo);
  } catch (err) {
    console.error("POST /api/todos:", err);
    res.status(500).json({ error: "Failed to create todo." });
  }
});

// PATCH /api/todos/:id  — edit text, priority, or toggle completed
app.patch("/api/todos/:id", async (req, res) => {
  const { text, completed, priority } = req.body;
  const updates = {};
  if (text !== undefined) {
    if (text.trim().length === 0)
      return res.status(400).json({ error: "Todo text cannot be empty." });
    updates.text = text.trim();
  }
  if (completed !== undefined) updates.completed = Boolean(completed);
  if (priority !== undefined) updates.priority = priority;

  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!todo) return res.status(404).json({ error: "Todo not found." });
    res.json(todo);
  } catch (err) {
    console.error("PATCH /api/todos/:id:", err);
    res.status(500).json({ error: "Failed to update todo." });
  }
});

// DELETE /api/todos/:id  — delete one
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ error: "Todo not found." });
    res.json({ message: "Todo deleted." });
  } catch (err) {
    console.error("DELETE /api/todos/:id:", err);
    res.status(500).json({ error: "Failed to delete todo." });
  }
});

// DELETE /api/todos/completed/all  — bulk delete completed
app.delete("/api/todos/completed/all", async (req, res) => {
  try {
    const { deletedCount } = await Todo.deleteMany({ completed: true });
    res.json({ message: `Deleted ${deletedCount} completed todos.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear completed todos." });
  }
});

// Fallback
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🚀  Todo App running at http://localhost:${PORT}`)
);
