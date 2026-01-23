import { Server as SocketIOServer, Socket } from "socket.io";
import {
  modLoads,
  MAX_CHATS_PER_MOD,
  activeChats,
  searchTimeouts,
  endChat,
  clearSearch
} from "./socket-utils";

type ChatPayload =
  | {
    type: "text";
    content: string;
    roomId: string
  }
  | {
    type: "image";
    content: string; // hosted image URL
    roomId: string
  }


type GiftPayload = {
  type: "gift";
  amount: number;
  currency: "USD" | "EUR" | "INR";
  giftId?: string;
  roomId: string
};


export const handleUserNext = (io: SocketIOServer, socket: Socket) => {
  if (socket.data.role !== "user") return;

  console.log(`[QUEUE] User ${socket.id} started searching...`);
  clearSearch(socket.id);

  // Math check: Your delay was quite short (1.8s to 7.2s). 
  // For production, ensure this isn't getting killed by Vercel timeouts.
  const min = 3000; 
  const max = 7200;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;

  socket.emit("match:searching", delay);

  const timeout = setTimeout(() => {
    // Debug: Check if any mods actually exist in memory
    console.log(`[MATCHMAKING] Current Mod Loads Map Size: ${modLoads.size}`);
    
    const availableMods = [...modLoads.entries()]
      .filter(([_, count]) => count < MAX_CHATS_PER_MOD)
      .sort((a, b) => a[1] - b[1]);

    const modSocketId = availableMods[0]?.[0];

    if (!modSocketId) {
      console.warn(`[MATCHMAKING_FAIL] No mods in memory for User ${socket.id}`);
      socket.emit("no-mod-available");
      return;
    }

    const modSocket = io.sockets.sockets.get(modSocketId);
    if (!modSocket) {
      console.error(`[MATCHMAKING_FAIL] Mod ${modSocketId} found in Map but socket is missing from IO`);
      modLoads.delete(modSocketId); // Clean up stale data
      return;
    }

    const roomId = `chat_${socket.id}_${modSocketId}`;
    
    // Join logic
    socket.join(roomId);
    modSocket.join(roomId);
    
    // Use optional chaining for the Set in case it wasn't initialized
    if (!socket.data.rooms) socket.data.rooms = new Set();
    if (!modSocket.data.rooms) modSocket.data.rooms = new Set();
    
    socket.data.rooms.add(roomId);
    modSocket.data.rooms.add(roomId);
    
    activeChats.set(roomId, { userId: socket.id, modId: modSocketId });
    modLoads.set(modSocketId, (modLoads.get(modSocketId) ?? 0) + 1);
    
    socket.emit("chat:connected", { roomId });
    modSocket.emit("mod:new-chat", {
      roomId,
      userId: socket.id,
      userPlan: socket.data.username
    });
    
    console.log(`[SUCCESS] Room Created: ${roomId}`);
  }, delay);

  searchTimeouts.set(socket.id, timeout);
};

export const handleMessage = (
  io: SocketIOServer,
  socket: Socket,
  payload: ChatPayload
) => {
  const { type, content } = payload;
  if (!content) {
    console.log("ERROR NO CONTENT")
    return
  };

  const roomId = payload.roomId;
  if (!roomId) {
    console.log("ERROR NO ROOM ID")
    return
  };
  
  console.log("MESSAGE SENT")
  io.to(roomId).emit("chat:message", {
    id: Date.now(),
    sender: socket.data.role,
    type,
    text: content,
    roomId
  });
};


export const handleGiftMessage = (io: SocketIOServer, socket: Socket, payload: GiftPayload) => {
  const { amount, currency, giftId } = payload;

  if (!amount || amount <= 0) return;

  const roomId = payload.roomId;
  if (!roomId) {
    console.log("NO ROOM ID GIFT", payload)
    return
  };

  io.to(roomId).emit("chat:gift", {
    id: Date.now(),
    sender: socket.data.role,
    type: "gift",
    amount,
    currency,
    giftId,
    roomId
  });
};

