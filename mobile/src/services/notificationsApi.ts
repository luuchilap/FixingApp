import api from './api';

export interface Notification {
  id: number;
  userId: number;
  content: string;
  isRead: boolean;
  createdAt: number;
}

/**
 * Get user's notifications
 */
export const getNotifications = async (unreadOnly?: boolean): Promise<Notification[]> => {
  const params = unreadOnly ? { unreadOnly: 'true' } : {};
  const response = await api.get<Notification[]>('/notifications', { params });
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  // Get all unread notifications and mark them as read
  const unreadNotifications = await getNotifications(true);
  await Promise.all(
    unreadNotifications.map((notif) => markNotificationAsRead(notif.id))
  );
};

