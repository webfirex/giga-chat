"use client";

import { useEffect, useState } from "react";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePaymentPopupProps {
  imageId: string;
  price: number;
  onClose: () => void;
  onSuccess: () => void; // called after successful payment
}

const ImagePaymentPopup = ({
  imageId,
  price,
  onClose,
  onSuccess,
}: ImagePaymentPopupProps) => {
  const [amount] = useState<number>(price);

  const handlePay = async () => {
    const windowName = `payu_image_${Date.now()}`;
    const paymentWindow = window.open(
      "about:blank",
      windowName,
      "width=500,height=700"
    );

    if (!paymentWindow) {
      alert("Please allow pop-ups");
      return;
    }

    paymentWindow.document.write(`
      <html>
        <head><title>Redirecting to PayU...</title></head>
        <body style="display:flex;align-items:center;justify-content:center;font-family:sans-serif">
          <h3>Redirecting to payment gateway…</h3>
        </body>
      </html>
    `);

    try {
      const res = await fetch("/api/image-payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          amount,
        }),
      });

      if (!res.ok) throw new Error("Image payment init failed");

      const { action, payload } = await res.json();

      // persist context
      localStorage.setItem("LAST_IMAGE_TXNID", payload.txnid);
      localStorage.setItem("LAST_IMAGE_ID", imageId);
      localStorage.setItem("LAST_IMAGE_AMOUNT", String(amount));

      const form = document.createElement("form");
      form.method = "POST";
      form.action = action;
      form.target = windowName;

      Object.entries(payload).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (err) {
      console.error(err);
      paymentWindow.close();
    }
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "PAYU_PAYMENT_COMPLETED") {
        if (event.data.status === "SUCCESS") {
          onSuccess();
          onClose();
        }

        localStorage.removeItem("LAST_IMAGE_TXNID");
        localStorage.removeItem("LAST_IMAGE_ID");
        localStorage.removeItem("LAST_IMAGE_AMOUNT");
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSuccess, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-[90%] max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-amber-500">
            <Lock size={24} />
            <h2 className="text-xl font-bold text-white">Unlock Image</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount */}
        <div className="mb-8">
          <div className="bg-black/40 border border-white/10 rounded-lg py-4 text-center">
            <span className="text-3xl font-bold text-white">₹{amount}</span>
          </div>
        </div>

        {/* Action */}
        <Button
          onClick={handlePay}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white py-6 text-lg font-bold rounded-lg shadow-lg shadow-amber-900/20"
        >
          Pay & Unlock
        </Button>
      </div>
    </div>
  );
};

export default ImagePaymentPopup;
