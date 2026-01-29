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
import { useSession } from "next-auth/react";
import { RandomUserProfile } from "@/hooks/useModChatSocket";
// import { Mystery_Quest } from "next/font/google";
// import { PayUVerifier } from "@/components/chat/PayuVerify";
import { PaymentResultNotifier } from "@/components/chat/PaymentResultNotifier";

type Message = {
  id: number;
  sender: "mod" | "user";
  type: "text" | "image" | "gift";
  text?: string;
  imageUrl?: string;
  amount?: number;
  currency?: "USD" | "EUR" | "INR";
};


export default function UserChatPage() {
  const { data: session, status } = useSession();
  const { state, loading, decreaseChat } = usePlan()

  const socketRef = useRef(getSocket(session?.user.id, state?.gender_filter));
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  // const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<RandomUserProfile | null>(null);

  const [myroomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [searchingText, setSearchingText] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(1);
  const [chatStatus, setChatStatus] = useState<"idle" | "active" | "partner_skipped" | "me_skipped">('idle')


  const [userEnded, setUserEnded] = useState(false)

  const noChatsLeft =
    connected &&
    state?.chats_left !== undefined &&
    state.chats_left <= 0;


  useEffect(() => {

    const socket = socketRef.current;

    socket.on("match:searching", (delay: number) => setSearchingText(`Searching...`));

    const onConnected = ({ roomId, username }: { roomId: string, username: string }) => {
      console.log("HEELOO CONNECTED");

      setRoomId(roomId);
      roomIdRef.current = roomId;
      setMessages([]);
      setConnected(true);
      setSearchingText(null);

      decreaseChat();

      socket.emit("user:identify", {
        roomId,
        username,
      });
    };
    socket.on("chat:connected", onConnected);
    // socket.on("chat:connected", ({ roomId, username }) => {
    //   setRoomId(roomId);
    //   roomIdRef.current = roomId;
    //   setMessages([]);
    //   setConnected(true);
    //   console.log("HEELOO CONNECTED")
    //   setSearchingText(null);
    //   if(state?.chats_left){
    //     console.log("CHATTT")
    //     if (!loading && state?.chats_left > 0) {
    //       console.log("DECREASED")
    //       decreaseChat();
    //     }
    //   }
    //   else{
    //     console.log("DID NOT DECREASED")
    //   }
    //   console.log("DID NOT DECREASED")

    //   socket.emit("user:identify", {
    //     roomId,
    //     username,
    //   });
    // });


    socket.on("friend:request-received", async ({ roomId }) => {

      const accepted = window.confirm("You received a friend request. Accept?");

      if (!accepted) return;

      if (!partnerProfile) return;


      const res = await fetch("/api/user/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: partnerProfile.username,
          fullName: partnerProfile.name,
          avatarUrl: partnerProfile.avatarUrl,
          city: partnerProfile.city
        })
      });

      if (!res.ok) return;
      socket.emit("friend:request:accepted", { roomId: roomIdRef.current });
    });

    socket.on("friend:request:accepted", async({ friendId }) => {

      if (!partnerProfile) return;

      const res = await fetch("/api/user/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: partnerProfile.username,
          fullName: partnerProfile.name,
          avatarUrl: partnerProfile.avatarUrl,
          city: partnerProfile.city
        })
      });

      if (!res.ok) return;
      notifications.show({
        title: "Friend Added",
        message: "Friend request accepted 🎉",
        color: "green"
      })
    });




    socket.on("chat:user-profile", ({ roomId, userProfile }) => {
      if (roomId !== roomIdRef.current) return;
      setPartnerProfile(userProfile);
    });


    socket.on("chat:message", (msg) => {
      // console.log("ROOM ID MISSING", msg, myroomId)
      if (msg.roomId !== roomIdRef.current || msg.sender == "user") {
        // console.log("MESSAGE USER recieved",msg)
        return
      }
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id ?? Date.now(),
          sender: "mod",
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
      // setPartnerName(null);
      setPartnerProfile(null);
      if (!userEnded) setChatStatus("partner_skipped")
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
    if (!state?.can_send_emojis) {
      const filter = removeEmojis(input)

      if (filter != input) {
        notifications.show({
          title: 'Emojis Not Allowed',
          message: 'Upgrade plan to send emojis',
          icon: <IconX size={18} />,
          color: 'red',
        });
      }
      setInput(filter);
    }
    else {
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
      roomId: myroomId,
      type: "text",
      content: input,
    });

    // ✅ Optimistically add your own message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        type: "text",
        text: input,
      },
    ]);

    console.log("MESSAGE SENT - USER", myroomId)

    socketRef.current.emit("stop:typing");

    setInput("");
    // await decreaseChat();
  };

  const sendImageMessage = async (imageUrl: string) => {
    if (!imageUrl || !connected) return;
    if (noChatsLeft) return;

    socketRef.current.emit("chat:message", {
      roomId: myroomId,
      type: "image",
      content: imageUrl,
    });

    socketRef.current.emit("stop:typing");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        type: "image",
        imageUrl: imageUrl,
      },
    ]);
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
      roomId: myroomId
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "user",
        type: "gift",
        amount: amount,
        currency: currency,
      },
    ]);


  };

  const sendFriendRequest = () => {
    console.log("FREIND REQ SEND USER", myroomId)
    socketRef.current.emit("friend:request", { roomId: roomIdRef.current });
  };

  const notifyNoChatsLeft = () => {
    notifications.show({
      title: "No chats left",
      message: "You’ve reached your chat limit. Upgrade your plan to continue.",
      color: "red",
      autoClose: 4000,
    });
  };


  const nextChat = () => {
    if (!state || state.chats_left <= 0) {
      notifyNoChatsLeft();
      return;
    }

    setChatStatus("me_skipped");
    setMessages([]);
    setConnected(false);
    setPartnerProfile(null);
    setSearchingText("Searching...");

    const delay = (state.min_match_time ?? 0) * 1000;

    setTimeout(() => {
      if (socketRef.current) {
        if (myroomId) {
          socketRef.current.emit("chat:next", myroomId);
        }
        socketRef.current.emit("user:next");
      }
    }, delay);
  };


  const chatStart = () => {
    if (!state || state.chats_left <= 0) {
      notifyNoChatsLeft();
      return;
    }

    setMessages([]);
    setConnected(false);
    setPartnerProfile(null);
    setSearchingText("Searching...");

    const delay = (state.min_match_time ?? 0) * 1000;

    setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit("chat:next");
        socketRef.current.emit("user:next");
      }
    }, delay);
  };


  return (
    <div className="h-dvh max-w-125 mx-auto border-x border-white/20 bg-[#0b0f1a] text-white flex ">

      {/* Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <ChatHeader
          connected={connected}
          partnerProfile={partnerProfile}
          searchingText={searchingText || undefined}
          sendFriendRequest={sendFriendRequest}
        />

        <MessageList
          messages={messages}
          isTyping={isTyping}
          partnerProfile={partnerProfile}
          searchingText={searchingText}
          seconds={seconds}
          connected={connected}
          chatStatus={chatStatus}
        />

        <PaymentResultNotifier />

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
            socketRef.current.emit("chat:next", roomIdRef.current);
            socketRef.current.emit("match:cancel");
            setSearchingText(null);
            setConnected(false);
            setMessages([]);
            setPartnerProfile(null);
            setChatStatus("idle");
          }}
          onExit2={() => {
            socketRef.current.emit("chat:next", roomIdRef.current);
            setChatStatus("me_skipped")
            setUserEnded(true)
            setConnected(false);
            setMessages([]);
          }}
        />
      </div>
    </div>

  );
}