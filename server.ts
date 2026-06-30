import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const RESPONSES_FILE = path.join(process.cwd(), "responses.json");

// Parse JSON bodies with a larger limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize response storage file if it doesn't exist
if (!fs.existsSync(RESPONSES_FILE)) {
  fs.writeFileSync(RESPONSES_FILE, JSON.stringify({ responses: [], stats: { noClicksCount: 0 }, memories: [] }, null, 2));
}

// Read helper
const readData = () => {
  try {
    const raw = fs.readFileSync(RESPONSES_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.memories) parsed.memories = [];
    return parsed;
  } catch (e) {
    return { responses: [], stats: { noClicksCount: 0 }, memories: [] };
  }
};

// Write helper
const writeData = (data: any) => {
  try {
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing data to responses.json", e);
  }
};

// --- API ROUTES ---

// Submit a new date response
app.post("/api/responses", (req, res) => {
  const { selectedDate, selectedTime, dateType, customNotes } = req.body;
  if (!selectedDate || !selectedTime || !dateType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const data = readData();
  const newResponse = {
    id: "resp_" + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    selectedDate,
    selectedTime,
    dateType,
    customNotes: customNotes || "",
    status: "accepted"
  };

  data.responses.push(newResponse);
  writeData(data);

  res.status(201).json({ success: true, response: newResponse });
});

// Fetch all responses (and stats)
app.get("/api/responses", (req, res) => {
  const data = readData();
  res.json(data);
});

// Delete/clear all responses and reset stats
app.delete("/api/responses", (req, res) => {
  const emptyData = { responses: [], stats: { noClicksCount: 0 } };
  writeData(emptyData);
  res.json({ success: true, message: "Cleared all responses and stats" });
});

// Increment No Button Clicks counter
app.post("/api/stats/no-click", (req, res) => {
  const data = readData();
  if (!data.stats) {
    data.stats = { noClicksCount: 0 };
  }
  data.stats.noClicksCount += 1;
  writeData(data);
  res.json({ success: true, noClicksCount: data.stats.noClicksCount });
});

// --- CUSTOM MEMORIES ENDPOINTS ---

// Fetch all custom memories
app.get("/api/memories", (req, res) => {
  const data = readData();
  res.json({ memories: data.memories || [] });
});

// Add a new memory
app.post("/api/memories", (req, res) => {
  const { imageUrl, title, englishTitle, caption, dateStr } = req.body;
  if (!imageUrl || !title) {
    return res.status(400).json({ error: "Image URL and Title are required" });
  }

  const data = readData();
  const newMemory = {
    id: Date.now(), // simple numeric ID
    imageUrl,
    title,
    englishTitle: englishTitle || "Sweet Moment",
    caption: caption || "",
    dateStr: dateStr || "Special Day"
  };

  if (!data.memories) {
    data.memories = [];
  }
  data.memories.push(newMemory);
  writeData(data);

  res.status(201).json({ success: true, memory: newMemory });
});

// Delete a custom memory
app.delete("/api/memories/:id", (req, res) => {
  const memoryId = parseInt(req.params.id, 10);
  if (isNaN(memoryId)) {
    return res.status(400).json({ error: "Invalid memory ID" });
  }

  const data = readData();
  if (!data.memories) {
    data.memories = [];
  }

  const originalLength = data.memories.length;
  data.memories = data.memories.filter((m: any) => m.id !== memoryId);

  if (data.memories.length === originalLength) {
    return res.status(404).json({ error: "Memory not found" });
  }

  writeData(data);
  res.json({ success: true, message: "Memory deleted successfully" });
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Love Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
