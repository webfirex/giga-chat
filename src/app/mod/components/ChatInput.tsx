"use client";

import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import { ArrowBigRight, ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  connected: boolean;
  onSend: (text: string) => void;
  onTyping: () => void;
  onImageSend: (imageId: string, price?: number) => void;
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

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [price, setPrice] = useState<number | "">("");
  const [imageId, setImageId] = useState<string | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const uploadImageToDB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/mod/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success || !data.imageId) {
      throw new Error("Upload failed");
    }

    return data.imageId;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notifications.show({
        title: "Invalid File",
        message: "Please select an image file.",
        color: "red",
        icon: <IconX size={16} />,
      });
      return;
    }

    try {
      setIsUploading(true);

      const id = await uploadImageToDB(file);

      setSelectedImage(file);
      setImageId(id);
      setPrice("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      notifications.show({
        title: "Upload Failed",
        message: "Failed to upload image.",
        color: "red",
        icon: <IconX size={16} />,
      });
    } finally {
      setIsUploading(false);
    }
  };
  const IMAGE_PRICE_MARKER = " + imagePrice=";

  const sendImageWithPrice = () => {
    if (!imageId || price === "") return;
  
    // concatenate imageId + price into a single string
    onImageSend(`${imageId}${IMAGE_PRICE_MARKER}${price}`);
  
    // cleanup
    setSelectedImage(null);
    setImageId(null);
    setPrice("");
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

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {selectedImage && (
            <div className="absolute -top-full -left-20 mt-2 w-32">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={price}
                autoFocus
                onChange={(e) =>
                  setPrice(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendImageWithPrice();
                  }
                }}
                onBlur={sendImageWithPrice}
                className="w-full rounded-lg bg-black/60 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
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
