import { useState, useEffect, useCallback } from 'react';
import { getNotifications, Notification } from '../services/notificationsApi';
import { getConversations } from '../services/messagesApi';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const [notifs, conversations] = await Promise.all([
        getNotifications(),
        getConversations().catch(() => []),
      ]);

      setNotifications(notifs);
      
      // Calculate total unread messages from all conversations
      const totalMessageUnread = conversations.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      setMessageUnreadCount(totalMessageUnread);

      const unreadNotifs = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(unreadNotifs);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Poll for updates every 15 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    messageUnreadCount,
    totalUnreadCount: unreadCount + messageUnreadCount,
    loading,
    refresh: loadNotifications,
  };
};

