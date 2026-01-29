import { Server as SocketIOServer, Socket } from "socket.io";
import {
  modLoads,
  MAX_CHATS_PER_MOD,
  activeChats,
  searchTimeouts,
  searchingSockets,
  clearSearch
} from "./socket-utils.js";

type ChatPayload =
  | {
    type: "text";
    content: string;
    roomId: string
    price?: number
  }
  | {
    type: "image";
    content: string; // hosted image URL
    roomId: string
    price: number
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

  // 🧹 clear any previous search
  clearSearch(socket.id);

  searchingSockets.add(socket.id);

  const min = 3000;
  const max = 7200;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;

  socket.emit("match:searching", delay);

  const timeout = setTimeout(() => {
    // ❌ user cancelled search meanwhile
    if (!searchingSockets.has(socket.id)) {
      console.log(`[MATCH_ABORTED] User ${socket.id} cancelled search`);
      return;
    }

    console.log(`[MATCHMAKING] Mod load count: ${modLoads.size}`);

    const availableMods = [...modLoads.entries()]
    .filter(([modId, count]) => {
      return count < MAX_CHATS_PER_MOD;
    })    
    .sort((a, b) => a[1] - b[1]);

    const modSocketId = availableMods[0]?.[0];

    if (!modSocketId) {
      console.warn(`[MATCH_FAIL] No available mods for ${socket.id}`);
      searchingSockets.delete(socket.id);
      socket.emit("no-mod-available");
      return;
    }

    const modSocket = io.sockets.sockets.get(modSocketId);
    if (!modSocket) {
      console.warn(`[STALE_MOD] ${modSocketId} missing, cleaning up`);
      modLoads.delete(modSocketId);
      searchingSockets.delete(socket.id);
      return;
    }

    const roomId = `chat_${socket.id}_${modSocketId}`;

    // join room
    socket.join(roomId);
    modSocket.join(roomId);

    socket.data.rooms ??= new Set();
    modSocket.data.rooms ??= new Set();

    socket.data.rooms.add(roomId);
    modSocket.data.rooms.add(roomId);

    activeChats.set(roomId, {
      userId: socket.id,
      modId: modSocketId,
    });

    modLoads.set(modSocketId, (modLoads.get(modSocketId) ?? 0) + 1);

    // ✅ REMOVE BOTH FROM SEARCHING
    searchingSockets.delete(socket.id);

    socket.emit("chat:connected", { roomId });
    modSocket.emit("mod:new-chat", {
      roomId,
      userId: socket.data.userId,
      userGenderSelected: socket.data.gender,
    });

    console.log(`[MATCH_SUCCESS] Room ${roomId} created`);
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
    roomId,
    // price: payload.price ?? 0
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

