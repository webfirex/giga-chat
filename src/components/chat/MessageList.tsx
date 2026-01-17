import { useEffect, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { ChevronDown, Flag, Sparkles, VenusAndMars } from "lucide-react";
import IdleUI from "./IdleUI";

type Message = {
  id: number;
  sender: "me" | "them";
  type: "text" | "image" | "gift";
  text?: string;
  imageUrl?: string;
  amount?: number;
  currency?: "USD" | "EUR" | "INR";
};


interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  partnerName: string | null;
  searchingText: string | null;
  seconds: number;
  connected: boolean;
  chatStatus: "active" | "partner_skipped" | "me_skipped" | "idle"; // Added this
}

export default function MessageList({
  messages, isTyping, partnerName, searchingText, seconds, connected, chatStatus
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    // console.log("MESSAGES", messages)
  }, [messages, isTyping, chatStatus]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="flex-1 flex flex-col overflow-y-auto space-y-3 justify-end">
        <div className="flex-1 pt-50" />

        {/* {messages.map((m) =>

          !m.type && (
            <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-[70%] ${m.sender === "me" ? "bg-indigo-600 text-white" : "bg-white/10 text-white"
                }`}>
                {m.text}
              </div>
            </div>
          )
        )} */}

        {messages.map((m) => {
          const isMe = m.sender === "me";

          return (
            <div
              key={m.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              {/* TEXT */}
              {m.type=="text" && (
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] ${isMe
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-white"
                    }`}
                >
                  {m.text}
                </div>
              )}

              {/* IMAGE */}
              {m.type === "image" && m.imageUrl &&(
                <div
                  className={`rounded-2xl overflow-hidden max-w-[70%] border ${isMe ? "border-indigo-500/40" : "border-white/20"
                    }`}
                >
                  <img
                    src={m.imageUrl}
                    alt="Shared image"
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

        {/* SKIPPED STATE UI */}
        {!connected &&
          (chatStatus === "partner_skipped" || chatStatus === "me_skipped") && (
            <IdleUI chatStatus={chatStatus} />

          )}

        {isTyping && chatStatus === "active" && (
          <p className="text-xs text-white/40 animate-pulse">{partnerName || "Partner"} is typing...</p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="text-center text-white/50 pt-4 mb-14">
        {searchingText !== null ? (
          <span className="animate-pulse">Finding someone... {seconds}s</span>
        ) : (
          !connected && chatStatus === "idle" && "Click below to find someone!"
        )}
      </div>
    </div>
  );
}