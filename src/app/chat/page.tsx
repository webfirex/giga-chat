'use client'

import { ArrowBigRight, Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const EMOJIS = ["😀", "😂", "🥲", "😍", "😎", "🤔", "🔥", "💀", "🚀", "❤️"];

type Message = {
  id: number;
  sender: "me" | "them";
  text: string;
};

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    // initialize socket server
    fetch("/api/socket");

    const socket = socketRef.current;

    socket.on("chat:connected", () => {
      setMessages([]);
      setConnected(true);
    });

    socket.on("chat:message", (msg: string) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "them", text: msg },
      ]);
    });

    socket.on("chat:ended", () => {
      setConnected(false);
    });

    socket.on("no-mod-available", () => {
      alert("No moderators available right now.");
    });

    return () => {
      socket.off();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = async () => {
    // This clears the cookie and redirects to the home page (or login)
    await signOut({ callbackUrl: "/login" }); 
  };

  // SEND MESSAGE
  const sendMessage = () => {
    if (!input.trim() || !connected) return;

    socketRef.current.emit("chat:message", input);

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "me", text: input },
    ]);

    setInput("");
  };

  // NEXT CHAT
  const nextChat = () => {
    socketRef.current.emit("chat:next");
    socketRef.current.emit("user:next");
  };

  // EXIT CHAT
  const exitChat = () => {
    socketRef.current.emit("chat:next");
    setConnected(false);
    setMessages([]);
  };

  return (
    <div className="h-screen w-full bg-[#0b0f1a] text-white flex overflow-hidden relative">

      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0f1424] border-r border-white/5 flex flex-col
        transition-transform duration-300 lg:relative
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-4 text-xl font-semibold flex justify-between">
          <span>Spark<span className="text-indigo-400">Chat</span></span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">✕</button>
        </div>

        <div className="flex-1 flex items-center justify-center text-white/30">
          {connected ? "Connected" : "Click Next to start"}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex">

            <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
              U
            </div>
            <div>
              <p className="text-sm font-medium">You</p>
              <p className="text-xs text-white/40">
                {connected ? "chatting" : "idle"}
              </p>
            </div>
            </div>
            <div className="self-end">
              <Button onClick={ handleLogout } className="cursor-pointer">Log Out</Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 bg-[#0e1326]">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden">
              ☰
            </button>
            <div className="h-9 w-9 rounded-full bg-pink-500 flex items-center justify-center font-bold">
              R
            </div>
            <span>{connected ? "Moderator" : "Not connected"}</span>
          </div>

          <button className="p-2 text-white/60"><Bell /></button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  m.sender === "me" ? "bg-indigo-600" : "bg-white/10"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/5 p-4 bg-[#0e1326]">
          <div className="flex gap-2 mb-2">
            <button
              onClick={exitChat}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
            >
              Exit
            </button>
            <button
              onClick={nextChat}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500"
            >
              Next
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message..."
              className="flex-1 bg-[#0b0f1a] border border-white/10 rounded-xl px-4 py-3 outline-none"
            />

            <button
              onClick={sendMessage}
              disabled={!connected}
              className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
            >
              <ArrowBigRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
