// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

dotenv.config();

// --- Express setup ---
const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// open ai requirements and setup
import OpenAI from "openai";
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI();

// --- HTTP + Socket.io setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Set your frontend domain in production
});

// --- Store connected players ---
// Store connected players
let players = {}; // { socketId: { id, name, color, x, z } }

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // When a player joins
  socket.on("joinGame", (data) => {
    console.log(`${data.name} joined the game`);

    // Assign ID
    players[socket.id] = {
      id: socket.id,
      name: data.name,
      color: data.color,
      x: data.x || 0,
      z: data.z || 0,
    };

    // Notify all other players about this new player
    socket.broadcast.emit("newPlayer", players[socket.id]);

    // Send existing players to the newly connected client
    for (let id in players) {
      if (id !== socket.id) {
        socket.emit("newPlayer", players[id]);
      }
    }
  });

  // When a player moves
  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;

      // Broadcast to all other players
      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        position: { x: data.x, y: data.y, z: data.z },
        rotation: { y: data.rotationY },
      });
    }
  });

  // When a player disconnects
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from players list
    delete players[socket.id];

    // Notify all clients to remove this player
    io.emit("playerDisconnected", socket.id);
  });
});

// --- AI Response endpoint ---
app.post("/generate-ai-response", async (req, res) => {
  try {
    // declare and validate messages input
    const { messages } = req.body;
    if (!messages) {
      return res.status(400).send("Please provide a messages input");
    }

    const response = await openai.responses.create({
      model: "gpt-5",
      reasoning: { effort: "low" },
      input: messages,
    });

    const reply = response.output_text;

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
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
