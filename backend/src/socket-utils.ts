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
export const endChat = (io: SocketIOServer, roomId: string) => {
  const chat = activeChats.get(roomId);
  if (!chat) {
    console.warn(`[END_CHAT_FAIL] Room ${roomId} not found in activeChats`);
    return;
  }

  const { userId, modId } = chat;
  const userSocket = io.sockets.sockets.get(userId);
  const modSocket = io.sockets.sockets.get(modId);

  // Emit to the room first before closing it
  io.to(roomId).emit("chat:ended", { roomId });

  // Safety checks before calling .leave()
  if (userSocket) {
    userSocket.leave(roomId);
    userSocket.data.rooms?.delete(roomId);
  }

  if (modSocket) {
    modSocket.leave(roomId);
    modSocket.data.rooms?.delete(roomId);
    // Only decrease load if the mod is still "alive"
    const currentLoad = modLoads.get(modId) ?? 1;
    modLoads.set(modId, Math.max(0, currentLoad - 1));
  }

  activeChats.delete(roomId);
  console.log(`[CLEANUP] Room ${roomId} closed. Mod ${modId} load decreased.`);
};
