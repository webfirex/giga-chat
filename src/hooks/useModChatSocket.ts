"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket/socket-mod";


export type Message = {
  id: number;
  sender: "me" | "them";
  type: "text" | "image" | "gift";
  text?: string;
  imageUrl?: string;
  amount?: number;
  currency?: "USD" | "EUR" | "INR";
};

type ModChat = {
  roomId: string;
  userId: string;
  messages: Message[];
};


export function useModChatSocket(modName: string) {
  const socketRef = useRef(getSocket());
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const [chats, setChats] = useState<ModChat[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;

    // 🔌 MOD ONLINE
    socket.emit("mod:online", { modName });

    // 🔗 CONNECTED TO USER
    socket.on("mod:new-chat", ({ roomId, userId }) => {
      setChats((prev) => [
        ...prev,
        {
          roomId,
          userId,
          messages: [],
        },
      ]);

      // Auto-select first chat
      setActiveRoomId((prev) => prev ?? roomId);
    });


    // 📩 RECEIVE MESSAGE FROM USER
    socket.on("chat:message", (msg) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.roomId === msg.roomId
            ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: msg.id,
                  sender: "them",
                  type: msg.type,
                  text: msg.type === "text" ? msg.text : undefined,
                  imageUrl: msg.type === "image" ? msg.text : undefined,
                  amount: msg.type === "gift" ? msg.amount : undefined,
                  currency: msg.type === "gift" ? msg.currency : undefined,
                },
              ],
            }
            : chat
        )
      );
    });


    socket.on("chat:gift", (msg) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.roomId === msg.roomId
            ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: msg.id,
                  sender: "them",
                  type: msg.type,
                  text: msg.type === "text" ? msg.text : undefined,
                  imageUrl: msg.type === "image" ? msg.text : undefined,
                  amount: msg.type === "gift" ? msg.amount : undefined,
                  currency: msg.type === "gift" ? msg.currency : undefined,
                },
              ],
            }
            : chat
        )
      );
    });

    // ✍️ TYPING INDICATORS
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop:typing", () => setIsTyping(false));

    // ❌ CHAT ENDED
    socket.on("chat:ended", ({ roomId }) => {
      setChats((prev) => prev.filter((c) => c.roomId !== roomId));
    
      setActiveRoomId((current) =>
        current === roomId ? null : current
      );
    });
    

    return () => {
      socket.off("mod:new-chat");
      socket.off("chat:message");
      socket.off("chat:gift");
      socket.off("typing");
      socket.off("stop:typing");
      socket.off("chat:ended");
    };
    
  }, [modName]);

  // 📤 SEND MESSAGE TO USER
  const sendMessage = (text: string) => {
    if (!text.trim() || !activeRoomId) return;

    // Optimistic UI
    setChats((prev) =>
      prev.map((chat) =>
        chat.roomId === activeRoomId
          ? {
            ...chat,
            messages: [
              ...chat.messages,
              {
                id: Date.now(),
                sender: "me",
                type: "text",
                text,
              },
            ],
          }
          : chat
      )
    );

    // alert(messages[messages.length -1].type)


    // ✅ CORRECT PAYLOAD (MATCHES SERVER)
    if (!activeRoomId) return;

    socketRef.current.emit("chat:message", {
      roomId: activeRoomId,
      type: "text",
      content: text,
    });


    socketRef.current.emit("stop:typing");
  };

  // ✍️ HANDLE TYPING
  const handleTyping = () => {
    socketRef.current.emit("typing", { roomId: activeRoomId});

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      socketRef.current.emit("stop:typing");
    }, 800);
  };

  const sendImageMessage = async (imageUrl: string) => {
    if (!imageUrl || !activeRoomId) return;
    // if (noChatsLeft) return;

    socketRef.current.emit("chat:message", {
      roomId: activeRoomId,
      type: "image",
      content: imageUrl,
    });


    socketRef.current.emit("stop:typing");

    setChats((prev) =>
      prev.map((chat) =>
        chat.roomId === activeRoomId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: Date.now(),
                  sender: "me",
                  type: "image",
                  imageUrl,
                },
              ],
            }
          : chat
      )
    );
    

    // await decreaseChat();
  };

  // ⏭ EXIT / NEXT CHAT
  const exitChat = () => {
    if (!activeRoomId) return;
  
    // 🔔 Tell backend to end THIS room only
    socketRef.current.emit("chat:next", activeRoomId);
  
    // 🧹 Remove this chat locally
    setChats((prev) =>
      prev.filter((chat) => chat.roomId !== activeRoomId)
    );
  
    // 🧭 Switch to another open chat if any
    setActiveRoomId((prev) => {
      const remaining = chats.filter(
        (chat) => chat.roomId !== prev
      );
      return remaining.length ? remaining[0].roomId : null;
    });
  
    // ✍️ Stop typing ONLY for this room
    socketRef.current.emit("stop:typing", {
      roomId: activeRoomId,
    });
  };
  

  return {
    chats,                // for side panel
    activeRoomId,
    setActiveRoomId,      // clicking side panel
    activeMessages: chats.find(c => c.roomId === activeRoomId)?.messages ?? [],
    isTyping,
    sendMessage,
    handleTyping,
    exitChat,
    sendImageMessage,
  };
  
}
