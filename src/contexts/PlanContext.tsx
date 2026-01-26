"use client";

import { useSession } from "next-auth/react";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

interface PlanLimitations {
  planName: "Free" | "Basic" | "Premium";
  pfp_edit: boolean;
  name_edit: boolean;
  can_send_gifs: boolean;
  can_send_videos: boolean;
  can_send_emojis: boolean;
  chat_cooldown: number;
  chats_left: number;
  chat_timer: number;
  max_friend_req: number;
  min_match_time: number;
  gender_filter:"male" | "female" | "random"
}

interface PlanContextType {
  state: PlanLimitations | null;
  loading: boolean;
  getSearchCooldown: () => number;
  refreshPlan: () => Promise<void>;
  decreaseChat: () => Promise<boolean>;
  clearPlan: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const STORAGE_KEY = "user_plan_v3";

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlanLimitations | null>(null);
  const [loading, setLoading] = useState(true);
  const {data} = useSession()

  /**
   * Clears plan data from state + session storage
   * Call this on logout
   */
  const clearPlan = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(null);
  }, []);

  /**
   * Fetch fresh plan from server
   */
  const fetchUserPlan = useCallback(async () => {
    console.log("USER LOGGED IN")
    setLoading(true);
    try {
      const response = await fetch("/api/user/plan-details");
      const data = await response.json();

      if (data.success) {
        const planData: PlanLimitations = {
          planName: data.planName,
          pfp_edit: data.limitations.pfp_edit,
          name_edit: data.limitations.name_edit,
          can_send_gifs: data.limitations.can_send_gifs,
          can_send_videos: data.limitations.can_send_videos,
          can_send_emojis: data.limitations.can_send_emojis,
          chat_cooldown: data.limitations.chat_cooldown,
          chats_left: data.limitations.chats_left,
          chat_timer: data.limitations.chat_timer,
          // chat_timer: 0,
          max_friend_req: data.limitations.max_friend_req,
          min_match_time: data.limitations.min_match_time ?? 0,
          gender_filter: data.limitations.gender_filter
        };

        setState(planData);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(planData));
      } else {
        clearPlan();
      }
    } catch (error) {
      console.error("Plan Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [clearPlan]);

  /**
   * Used by search logic
   */
  const getSearchCooldown = useCallback(() => {
    if (!state) return 5000;
    const base = state.min_match_time * 1000;
    const randomOffset =
      (Math.floor(Math.random() * (20 - 2 + 1)) + 2) * 1000;
    return base + randomOffset;
  }, [state]);

  /**
   * Optimistic chat decrement
   */
  const decreaseChat = useCallback(async () => {
    if (!state || state.chats_left <= 0) return false;
    
    if(state.planName == "Premium") return false

    setState((prev) =>
      prev ? { ...prev, chats_left: Math.max(prev.chats_left - 1, 0) } : prev
    );

    try {
      const res = await fetch("/api/user", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        // throw new Error("Failed to decrease chat");
        console.error("Chat decrease failed:");
      }

      const updatedState = state
        ? { ...state, chats_left: data.chats_left }
        : null;

      if (updatedState) {
        setState(updatedState);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      }

      console.log("CHAT DECREASED")
      return true;
    } catch (error) {
      console.error("Chat decrease failed:", error);

      // rollback
      setState((prev) =>
        prev ? { ...prev, chats_left: prev.chats_left + 1 } : prev
      );

      return false;
    }
  }, [state]);

  /**
   * Initial load:
   * - restore from sessionStorage if present
   * - otherwise fetch fresh (login case)
   */
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    // console.log(object)

    if (saved) {
      try {
        setState(JSON.parse(saved));
        setLoading(false);
      } catch {
        fetchUserPlan();
      }
    } else {
      fetchUserPlan();
    }
  }, [fetchUserPlan, data]);

  return (
    <PlanContext.Provider
      value={{
        state,
        loading,
        getSearchCooldown,
        refreshPlan: fetchUserPlan,
        decreaseChat,
        clearPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within PlanProvider");
  }
  return context;
};
