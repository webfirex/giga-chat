"use client";

import { ArrowBigRight, Video, LucideGift, ImageIcon, Loader2, Send, SendToBack, SendHorizonalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmojiInput from "@/components/ui/emoji-input";
import { usePlan } from "@/contexts/PlanContext";
import { useEffect, useRef, useState } from "react";
import { ExitButton } from "./ExitButton";
import { NextButton } from "./NextButtons";
import GiftPopup from "./GiftPopup";
import ImageInput from "../ui/image-input";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";

interface ChatControlsProps {
  input: string;
  connected: boolean;
  searchingText: string | null;
  onInputChange: (val: string) => void;
  onSendMessage: () => void;
  onNext: () => void;
  onChatStart: () => void;
  onExit: () => void;
  onExit2: () => void;
  onSendImage: (imageUrl: string) => Promise<void>
  onSendGift: (amount: number, currency: "INR", giftId?: string) => void
}

export default function ChatControls({
  input,
  connected,
  searchingText,
  onInputChange,
  onSendMessage,
  onNext,
  onChatStart,
  onExit,
  onExit2,
  onSendImage,
  onSendGift
}: ChatControlsProps) {
  const { state } = usePlan();

  // Per-message cooldown (seconds)
  const [cooldown, setCooldown] = useState(0);
  const [showGift, setShowGift] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  // Send handler with cooldown logic
  const handleSend = () => {
    if (!connected) return;

    // Block if cooldown active (except unlimited)
    if (state?.chat_timer !== 0 && cooldown > 0) return;

    onSendMessage();

    // Start cooldown AFTER sending
    if (state?.chat_timer && state.chat_timer > 0) {
      setCooldown(state.chat_timer);
    }
  };

  const uploadImageToDB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    // Replace this with your actual endpoint (e.g., Cloudinary, S3, or local API)
    const response = await fetch("/api/user/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      console.log("MESSAGE IMAGE BB", data)
      throw new Error("Upload failed");
    }

    return data.imageUrl; // The hosted link returned by your DB/Storage
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notifications.show({
        title: 'Invalid File',
        message: 'Please select an image file.',
        color: 'red',
        icon: <IconX size={16} />
      });
      return;
    }

    try {
      setIsUploading(true);

      const hostedUrl = await uploadImageToDB(file);
      // const hostedUrl = URL.createObjectURL(file);

      await onSendImage(hostedUrl);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      notifications.show({
        title: 'Upload Failed',
        message: 'Failed to upload image.',
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setIsUploading(false);
    }
  };


  const handleSendGift = (amount: number) => {
    console.log("Gifting amount:", amount);
    onSendGift(amount, "INR")
    // Your socket logic here: socket.emit("gift:send", { amount });
  };

  return (
    <div className="border-t relative border-white/5 px-2 pb-4 bg-[#0e1326]">
      {/* Top Bar */}
      {connected && (
        <div className="absolute rounded-sm -top-17 flex justify-between items-center w-[95%] left-3 h-20 px-4">
          <div className="flex gap-4">

            <Button
              onClick={onExit}
              disabled={searchingText !== null}
              className="bg-indigo-600 text-md font-semibold hover:bg-indigo-500 px-8 py-4 rounded-sm"
            >
              Esc
            </Button>
            <Button
              onClick={onNext}
              disabled={
                searchingText !== null
              }              
              className="bg-[#202020] text-md font-semibold hover:bg-indigo-500 px-8 py-4"
            >
              Skip
            </Button>
          </div>
          <div>
            {showGift && (
              <GiftPopup
                onClose={() => setShowGift(false)}
                sendGift={handleSendGift}
              />
            )}
            <Button
              onClick={() => setShowGift(true)}
              disabled={searchingText !== null}
              className="bg-amber-600 hover:bg-amber-500"
            >
              <LucideGift
                className="h-24 w-24 text-white"
                strokeWidth={2.5}
              />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end mb-2">

        {/* Cooldown Indicator */}
        {connected && state?.chat_timer !== 0 && (
          <div className="text-xs text-white/40 font-mono text-right pt-1">
            Slow mode: {state?.chat_timer}s
          </div>
        )}
        {connected && state?.chat_timer === 0 && (
          <div className="text-xs text-indigo-400 font-mono pt-1">
            Unlimited
          </div>
        )}
      </div>

      {/* Input Area */}

      <div className="flex gap-2 items-center relative">
        {!connected && (
          <Button
            onClick={onChatStart}
            // disabled={searchingText !== null || (state?.chats_left && state?.chats_left <= 0)}
            disabled={
              searchingText !== null 
            }
            
            className="bg-indigo-600 absolute -top-17 w-full text-md font-semibold hover:bg-indigo-500 px-4 py-6"
          >
            {!searchingText ? (state?.chats_left&&state?.chats_left > 0 ?"Find New Friends": "Come Back Tomorrow") : "Searching..."}
          </Button>
        )}
        <div className="relative flex-1">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (cooldown === 0 || state?.chat_timer === 0) {
                  handleSend();
                }
              }
            }}
            disabled={!connected}
            placeholder={connected ? "Type a message..." : "Click Start"}
            rows={1}
            className="
              w-full resize-none
              bg-[#0b0f1a]
              border border-white/10 rounded-xl
              pl-4 py-3
              pr-16
              outline-none
              disabled:opacity-40
              overflow-y-auto overflow-x-hidden
              leading-relaxed mt-1
            "
          />

          {/* Feature buttons */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">

            {/* {state?.can_send_emojis && (
              <EmojiInput
                value={input}
                onChange={onInputChange}
                disabled={!connected}
              />
            )} */}
            {/* {state?.can_send_gifs && ( */}
              <div className="relative pb-2">
                <button
                  type="button"
                  disabled={isUploading || !connected || !state?.can_send_gifs}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg transition disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-white/70" />
                  )}
                </button>

                {/* HIDDEN FILE INPUT */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            {/* {state?.can_send_emojis && ( */}
              <EmojiInput
                value={input}
                onChange={onInputChange}
                disabled={!connected || !state?.can_send_gifs}
              />
          </div>
        </div>
        <div>
          {/* <ImageInput/> */}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={
            !connected ||
            (state?.chat_timer !== 0 && cooldown > 0)
          }
          className="py-3 px-3 mb-2 rounded-full bg-white/20 hover:bg-indigo-500 disabled:opacity-40 transition-colors"
        >
          {state?.chat_timer !== 0 && cooldown > 0 ? (
            <span className="text-sm font-mono">{cooldown}s</span>
          ) : (
            <SendHorizonalIcon className="h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
}
