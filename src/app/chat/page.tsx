"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket/socket-client";

import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import ChatControls from "@/components/chat/ChatControls";
import { usePlan } from "@/contexts/PlanContext";
import { IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { removeEmojis } from "@/lib/utils";

type Message = {
  id: number;
  sender: "me" | "them";
  type: "text" | "image" | "gift";
  text?: string;
  imageUrl?: string;
  amount?: number;
  currency?: "USD" | "EUR" | "INR";
};


export default function UserChatPage() {
  const socketRef = useRef(getSocket());
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchingText, setSearchingText] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(1);
  const [chatStatus, setChatStatus] = useState<"idle" | "active" | "partner_skipped" | "me_skipped">('idle')
  const { state, decreaseChat } = usePlan()

  const username = "User_" + Math.floor(Math.random() * 1000);
  const noChatsLeft =
    connected &&
    state?.chats_left !== undefined &&
    state.chats_left <= 0;


  useEffect(() => {
    // fetch("/api/socket");
    const socket = socketRef.current;
    socket.emit("user:identify", { username });

    socket.on("match:searching", (delay: number) => setSearchingText(`Searching...`));
    socket.on("chat:connected", ({ roomId }) => {
      setRoomId(roomId);
      setMessages([]);
      setConnected(true);
      setPartnerName("Random MOD NAME");
      setSearchingText(null);
    });
    
    socket.on("chat:message", (msg) => {
    //  console.log("MESSAGE USER",msg)
    if (msg.roomId !== roomId) return
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id ?? Date.now(),
          sender: "them",
          type: msg.type,
          text: msg.type === "text" ? msg.text : undefined,
          imageUrl: msg.type === "image" ? msg.text : undefined,
        },
      ]);
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop:typing", () => setIsTyping(false));
    // socket.on("chat:ended", () => { setConnected(false); setPartnerName(null); });
    socket.on("chat:ended", () => {
      setConnected(false);
      setPartnerName(null);
      setRoomId(null);
    });
    
    socket.on('no-mod-available', () => {
      notifications.show({
        title: 'No one is available',
        message: 'Please try again later.',
        icon: <IconX size={18} />,
        color: 'red',
      });

      setSearchingText(null);
    });

    return () => { socket.off(); };
  }, []);

  useEffect(() => {
    if (searchingText === null) { setSeconds(1); return; }
    const interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [searchingText]);

  const handleInputChange = (value: string) => {
    let input = value
    if(!state?.can_send_emojis){
      const filter = removeEmojis(input)
      setInput(filter);
    }
    else{
      setInput(input);
    }
    if (!connected) return;
    socketRef.current.emit("typing");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socketRef.current.emit("stop:typing"), 800);
  };

  const sendMessage = async () => {
    if (!input.trim() || !connected) return;
    if (noChatsLeft) return;

    socketRef.current.emit("chat:message", {
      roomId,
      type: "text",
      content: input,
    });
    
    // ✅ Optimistically add your own message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "me",
        type: "text",
        text: input,
      },
    ]);

    socketRef.current.emit("stop:typing");

    setInput("");
    await decreaseChat();
  };

  const sendImageMessage = async (imageUrl: string) => {
    if (!imageUrl || !connected) return;
    if (noChatsLeft) return;

    socketRef.current.emit("chat:message", {
      type: "image",
      content: imageUrl,
    });

    socketRef.current.emit("stop:typing");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "me",
        type: "image",
        imageUrl: imageUrl,
      },
    ]);

    await decreaseChat();
  };

  const sendGiftMessage = (
    amount: number,
    currency: "INR",
    giftId?: string
  ) => {

    socketRef.current.emit("chat:message", {
      type: "gift",
      amount,
      currency,
      giftId,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "me",
        type: "gift",
        amount: amount,
        currency: currency,
      },
    ]);


  };



  const nextChat = () => {
    // 1. Clear UI state immediately so the user knows the transition started
    setChatStatus("me_skipped")
    setMessages([]);
    setConnected(false);
    setPartnerName(null);
    setSearchingText('Searching...')

    // 2. Get the delay from plan context (e.g., 90s for Free, 15s for Basic, 0s for Premium)
    const delay = (state?.min_match_time ? state.min_match_time : 0) * 1000;

    setTimeout(() => {
      if (socketRef.current) {
        // socketRef.current.emit("chat:next");
        if (roomId) {
          socketRef.current.emit("chat:next", roomId);
        }        
        socketRef.current.emit("user:next");
      }
    }, delay);
  };

  const chatStart = () => {
    // 1. Clear UI state immediately so the user knows the transition started
    // setChatStatus("me_skipped")
    setMessages([]);
    setConnected(false);
    setPartnerName(null);
    setSearchingText('Searching...')

    // 2. Get the delay from plan context (e.g., 90s for Free, 15s for Basic, 0s for Premium)
    const delay = (state?.min_match_time ? state.min_match_time : 0) * 1000;

    setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit("chat:next");
        socketRef.current.emit("user:next");
      }
    }, delay);
  };

  return (
    <div className="h-dvh max-w-125 mx-auto border-x border-white/20 bg-[#0b0f1a] text-white flex ">
      {/* Sidebar */}
      {/* <Sidebar sessions={[]} /> */}

      {/* Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          connected={connected}
          partnerName={partnerName || undefined}
          searchingText={searchingText || undefined}
        />

        <MessageList
          messages={messages}
          isTyping={isTyping}
          partnerName={partnerName}
          searchingText={searchingText}
          seconds={seconds}
          connected={connected}
          chatStatus={chatStatus}
        />

        <ChatControls
          input={input}
          connected={connected}
          searchingText={searchingText}
          onInputChange={handleInputChange}
          onSendMessage={sendMessage}
          onNext={nextChat}
          onChatStart={chatStart}
          onSendImage={sendImageMessage}
          onSendGift={sendGiftMessage}
          onExit={() => {
            socketRef.current.emit("chat:next");
            setChatStatus("me_skipped")
            setConnected(false);
            setMessages([]);
          }}
        />
      </div>
    </div>

  );
}