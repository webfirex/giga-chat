// import { Server as NetServer } from "http";
// import { Server as SocketIOServer, Socket } from "socket.io";
// import type { NextApiRequest, NextApiResponse } from "next";

// import { modLoads, clearSearch, endChat, Role } from "@/lib/socket/socket-utils";
// import { handleUserNext, handleMessage, handleGiftMessage } from "@/lib/socket/socket-handler";

// export const config = { api: { bodyParser: false } };

// type NextApiResponseWithSocket = NextApiResponse & {
//   socket: { server: NetServer & { io?: SocketIOServer } };
// };

// export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
//   if (res.socket.server.io) {
//     return res.status(200).json({ success: true, message: "Socket already running" });
//   }

//   try {
//     console.log("🚀 Initializing Socket.IO Server...");

//     const io = new SocketIOServer(res.socket.server, {
//       path: "/api/socket/io",
//       addTrailingSlash: false,
//       // Production critical: Ensure CORS matches your domain
//       cors: {
//         origin: process.env.NEXT_PUBLIC_SITE_URL || "*",
//         methods: ["GET", "POST"],
//       },
//       transports: ["websocket", "polling"], // Allow fallback
//     });

//     io.on("connection", (socket: Socket) => {
//       const { role } = socket.handshake.auth;

//       // 1. Validation Logic
//       if (!role || (role !== "user" && role !== "mod")) {
//         console.error(`[AUTH_ERROR] Connection rejected: Invalid role "${role}" from ${socket.id}`);
//         socket.disconnect();
//         return;
//       }

//       console.log(`[CONNECTED] ID: ${socket.id} | Role: ${role}`);

//       // 2. State Initialization
//       socket.data.role = role;
//       socket.data.username = null;
//       socket.data.rooms = new Set<string>();

//       if (role === "mod") {
//         modLoads.set(socket.id, 0);
//         console.log(`[MOD_INIT] Mod ${socket.id} added to load balancer.`);
//       }

//       // 3. Structured Event Handlers
//       socket.on("user:identify", ({ username }) => {
//         if (!username || typeof username !== "string") {
//           return console.warn(`[IDENTIFY_ERROR] Invalid username from ${socket.id}`);
//         }
//         socket.data.username = username;
//         console.log(`[IDENTIFY] ${socket.id} is now known as ${username}`);
//       });

//       socket.on("chat:send-user-profile", ({ roomId, userProfile }) => {
//         if (socket.data.role !== "mod") return;
//         if (!roomId) {
//           return console.error(`[PROFILE_ERROR] Mod ${socket.id} attempted to send profile without roomId`);
//         }

//         io.to(roomId).emit("chat:user-profile", { roomId, userProfile });
//         console.log(`[PROFILE_SYNC] Shared profile to room ${roomId}`);
//       });

//       socket.on("user:next", async () => {
//         try {
//           await handleUserNext(io, socket);
//         } catch (error) {
//           console.error(`[USER_NEXT_ERROR] ${socket.id}:`, error);
//         }
//       });

//       socket.on("chat:message", (payload) => {
//         if (!payload?.type) return;

//         try {
//           switch (payload.type) {
//             case "text":
//             case "image":
//               handleMessage(io, socket, payload);
//               break;
//             case "gift":
//               handleGiftMessage(io, socket, payload);
//               break;
//             default:
//               console.warn(`[UNKNOWN_TYPE] ${payload.type} from ${socket.id}`);
//           }
//         } catch (error) {
//           console.error(`[MSG_ERROR] Failed to process ${payload.type}:`, error);
//         }
//       });

//       socket.on("chat:next", (roomId: string) => {
//         if (!roomId) return;
//         console.log(`[CHAT_END] Manually ending room ${roomId}`);
//         endChat(io, roomId);
//       });

//       // 4. Cleanup Logic
//       socket.on("disconnect", (reason) => {
//         console.log(`[DISCONNECTED] ${socket.id} | Reason: ${reason}`);
        
//         try {
//           clearSearch(socket.id);
//           for (const roomId of socket.data.rooms ?? []) {
//             endChat(io, roomId);
//           }
//           if (socket.data.role === "mod") {
//             modLoads.delete(socket.id);
//           }
//         } catch (error) {
//           console.error(`[CLEANUP_ERROR] ${socket.id}:`, error);
//         }
//       });

//       socket.on("error", (err) => {
//         console.error(`[SOCKET_INTERNAL_ERROR] ${socket.id}:`, err);
//       });
//     });

//     res.socket.server.io = io;
//     res.status(201).json({ success: true, message: "Socket initialized" });

//   } catch (error) {
//     console.error("[SERVER_FATAL_ERROR] Failed to initialize Socket.io:", error);
//     res.status(500).json({ error: "Initialization failed" });
//   }
// }