import api from './api';

export interface Notification {
  id: number;
  userId: number;
  content: string;
  isRead: boolean;
  createdAt: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedNotifications {
  data: Notification[];
  pagination: PaginationInfo;
}

/**
 * Get user's notifications with pagination
 */
export const getNotifications = async (params?: { unreadOnly?: boolean; page?: number; limit?: number }): Promise<Notification[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.unreadOnly) queryParams.unreadOnly = 'true';
  if (params?.page) queryParams.page = params.page.toString();
  if (params?.limit) queryParams.limit = params.limit.toString();
  
  const response = await api.get<PaginatedNotifications>('/notifications', { params: queryParams });
  return response.data.data;
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
  const unreadNotifications = await getNotifications({ unreadOnly: true, limit: 50 });
  await Promise.all(
    unreadNotifications.map((notif) => markNotificationAsRead(notif.id))
  );
};

