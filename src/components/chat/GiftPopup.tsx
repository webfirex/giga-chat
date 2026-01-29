"use client";

import { useState, useEffect } from "react";
import { LucideGift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { notifications } from "@mantine/notifications";

const TXN_KEY = "payu_txnid";

const GiftPopup = ({
  onClose,
  sendGift,
}: {
  onClose: () => void;
  sendGift: (amount: number) => void;
}) => {
  const [amount, setAmount] = useState<number>(100);
  const [activeTxnid, setActiveTxnid] = useState<string | null>(null);

  // 🔁 Resume polling if app/page reopened
  useEffect(() => {
    const storedTxnid = localStorage.getItem(TXN_KEY);
    if (storedTxnid) {
      setActiveTxnid(storedTxnid);
    }
  }, []);

  const handleSend = async () => {
    const windowName = `payu_payment_${Date.now()}`;
    const paymentWindow = window.open(
      "about:blank",
      windowName,
      "width=500,height=700"
    );

    if (!paymentWindow) {
      notifications.show({
        title: "Popup blocked",
        message: "Please allow pop-ups to continue payment.",
        color: "red",
      });
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
      const res = await fetch("/api/gift/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) throw new Error("Payment init failed");

      const { txnid, action, payload } = await res.json();

      // ✅ persist + trigger polling
      localStorage.setItem(TXN_KEY, txnid);
      localStorage.setItem("LAST_GIFT_AMOUNT", String(amount));
      setActiveTxnid(txnid);

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

      notifications.show({
        title: "Payment failed",
        message: "Unable to start gift payment. Please try again.",
        color: "red",
      });
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

          const amt = Number(localStorage.getItem("LAST_GIFT_AMOUNT"));
          sendGift(amt);

          notifications.show({
            title: "Gift sent 🎁",
            message: "Your gift was sent successfully.",
            color: "green",
          });

          localStorage.removeItem(TXN_KEY);
          localStorage.removeItem("LAST_GIFT_AMOUNT");
          setActiveTxnid(null);

          onClose();
        }

        if (data.status === "FAILED") {
          clearInterval(interval);

          notifications.show({
            title: "Payment failed",
            message: "Gift payment failed. If money was deducted, it will be refunded.",
            color: "red",
          });

          localStorage.removeItem(TXN_KEY);
          localStorage.removeItem("LAST_GIFT_AMOUNT");
          setActiveTxnid(null);
        }

        // ⏱ stop after ~1 minute
        if (attempts > 30) {
          clearInterval(interval);
          setActiveTxnid(null);
        }
      } catch (err) {
        console.error("Gift status check failed", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTxnid, sendGift, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-[90%] max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-amber-500">
            <LucideGift size={24} />
            <h2 className="text-xl font-bold text-white">Send a Gift</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-8">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
              ₹
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(Math.min(50000, Math.max(10, Number(e.target.value))))
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white text-2xl font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <Slider
            value={[amount]}
            min={10}
            max={50000}
            step={10}
            onValueChange={(vals) => setAmount(vals[0])}
          />

          <Button
            onClick={handleSend}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-6 text-lg font-bold rounded-lg"
          >
            Send Gift
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GiftPopup;
