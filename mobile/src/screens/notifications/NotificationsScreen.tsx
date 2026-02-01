import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { NotificationCard } from '../../components/notifications/NotificationCard';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from '../../services/notificationsApi';
import { getConversations, Conversation } from '../../services/messagesApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { MainStackParamList } from '../../navigation/MainStack';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastMessageSender, setLastMessageSender] = useState<string | null>(null);
  const [showSystemNotifications, setShowSystemNotifications] = useState(false);

  // Load notifications and unread counts
  const loadData = useCallback(async () => {
    try {
      const [notifs, conversations] = await Promise.all([
        getNotifications(),
        getConversations().catch(() => [] as Conversation[]),
      ]);

      setNotifications(notifs);

      // Calculate total unread messages from all conversations
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setMessageUnreadCount(totalUnread);

      // Find the most recent conversation with last message
      if (conversations.length > 0) {
        // Sort by updatedAt to get the most recent
        const sortedConversations = [...conversations].sort((a, b) => {
          const aTime = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : (a.updatedAt || 0);
          const bTime = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : (b.updatedAt || 0);
          return bTime - aTime;
        });
        const recentConv = sortedConversations[0];
        if (recentConv?.lastMessage?.content) {
          setLastMessage(recentConv.lastMessage.content);
          // Get sender name
          const senderName = recentConv.lastMessage.senderId === recentConv.employerId
            ? recentConv.employerName
            : recentConv.workerName;
          setLastMessageSender(senderName || null);
        } else {
          setLastMessage(null);
          setLastMessageSender(null);
        }
      } else {
        setLastMessage(null);
        setLastMessageSender(null);
      }

      const unreadNotifs = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(unreadNotifs);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for new notifications every 15 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadData();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [user, loadData]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead(notification);
    }
    // Could navigate to relevant screen based on notification content
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNavigateToChat = () => {
    navigation.navigate('ChatList');
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const lastSystemNotification = notifications.length > 0 ? notifications[0] : null;

  const handleToggleSystemNotifications = async () => {
    const willShow = !showSystemNotifications;
    setShowSystemNotifications(willShow);
    
    // Auto mark all as read when expanding the notifications section
    if (willShow && unreadCount > 0) {
      try {
        await markAllNotificationsAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } catch {}
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary[500]]}
        />
      }
    >
      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Messages Card */}
        <TouchableOpacity style={styles.notificationCard} onPress={handleNavigateToChat}>
          <View style={styles.cardContent}>
            <Text style={styles.cardIcon}>💬</Text>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tin nhắn</Text>
                {messageUnreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSubtitle}>
                {messageUnreadCount > 0
                  ? `${messageUnreadCount} tin nhắn chưa đọc`
                  : 'Không có tin nhắn mới'}
              </Text>
              {lastMessage && (
                <Text style={styles.cardLastMessage} numberOfLines={1}>
                  {lastMessageSender ? `${lastMessageSender}: ` : ''}{lastMessage}
                </Text>
              )}
            </View>
            <Text style={styles.cardArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* System Notifications Card */}
        <TouchableOpacity style={styles.notificationCard} onPress={handleToggleSystemNotifications}>
          <View style={styles.cardContent}>
            <Text style={styles.cardIcon}>🔔</Text>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Hệ thống</Text>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardSubtitle}>
                {unreadCount > 0
                  ? `${unreadCount} thông báo chưa đọc`
                  : 'Không có thông báo mới'}
              </Text>
              {lastSystemNotification && (
                <Text style={styles.cardLastMessage} numberOfLines={1}>
                  {lastSystemNotification.content}
                </Text>
              )}
            </View>
            <Text style={styles.cardArrow}>{showSystemNotifications ? '▾' : '›'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* System Notifications List - Expandable */}
      {showSystemNotifications && (
        <View style={styles.systemNotificationsContainer}>
          {/* Header Actions */}
          {unreadNotifications.length > 0 && (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có thông báo nào.</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onPress={handleNotificationPress}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  cardsContainer: {
    padding: spacing[4],
    gap: spacing[3],
  },
  notificationCard: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: spacing[3],
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginRight: spacing[2],
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  cardLastMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
  cardArrow: {
    fontSize: 24,
    color: colors.text.tertiary,
    marginLeft: spacing[2],
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  systemNotificationsContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  headerActions: {
    paddingBottom: spacing[3],
  },
  markAllButton: {
    alignSelf: 'flex-end',
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
