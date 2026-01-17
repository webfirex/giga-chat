"use client";

import { useEffect, useRef } from "react";

export type Message = {
  id: number;
  sender: "me" | "them";
  type: "text" | "image" | "gift";
  text?: string;
  imageUrl?: string;
  amount?: number;
  currency?: "USD" | "EUR" | "INR";
};

interface Props {
  messages: Message[];              // ONLY messages of active room
  isTyping: boolean;
  partnerName?: string | null;
}

export default function MessageList({
  messages,
  isTyping,
  partnerName,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <div className="text-center text-white/40 text-sm mt-8">
          No messages yet
        </div>
      )}

      {messages.map((m) => {
        const isMe = m.sender === "me";

        return (
          <div
            key={m.id}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            {/* TEXT */}
            {m.type === "text" && (
              <div
                className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                  isMe
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-white"
                }`}
              >
                {m.text}
              </div>
            )}

            {/* IMAGE */}
            {m.type === "image" && m.imageUrl && (
              <div
                className={`rounded-2xl overflow-hidden max-w-[70%] border ${
                  isMe
                    ? "border-indigo-500/40"
                    : "border-white/20"
                }`}
              >
                <img
                  src={m.imageUrl}
                  alt="Shared"
                  className="max-h-64 object-cover"
                />
              </div>
            )}

            {/* GIFT */}
            {m.type === "gift" && (
              <div
                className="
                  px-4 py-3 rounded-2xl max-w-[70%]
                  flex flex-col items-center gap-1
                  bg-linear-to-r from-amber-500/30 via-yellow-400/30 to-amber-500/30
                  border border-amber-400/40
                  text-amber-100
                "
              >
                <span className="text-sm font-semibold">🎁 Gift</span>
                <span className="text-xs">
                  {m.amount} {m.currency}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {isTyping && partnerName && (
        <p className="text-xs text-white/40">
          {partnerName} is typing…
        </p>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
