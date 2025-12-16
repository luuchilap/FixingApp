"use client";

import { useEffect, useState } from "react";
import { fetchNotifications, markNotificationRead } from "../api/notifications";
import type { AppNotification } from "../types/notifications";

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await fetchNotifications();
        setNotifications(list);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function markAsRead(id: number) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await markNotificationRead(id);
    } catch {
      // ignore failures silently for now
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading, markAsRead };
}


