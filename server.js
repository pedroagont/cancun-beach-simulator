// server.js
import express from "express";
// import http from "http";
// import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
// import fetch from "node-fetch"; // If using OpenAI or other APIs

dotenv.config();

// --- Express setup ---
const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// open ai requirements and setup
import OpenAI from 'openai';
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI();

// // --- HTTP + Socket.io setup ---
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" }, // Set your frontend domain in production
// });

// // --- Store connected players ---
// let players = {};

// // --- Socket.io events ---
// io.on("connection", (socket) => {
//   console.log(`✅ User connected: ${socket.id}`);

//   // Add player to list
//   players[socket.id] = { id: socket.id, x: 0, y: 0, z: 0 };
//   io.emit("players-update", players);

//   // Handle position updates from client
//   socket.on("update-position", (pos) => {
//     if (players[socket.id]) {
//       players[socket.id] = { ...players[socket.id], ...pos };
//       io.emit("players-update", players);
//     }
//   });

//   // Remove on disconnect
//   socket.on("disconnect", () => {
//     console.log(`❌ User disconnected: ${socket.id}`);
//     delete players[socket.id];
//     io.emit("players-update", players);
//   });
// });

// --- AI Response endpoint ---
app.post("/generate-ai-response", async (req, res) => {
  try {
    // declare and validate messages input
    const { messages } = req.body;
    if (!messages) {
      return res.status(400).send('Please provide a messages input');
    }

    const response = await openai.responses.create({
        model: "gpt-5",
        reasoning: { effort: "low" },
        input: messages,
    });

    const reply = response.output_text

    // Temporary mock AI
    // const reply = `${npcName} (${npcPersonality}) replies: "${userMessage}" but with more beach vibes 🌴`;

    res.json({ reply });
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
