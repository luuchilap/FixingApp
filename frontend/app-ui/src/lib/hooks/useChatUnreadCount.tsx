"use client";

import { useEffect, useState } from "react";
import { getTotalUnreadCount } from "../api/chat";
import { useAuth } from "./useAuth";

export function useChatUnreadCount(): number {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only fetch if user is logged in and is EMPLOYER or WORKER
    if (!user || (user.role !== "EMPLOYER" && user.role !== "WORKER")) {
      setUnreadCount(0);
      return;
    }

    async function load() {
      try {
        const result = await getTotalUnreadCount();
        setUnreadCount(result.totalUnreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    }

    load();

    // Refresh every 10 seconds
    const interval = setInterval(load, 10000);

    return () => clearInterval(interval);
  }, [user]);

  return unreadCount;
}

