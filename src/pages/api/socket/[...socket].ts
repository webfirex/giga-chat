import { Server as NetServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";

import {
  modLoads,
  clearSearch,
  endChat,
  Role,
} from "@/lib/socket/socket-utils";


import {
  handleUserNext,
  handleMessage,
  handleGiftMessage,
} from "@/lib/socket/socket-handler";

export const config = { api: { bodyParser: false } };

type NextApiResponseWithSocket = NextApiResponse & {
  socket: { server: NetServer & { io?: SocketIOServer } };
};

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (!res.socket.server.io) {
    console.log("✅ Initializing Socket.IO");

    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });

    io.on("connection", (socket: Socket) => {
      const role = socket.handshake.auth.role as Role;

      if (role !== "user" && role !== "mod") {
        socket.disconnect();
        return;
      }

      socket.data.role = role;
      socket.data.rooms = new Set<string>();
      
      if (role === "mod") {
        modLoads.set(socket.id, 0);
      }
      

      // ==========================
      // Chat events
      // ==========================
      socket.on("user:next", () => handleUserNext(io, socket));

      socket.on("chat:message", (payload) => {
        if (!payload?.type) return;

        switch (payload.type) {
          case "text":
          case "image":
            handleMessage(io, socket, payload);
            break;

          case "gift":
            handleGiftMessage(io, socket, payload);
            break;

          default:
            console.warn("Unknown message type:", payload.type);
        }
      });

      socket.on("chat:next", (roomId: string) => {
        if (!roomId) return;
        endChat(io, roomId);
      });
      

      socket.on("disconnect", () => {
        clearSearch(socket.id);
      
        // End all rooms this socket was part of
        for (const roomId of socket.data.rooms ?? []) {
          endChat(io, roomId);
        }
      
        if (socket.data.role === "mod") {
          modLoads.delete(socket.id);
        }
      });
      
    });

    res.socket.server.io = io;
  }

  res.end();
}
