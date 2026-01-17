"use client";

import ModChatHeader from "../components/ModChatHeader";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";
import { useModChatSocket } from "@/hooks/useModChatSocket";
import RoomList from "../components/RoomList";

export default function ModChatPage() {
  const modName = "Moderator_" + Math.floor(Math.random() * 100);

  const {
    chats,
    activeRoomId,
    setActiveRoomId,
    activeMessages,
    isTyping,
    sendMessage,
    handleTyping,
    exitChat,
    sendImageMessage,
  } = useModChatSocket(modName);

  const activeChat = chats.find(
    (c) => c.roomId === activeRoomId
  );

  return (
    <div className="h-dvh bg-[#0b0f1a] text-white flex">
      {/* 🧭 SIDE PANEL */}
      <div className="w-64 border-r border-white/10 bg-[#0e1322]">
        <div className="p-3 font-semibold border-b border-white/10">
          Active Chats
        </div>

        {chats.map((chat) => (
          <div
            key={chat.roomId}
            onClick={() => setActiveRoomId(chat.roomId)}
            className={`p-3 cursor-pointer border-b border-white/5
              ${chat.roomId === activeRoomId
                ? "bg-[#1a2040]"
                : "hover:bg-[#141a33]"
              }`}
          >
            User {chat.userId.slice(0, 6)}
          </div>
        ))}

        {chats.length === 0 && (
          <div className="p-4 text-sm text-gray-400">
            No active chats
          </div>
        )}
      </div>

      {/* 💬 CHAT AREA */}
      <div className="flex flex-col flex-1">
        <ModChatHeader
          connected={!!activeRoomId}
          partner={
            activeChat
              ? { name: `User ${activeChat.userId.slice(0, 6)}` }
              : null
          }
          onNext={exitChat}
        />



        {/* <RoomList
          rooms={chats}
          activeRoomId={activeRoomId}
          onSelectRoom={setActiveRoomId}
        /> */}

        <MessageList
          messages={activeMessages}
          isTyping={isTyping}
          partnerName={
            activeChat ? `User ${activeChat.userId.slice(0, 6)}` : null
          }
        />


        <ChatInput
          connected={!!activeRoomId}
          onSend={sendMessage}
          onTyping={handleTyping}
          onImageSend={sendImageMessage}
        />
      </div>
    </div>
  );
}
