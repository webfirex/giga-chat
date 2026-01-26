'use client';

import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { useSearchParams } from "next/navigation";
import { usePlan } from "@/contexts/PlanContext";

export function PaymentResultNotifier() {
  const searchParams = useSearchParams();
  const { refreshPlan } = usePlan();

  useEffect(() => {
    const result = searchParams?.get("payment");

    if (!result) return;

    if (result === "success") {
      notifications.show({
        title: "Payment successful 🎉",
        message: "Your plan has been upgraded.",
        color: "green",
      });
      refreshPlan();
    }

    if (result === "failed") {
      notifications.show({
        title: "Payment failed",
        message: "If money was deducted, it will be refunded automatically.",
        color: "red",
      });
    }

    // clean URL
    window.history.replaceState({}, "", "/chat");
  }, [searchParams, refreshPlan]);

  return null;
}
