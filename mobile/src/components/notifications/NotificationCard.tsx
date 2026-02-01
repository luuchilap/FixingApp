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

const parseTimestamp = (timestamp: number | string | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  let numValue: number;
  if (typeof timestamp === 'string') {
    numValue = Number(timestamp);
    if (isNaN(numValue)) {
      return new Date(timestamp);
    }
  } else {
    numValue = timestamp;
  }
  
  // If timestamp is in seconds (less than year 2001 in ms), convert to ms
  if (numValue < 100000000000) {
    return new Date(numValue * 1000);
  }
  return new Date(numValue);
};

const formatTime = (timestamp: number | string): string => {
  const date = parseTimestamp(timestamp);
  if (!date || isNaN(date.getTime())) return 'Vừa xong';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // If more than 1 day ago, show full date
  if (diffDays >= 1) {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  
  // Less than 1 day
  if (diffMinutes < 1) {
    return `${diffSeconds} giây trước`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else {
    return `${diffHours} giờ trước`;
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

