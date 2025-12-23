import { useState, useEffect, useCallback } from 'react';
import { getNotifications, Notification } from '../services/notificationsApi';
import { getTotalUnreadCount } from '../services/messagesApi';
import { setBadgeCount, clearBadge } from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const [notifs, messageCount] = await Promise.all([
        getNotifications(),
        getTotalUnreadCount().catch(() => 0),
      ]);

      setNotifications(notifs);
      setMessageUnreadCount(messageCount);

      const unreadNotifs = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(unreadNotifs);

      // Update badge count
      const totalUnread = unreadNotifs + messageCount;
      if (totalUnread > 0) {
        await setBadgeCount(totalUnread);
      } else {
        await clearBadge();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
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

