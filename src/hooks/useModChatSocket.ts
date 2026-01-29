"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket/socket-mod";
import { generateRandomUser } from "@/lib/utils";
import { notifications } from "@mantine/notifications";
import { openConfirmModal } from "@mantine/modals";
import { Text } from "@mantine/core";


export type Message = {
  id: number;
  sender: "mod" | "user";
  type: "text" | "image" | "gift";
  text?: string;
  imageUrl?: string;
  amount?: number;
  currency?: "USD" | "EUR" | "INR";
};

export type RandomUserProfile = {
  name: string;
  username: string;
  avatarUrl: string;
  age: number;
  city: string;
};

export type UserDetails = {
  username: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  interests: string[];
  city: string | null;
  state: string | null;
  age: number;
  avatarUrl: string | null;
  totalGiftAmount: number;
  totalImageAmount: number;
  planName: string | null;
  genderMatch: "male" | "female" | "random" | null,
};


type ModChat = {
  roomId: string;
  userId: string;
  userPlan: "Free" | "Basic" | "Premium";
  userProfile: RandomUserProfile;
  userDetails?: UserDetails;
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
    // console.log("MOD SOCKET", socket)
    socket.emit("mod:online", { modName });

    socket.on("friend:request-received", ({roomId}) =>{
      openConfirmModal({
        title:"Friend Request",
        labels:{confirm:"Accept", cancel:"Ignore"},
        onConfirm: async()=>{

          socket.emit("friend:request:accepted")
        }
      })
    })

    socket.on("friend:request:accepted", ({ friendId }) => {
      // alert("Friend request accepted 🎉");
      notifications.show({
        title:"Friend Added",
        message:"Friend request accepted 🎉",
        color:"green"
      })
    
      // ✅ ADD FRIEND (OTHER SIDE)
      // await fetch("/api/friends/add", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ friendId }),
      // });
    });

    // 🔗 CONNECTED TO USER
    socket.on("mod:new-chat", async ({ roomId, userId, userGenderSelected }) => {


      let userDetails: UserDetails;

      try {
        const res = await fetch("/api/mod/get-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (res.ok) {
          const data = await res.json();
          userDetails = data.user;
        } else {
          console.error("Failed to fetch user details");
          userDetails = {
            username: "",
            firstName: "",
            lastName: "",
            interests: [],
            city:"",
            state:"",
            avatarUrl:"",
            planName:"",
            age: 18,
            gender:"",
            genderMatch:"random",
            totalGiftAmount: 0,
            totalImageAmount: 0,
          };
        }
      } catch (err) {
        console.error("USER FETCH ERROR:", err);
        userDetails = {
          username: "",
          firstName: "",
          lastName: "",
          interests: [],
          city:"",
          state:"",
          avatarUrl:"",
          planName:"",
          age: 18,
          gender:"",
          genderMatch:"random",
          totalImageAmount: 0,
          totalGiftAmount: 0
        };
      }

      const userProfile = await generateRandomUser(userDetails.genderMatch ==="random"?"male": (userDetails.genderMatch?? "male") );
      // 🧠 Create chat WITH userDetails
      setChats((prev) => [
        ...prev,
        {
          roomId,
          userId,
          userPlan: userGenderSelected,
          userProfile,   // random profile
          userDetails,   // real DB user (may be null initially)
          messages: [],
        },
      ]);
      socket.emit("chat:send-user-profile", {
        roomId,
        userProfile,
      });



      // 🧭 Auto-select first chat
      setActiveRoomId((prev) => prev ?? roomId);
    });


    // 📩 RECEIVE MESSAGE FROM USER
    socket.on("chat:message", (msg) => {
      console.log("MESSAGE RECIEVED", msg)
      if (msg.sender == "mod") return
      setChats((prev) =>
        prev.map((chat) =>
          chat.roomId === msg.roomId
            ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: msg.id,
                  sender: "user",
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
      console.log("GIFT RECIEVED", msg)
      setChats((prev) =>
        prev.map((chat) =>
          chat.roomId === msg.roomId
            ? {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  id: msg.id,
                  sender: "user",
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
      fetch('/api/gift/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg })
      })
    });
    

    // ✍️ TYPING INDICATORS
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop:typing", () => setIsTyping(false));

    // CHAT ENDED
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
                sender: "mod",
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

    console.log("MESSAGE SENT BY MOD", { activeRoomId, text })

    socketRef.current.emit("stop:typing");
  };

  // ✍️ HANDLE TYPING
  const handleTyping = () => {
    socketRef.current.emit("typing", { roomId: activeRoomId });

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
                sender: "mod",
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

  const sendFriendRequest = (roomId: string) => {
    const socket = socketRef.current;
  
    socket.emit("friend:request", {
      roomId,
    });
  };
  

  


  return {
    chats,
    activeRoomId,
    setActiveRoomId,
    activeMessages: chats.find(c => c.roomId === activeRoomId)?.messages ?? [],
    isTyping,
    sendMessage,
    handleTyping,
    exitChat,
    sendImageMessage,
    sendFriendRequest
  };

}
