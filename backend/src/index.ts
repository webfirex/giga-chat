import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { modLoads, clearSearch, endChat } from "./socket-utils";
import { handleUserNext, handleMessage, handleGiftMessage } from "./socket-handler";

dotenv.config();

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/api/socket/io",
  cors: {
    origin: process.env.FRONTEND_URL || "*", // Your Vercel URL
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

io.on("connection", (socket) => {
  const role = socket.handshake.auth.role;
  if (role !== "user" && role !== "mod") {
    socket.disconnect();
    return;
  }

  socket.data.role = role;
  socket.data.rooms = new Set<string>();

  if (role === "mod") modLoads.set(socket.id, 0);

  // Bind your existing handlers
  socket.on("user:identify", ({ username }) => { socket.data.username = username; });
  socket.on("user:next", () => handleUserNext(io, socket));
  socket.on("chat:message", (payload) => handleMessage(io, socket, payload));
  socket.on("chat:next", (roomId) => endChat(io, roomId));

  socket.on("disconnect", () => {
    clearSearch(socket.id);
    for (const roomId of socket.data.rooms ?? []) {
      endChat(io, roomId);
    }
    if (socket.data.role === "mod") modLoads.delete(socket.id);
  });
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server running on http://192.168.x.x:${PORT}`); 
  // Tip: Replace x.x with your actual local IP so you can remember it!
});