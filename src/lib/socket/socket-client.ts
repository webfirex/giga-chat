import { io, Socket } from "socket.io-client";

let socket: Socket;

export function getSocket() {
  if (!socket) {

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:10000";

    socket = io(SOCKET_URL, {
      path: "/api/socket/io",
      // addTrailingSlash: false,
      transports: ["websocket"],
      upgrade: false,
      auth: { role: "user" },
      
      withCredentials: true,
    });
  }
  return socket;
}
