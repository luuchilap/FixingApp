import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Notification } from '../../services/notificationsApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

export interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (notification: Notification) => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Vừa xong';
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  }
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkAsRead,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(notification);
    }
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification);
    }
  };

  return (
    <Card
      variant="default"
      onPress={handlePress}
      style={[styles.card, !notification.isRead && styles.cardUnread]}
      padding={4}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          {!notification.isRead && <View style={styles.unreadDot} />}
          <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
        </View>
        <Text style={[styles.contentText, !notification.isRead && styles.contentTextUnread]}>
          {notification.content}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
  },
  cardUnread: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  content: {
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  contentText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.base,
  },
  contentTextUnread: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

