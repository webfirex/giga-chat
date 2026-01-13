'use client'

import { useEffect, useRef, useState } from "react";

const EMOJIS = ["😀", "😂", "🥲", "😍", "😎", "🤔", "🔥", "💀", "🚀", "❤️"];

type Message = {
    id: number;
    sender: "me" | "them";
    text: string;
};

export default function ChatUI() {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: "them", text: "hey 👋" },
    ]);
    const [input, setInput] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    // auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim()) return;
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), sender: "me", text: input },
        ]);
        setInput("");
    };

    return (
        <div className="h-screen w-full bg-[#0b0f1a] text-white flex">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0f1424] border-r border-white/5 flex flex-col">
                <div className="p-4 text-xl font-semibold tracking-wide">
                    Spark<span className="text-indigo-400">Chat</span>
                </div>

                <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                    No chats yet
                </div>

                {/* User footer */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                            A
                        </div>
                        <div>
                            <p className="text-sm font-medium">associate</p>
                            <p className="text-xs text-white/40">online</p>
                        </div>
                    </div>
                    <button className="text-white/40 hover:text-white">⚙️</button>
                </div>
            </aside>

            {/* Main chat */}
            <main className="flex-1 flex flex-col">
                {/* Top bar */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0e1326]">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-pink-500 flex items-center justify-center font-bold">
                            R
                        </div>
                        <span className="font-medium">@reciever</span>
                    </div>

                    <div className="flex items-center gap-4 text-white/60">
                        🔔
                        <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                            A
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {messages.map((m, i) => (
                        <div
                            key={m.id}
                            className={`max-w-[60%] flex
                `}
                        >
                            <div className={`
    max-w-[80%]            /* Usually better to cap at 70-80% for chat feel */
    w-fit                  /* Ensures the bubble only takes as much space as needed */
    break-words 
    py-2 px-4 
    rounded-2xl 
    ${m.sender === "me" ? "bg-indigo-600" : "bg-white/10"}
`}>
    {m.text}
</div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="border-t border-white/5 p-4 bg-[#0e1326]">
                    <div className="flex items-center gap-3 relative">
                        {/* Exit / Start */}
                        <button className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20">
                            Exit
                        </button>
                        <button className="px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500">
                            Start
                        </button>

                        {/* Input */}
                        <div className="flex-1 relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                placeholder="Send a message..."
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-xl px-4 py-3 pr-12 outline-none focus:border-indigo-500"
                            />

                            {/* Emoji button */}
                            <button
                                onClick={() => setShowEmoji((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                            >
                                🙂
                            </button>

                            {/* Emoji picker */}
                            {showEmoji && (
                                <div className="absolute bottom-14 right-0 bg-[#111735] border border-white/10 rounded-xl p-3 grid grid-cols-5 gap-2 shadow-xl">
                                    {EMOJIS.map((e) => (
                                        <button
                                            key={e}
                                            onClick={() => {
                                                setInput((prev) => prev + e);
                                                setShowEmoji(false);
                                            }}
                                            className="text-lg hover:scale-125 transition"
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Send */}
                        <button
                            onClick={sendMessage}
                            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}