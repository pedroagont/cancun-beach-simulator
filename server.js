// REQUIREMENTS
import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import db from "./db.js";
import OpenAI from "openai";

// SETUP & MIDDLEWARE
// Allowed origins
const allowedOrigins = {
  origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
  methods: ["GET", "POST"],
};

// Express
const app = express();
app.set("trust proxy", 1); // 1 means trust the first proxy in the chain
app.use(morgan("dev"));
app.use(cors(allowedOrigins));
app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

// SocketIO
const server = http.createServer(app);
const io = new Server(server, {
  cors: allowedOrigins, // Set your frontend domain in production
});
io.engine.pingInterval = 25000;
io.engine.pingTimeout = 60000;

// OpenAI SDK
const openai = new OpenAI();

// AI API Limiter
const aiLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5, // max 5 requests per IP per window
  message: "Too many requests, please wait a few seconds.",
});

// Memory for current connected players
let players = {}; // { socketId: { id, name, color, x, z } }

// SOCKETS
// Handshake middleware
io.use((socket, next) => {
  if (typeof socket.handshake.query !== "object") {
    return next(new Error("Invalid handshake"));
  }
  next();
});

// Connection
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  // SOCKET EVENTS
  // When a player joins
  socket.on("joinGame", (data) => {
    if (
      !data?.name ||
      typeof data.name !== "string" ||
      !data?.color ||
      typeof data.color !== "number"
    ) {
      return; // ignore invalid join
    }

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
    if (
      !data ||
      typeof data.x !== "number" ||
      typeof data.y !== "number" ||
      typeof data.z !== "number" ||
      typeof data.rotationY !== "number"
    )
      return;

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

// ROUTES
// AI Response endpoint
app.post("/generate-ai-response", aiLimiter, async (req, res) => {
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

// API route to create a new player
app.post("/players", async (req, res) => {
  // Get client IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",").shift() ||
    req.socket?.remoteAddress;

  try {
    const { rows } = await db.query(
      "INSERT INTO players (name, ip) VALUES ($1, $2) RETURNING *;",
      [req.body.name, ip]
    );
    res.json({ message: "Player created", player: rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// API route to get all players
app.get("/players", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM players;");
  res.json(rows);
});

// catch all route
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
