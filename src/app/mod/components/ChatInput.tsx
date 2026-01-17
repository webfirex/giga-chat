"use client";

import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { ArrowBigRight, ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  connected: boolean;
  onSend: (text: string) => void;
  onTyping: () => void;
  onImageSend: (imageUrl:string) => void;
}

export default function ChatInput({
  connected,
  onSend,
  onTyping,
  onImageSend
}: Props) {
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const handleBlur = async (file:File): Promise<string> => {
    // e.preventDefault();
    if (!file) return"error";

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/blur", {
      method: "POST",
      body: formData,
    });

    const hostedUrl = await uploadImageToDB(file);

    if (!res.ok) {
      notifications.show({
        title: 'Error',
        message: 'Failed to blur the image',
        color: 'red',
        icon: <IconX size={16} />
      });
      return"error";
    }

    const blob = await res.blob();
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl
  };

  const uploadImageToDB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    // Replace this with your actual endpoint (e.g., Cloudinary, S3, or local API)
    const response = await fetch("/api/mod/upload-image", {
      method: "POST",
      body: formData,
    });
 
    const data = await response.json();
    if (!data.success){ 
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
      const image = await handleBlur(file)

      if(image!=="error")
      onImageSend(image);
  
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
  

  return (
    <div className="border-t border-white/5 p-4 bg-[#0e1326]">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!connected}
          placeholder="Reply to user..."
          className="flex-1 bg-[#0b0f1a] border border-white/10 rounded-xl px-4 py-3 outline-none disabled:opacity-40"
        />
        <div className="relative">
                <button
                  type="button"
                  disabled={isUploading || !connected}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-white/70" />
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

        <button
          onClick={handleSend}
          disabled={!connected}
          className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
        >
          <ArrowBigRight />
        </button>
      </div>
    </div>
  );
}
