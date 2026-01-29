"use client";

import { useEffect, useState } from "react";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifications } from "@mantine/notifications";

interface ImagePaymentPopupProps {
  imageId: string;
  price: number;
  onClose: () => void;
  onSuccess: () => void;
}

const TXN_KEY = "payu_txnid";

const ImagePaymentPopup = ({
  imageId,
  price,
  onClose,
  onSuccess,
}: ImagePaymentPopupProps) => {
  const [amount] = useState<number>(price);
  const [activeTxnid, setActiveTxnid] = useState<string | null>(null);


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
        body: JSON.stringify({ imageId, amount }),
      });

      if (!res.ok) throw new Error("Image payment init failed");

      const { txnid, action, payload } = await res.json();

      // ✅ persist txnid + context
      localStorage.setItem(TXN_KEY, txnid);
      setActiveTxnid(txnid);
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

  // ✅ POLL STATUS API (WEBHOOK SOURCE OF TRUTH)
  useEffect(() => {
    if (!activeTxnid) return;
  
    let attempts = 0;
  
    const interval = setInterval(async () => {
      attempts++;
  
      try {
        const res = await fetch(`/api/payu/status?txnid=${activeTxnid}`);
        const data = await res.json();
  
        if (data.status === "SUCCESS") {
          clearInterval(interval);
  
          onSuccess();
          onClose();
  
          localStorage.removeItem(TXN_KEY);
          localStorage.removeItem("LAST_IMAGE_ID");
          localStorage.removeItem("LAST_IMAGE_AMOUNT");
  
          setActiveTxnid(null);
        }
  
        if (data.status === "FAILED") {
          clearInterval(interval);
  
          notifications.show({
            title:"Error!",
            message:"Image payment failed",
            color:"red"
          })
  
          localStorage.removeItem(TXN_KEY);
          localStorage.removeItem("LAST_IMAGE_ID");
          localStorage.removeItem("LAST_IMAGE_AMOUNT");
  
          setActiveTxnid(null);
        }
  
        if (attempts > 30) {
          clearInterval(interval);
          setActiveTxnid(null);
        }
      } catch (err) {
        console.error("Image payment status check failed", err);
      }
    }, 2000);
  
    return () => clearInterval(interval);
  }, [activeTxnid, onSuccess, onClose]);

  useEffect(() => {
    const storedTxnid = localStorage.getItem(TXN_KEY);
    if (storedTxnid) {
      setActiveTxnid(storedTxnid);
    }
  }, []);
  
  

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
