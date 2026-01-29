import { useEffect, useRef, useState } from "react";
import IdleUI from "./IdleUI";
import { RandomUserProfile } from "@/hooks/useModChatSocket";
import ImagePaymentPopup from "./ImagePaymentPopup";


type Message = {
  id: number;
  sender: "mod" | "user";
  type: "text" | "image" | "gift";
  text?: string;
  imageUrl?: string; // actually imageId + price
  amount?: number;
  currency?: "USD" | "EUR" | "INR";
};

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  partnerProfile: RandomUserProfile | null;
  searchingText: string | null;
  seconds: number;
  connected: boolean;
  chatStatus: "active" | "partner_skipped" | "me_skipped" | "idle";
}

export default function MessageList({
  messages,
  isTyping,
  partnerProfile,
  searchingText,
  seconds,
  connected,
  chatStatus
}: MessageListProps) {

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [openImage, setOpenImage] = useState<string | null>(null);

  const [payImageId, setPayImageId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | null>(null);

  const [unlockedImages, setUnlockedImages] = useState<Set<string>>(new Set());
  const [imageReloadKey, setImageReloadKey] = useState<Record<string, number>>({});



  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, chatStatus]);

  const handleUnlockImage = (imageId: string, price: number) => {
    setPayImageId(imageId);
    setPayAmount(price);
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="flex-1 flex flex-col overflow-y-auto space-y-3 scrollbar-hide">
        {messages.length < 12 && <div className="flex-1 pt-50" />}

        {messages.map((m) => {
          const isMe = m.sender === "user";

          return (
            <div
              key={m.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              {/* TEXT */}
              {m.type === "text" && (
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] wrap-break-word ${isMe
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-white"
                    }`}
                >
                  {m.text}
                </div>
              )}

              {/* IMAGE */}
              {m.type === "image" && m.imageUrl && (() => {
                const { imageId, price } = parseImageText(m.imageUrl);
                if (!imageId) return null;

                const isLocked =
                  typeof price === "number" &&
                  !isMe &&
                  !unlockedImages.has(imageId);

                  const imageSrc = `/api/images/${imageId}${
                    imageReloadKey[imageId] ? `?t=${imageReloadKey[imageId]}` : ""
                  }`;
                  

                return (
                  <div
                    className={`
                      relative
                      w-64 max-w-[70%]
                      rounded-2xl overflow-hidden
                      border-2
                      ${isLocked
                        ? price && price > 0
                          ? "border border-amber-400 bg-amber-400/10"
                          : "border border-white/20"
                        : ""
                      }
                      
                      `}
                    onClick={() => {
                      if (!isLocked) setOpenImage(imageSrc);
                    }}
                  >
                    {/* IMAGE */}
                    <img
                      src={imageSrc}
                      alt="Shared image"
                      className={`w-full h-full object-cover block ${price}`}
                    />

                    {/* 🔒 LOCK OVERLAY */}
                    {isLocked && price>0 && (
                      <div
                        className="
                          absolute inset-0 z-10
                          flex items-center justify-center
                          bg-black/60
                        "
                      >
                        <button
                          onClick={() => { handleUnlockImage(imageId, price) }}
                          className="
                            flex flex-col items-center gap-2
                            cursor-pointer
                            px-4 py-3
                            rounded-xl
                            bg-amber-500/20
                            border border-amber-400
                            text-amber-300
                            hover:bg-amber-500/30
                            transition
                          "
                        >
                          <span className="text-3xl">🔒</span>
                          <span className="text-sm font-semibold">
                            Unlock for ₹{price}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}



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

        <div ref={bottomRef} />
      </div>

      <div className="text-center text-white/50 pt-4 mb-14">
        {searchingText !== null ? (
          <>
            <span className="animate-pulse">
              Finding someone... {seconds}s
            </span>
            <br />
            <span>
              {seconds > 30 && "Too slow?.. Get Premium for faster matches"}
            </span>
          </>
        ) : (
          !connected &&
          chatStatus === "idle" && <IdleUI chatStatus={chatStatus} />
        )}

        {!connected &&
          (chatStatus === "partner_skipped" ||
            chatStatus === "me_skipped") && (
            <IdleUI chatStatus={chatStatus} />
          )}

        {isTyping && chatStatus === "active" && (
          <p className="text-xs text-white/40 animate-pulse">
            {partnerProfile?.name || "Partner"} is typing...
          </p>
        )}
      </div>

      {/* IMAGE MODAL */}
      {openImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setOpenImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={openImage}
              alt="Full view"
              className="max-w-full max-h-[85vh] rounded-xl"
            />

            <button
              onClick={() => setOpenImage(null)}
              className="absolute top-2 right-2 bg-red-800/70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {payImageId && payAmount !== null && (
        <ImagePaymentPopup
          imageId={payImageId}
          price={payAmount}
          onClose={() => {
            setPayImageId(null);
            setPayAmount(null);
          }}
          onSuccess={() => {
            setUnlockedImages(prev => {
              const next = new Set(prev);
              next.add(payImageId!);
              return next;
            });
          
            setImageReloadKey(prev => ({
              ...prev,
              [payImageId!]: Date.now(),
            }));
          
            setPayImageId(null);
            setPayAmount(null);
          }}
          

        />
      )}

    </div>
  );
}

const IMAGE_PRICE_MARKER = " + imagePrice=";

function parseImageText(text?: string) {
  if (!text) return { imageId: undefined, price: undefined };

  if (text.includes(IMAGE_PRICE_MARKER)) {
    const [imageId, priceStr] = text.split(IMAGE_PRICE_MARKER);
    return {
      imageId,
      price: Number(priceStr),
    };
  }

  return { imageId: text, price: undefined };
}
