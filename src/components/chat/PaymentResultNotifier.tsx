'use client';

import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlan } from "@/contexts/PlanContext";

const TXN_KEY = "payu_txnid";

export function PaymentResultNotifier() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshPlan } = usePlan();

  useEffect(() => {
    // 1️⃣ Get txnid from URL or localStorage
    const urlTxnid = searchParams?.get("txnid");
    const storedTxnid =
      urlTxnid
        ? urlTxnid
        : localStorage.getItem(TXN_KEY);

    const txnid = urlTxnid || storedTxnid;

    if (!txnid) return;

    // Always persist latest txnid
    localStorage.setItem(TXN_KEY, txnid);

    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch(`/api/payu/status?txnid=${txnid}`);
        const data = await res.json();

        if (data.status === "SUCCESS") {
          clearInterval(interval);
          localStorage.removeItem(TXN_KEY);

          notifications.show({
            title: "Payment successful 🎉",
            message: "Your plan has been upgraded.",
            color: "green",
          });

          refreshPlan();
          router.replace("/chat");
        }

        if (data.status === "FAILED") {
          clearInterval(interval);
          localStorage.removeItem(TXN_KEY);

          notifications.show({
            title: "Payment failed",
            message: "If money was deducted, it will be refunded automatically.",
            color: "red",
          });

          router.replace("/chat");
        }

        // ⏱ stop polling after ~1 min
        if (attempts > 30) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Payment status poll failed", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [searchParams, refreshPlan, router]);

  return null;
}
