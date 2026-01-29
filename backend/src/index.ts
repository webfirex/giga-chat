import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

// Note: Ensure your local imports use the .js extension for ESM compatibility on Render
import { modLoads, clearSearch, endChat, searchingSockets } from "./socket-utils.js";
import { handleUserNext, handleMessage, handleGiftMessage } from "./socket-handler.js";

dotenv.config();

const app = express();

// Standard middleware
app.use(cors());
app.get("/ping", (_req, res) => res.send("pong")); // Keep-alive endpoint

const httpServer = createServer(app);

// Initialize Socket.IO with exact settings from your Next.js handler
const io = new SocketIOServer(httpServer, {
  path: "/api/socket/io",
  addTrailingSlash: false,
  cors: {
    origin: process.env.FRONTEND_URL || "*", 
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"], // Matches Next.js handler
});

console.log("🚀 Initializing Socket.IO Server...");

io.on("connection", (socket: Socket) => {
  const { role, userId, gender } = socket.handshake.auth;

  // 1. Validation Logic (Matched Exactly)
  if (!role || (role !== "user" && role !== "mod")) {
    console.error(`[AUTH_ERROR] Connection rejected: Invalid role "${role}" from ${socket.id}`);
    socket.disconnect();
    return;
  }

  // console.log(`[CONNECTED] ID: ${socket.id} | Role: ${role}`);

  // 2. State Initialization (Matched Exactly)
  socket.data.role = role;
  socket.data.username = null;
  socket.data.rooms = new Set<string>();
  
  
  if(role === "user"){
    socket.data.userId = userId
    socket.data.gender = gender
    console.log(`[CONNECTED] ID: ${socket.id} | Role: ${role} | UserId: ${userId}`);

  }
  if (role === "mod") {
    modLoads.set(socket.id, 0);
    console.log(`[MOD_READY] ${socket.id} added to matchmaking pool`);
  }
  

  // 3. Structured Event Handlers (Matched Exactly)
  socket.on("user:identify", ({ roomId, username }) => {
    if (
      !roomId ||
      !username ||
      typeof username !== "string"
    ) {
      return console.warn(
        `[IDENTIFY_ERROR] Invalid identify payload from ${socket.id}`
      );
    }
  
    // store identity
    socket.data.username = username;
    socket.data.rooms.add(roomId);
  
    console.log(
      `[IDENTIFY] User ${username} identified in room ${roomId}`
    );
  
    // 📡 Forward identity to MOD in the same room
    socket.to(roomId).emit("user:identify", {
      roomId,
      username,
    });
  });
  
  // ❤️ FRIEND REQUEST (ROOM-BASED)

socket.on("friend:request", ({ roomId }) => {
  if (!roomId) {
    return console.warn(
      `[FRIEND_REQ_ERROR] Missing roomId from ${socket.id}`
    );
  }

  console.log(
    `[FRIEND_REQUEST] ${socket.data.role} ${socket.id} → room ${roomId}`
  );

  // Send to everyone else in the room
  socket.to(roomId).emit("friend:request-received", roomId);
});

socket.on("friend:request:accepted", ({ roomId }) => {
  if (!roomId) {
    return console.warn(
      `[FRIEND_ACCEPT_ERROR] Missing roomId from ${socket.id}`
    );
  }

  console.log(
    `[FRIEND_ACCEPTED] ${socket.data.role} ${socket.id} in room ${roomId}`
  );

  // Notify both sides (including sender)
  io.to(roomId).emit("friend:request:accepted");
});


  socket.on("chat:send-user-profile", ({ roomId, userProfile }) => {
    if (socket.data.role !== "mod") return;
    if (!roomId) {
      return console.error(`[PROFILE_ERROR] Mod ${socket.id} attempted to send profile without roomId`);
    }

    io.to(roomId).emit("chat:user-profile", { roomId, userProfile });
    // console.log(`[PROFILE_SYNC] Shared profile to room ${roomId}`);
  });

  socket.on("user:next", async () => {
    try {
      await handleUserNext(io, socket);
    } catch (error) {
      console.error(`[USER_NEXT_ERROR] ${socket.id}:`, error);
    }
  });

  socket.on("chat:message", (payload) => {
    if (!payload?.type) return;

    try {
      switch (payload.type) {
        case "text":
        case "image":
          handleMessage(io, socket, payload);
          break;
        case "gift":
          handleGiftMessage(io, socket, payload);
          break;
        default:
          console.warn(`[UNKNOWN_TYPE] ${payload.type} from ${socket.id}`);
      }
    } catch (error) {
      console.error(`[MSG_ERROR] Failed to process ${payload.type}:`, error);
    }
  });

  socket.on("chat:next", (roomId: string) => {
    if (!roomId) return;
    console.log(`[CHAT_END] Manually ending room ${roomId}`);
    endChat(io, roomId);
  });

  // 4. Cleanup Logic (Matched Exactly)
  socket.on("disconnect", (reason) => {
    console.log(`[DISCONNECTED] ${socket.id} | ${reason}`);
  
    try {
      clearSearch(socket.id);
      searchingSockets.delete(socket.id);
  
      for (const roomId of socket.data.rooms ?? []) {
        endChat(io, roomId);
      }
  
      if (socket.data.role === "mod") {
        modLoads.delete(socket.id);
      }
    } catch (err) {
      console.error(`[CLEANUP_ERROR] ${socket.id}`, err);
    }
  });
  

  socket.on("match:cancel", () => {
    clearSearch(socket.id);
    searchingSockets.delete(socket.id);
  });
  
  
  

  socket.on("error", (err) => {
    console.error(`[SOCKET_INTERNAL_ERROR] ${socket.id}:`, err);
  });
});

// Final Server Listen Logic
const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
});