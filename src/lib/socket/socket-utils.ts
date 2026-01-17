import { Server as SocketIOServer, Socket } from "socket.io";

export type Role = "user" | "mod";

// ==============================
// In-memory state
// ==============================

// Mods available for matchmaking
// Max chats a mod can handle
export const MAX_CHATS_PER_MOD = 100;

// modSocketId -> active chat count
export const modLoads = new Map<string, number>();

// roomId -> { userId, modId }
export const activeChats = new Map<
  string,
  { userId: string; modId: string }
>();


// socket.id -> matchmaking timeout
export const searchTimeouts = new Map<string, NodeJS.Timeout>();

// ==============================
// Clear matchmaking search
// ==============================
export const clearSearch = (socketId: string) => {
  const timeout = searchTimeouts.get(socketId);
  if (timeout) {
    clearTimeout(timeout);
    searchTimeouts.delete(socketId);
  }
};

// ==============================
// End chat & cleanup room
// ==============================
export const endChat = (
  io: SocketIOServer,
  roomId: string
) => {
  const chat = activeChats.get(roomId);
  if (!chat) return;

  const { userId, modId } = chat;

  const userSocket = io.sockets.sockets.get(userId);
  const modSocket = io.sockets.sockets.get(modId);

  // 🔔 Notify both
  io.to(roomId).emit("chat:ended", { roomId });

  // 🚪 Leave room
  userSocket?.leave(roomId);
  modSocket?.leave(roomId);

  // 🧹 Remove room from socket data
  userSocket?.data.rooms?.delete(roomId);
  modSocket?.data.rooms?.delete(roomId);

  // ♻️ Decrease mod load
  modLoads.set(
    modId,
    Math.max(0, (modLoads.get(modId) ?? 1) - 1)
  );

  activeChats.delete(roomId);
};
