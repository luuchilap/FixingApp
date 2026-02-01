import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Conversation } from '../../services/messagesApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

export interface ConversationCardProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}

const parseTimestamp = (timestamp: number | string | null | undefined): Date => {
  if (!timestamp) return new Date(NaN);
  
  if (typeof timestamp === 'string') {
    const numValue = Number(timestamp);
    if (!isNaN(numValue)) {
      if (numValue < 100000000000) {
        return new Date(numValue * 1000);
      }
      return new Date(numValue);
    }
    return new Date(timestamp);
  }
  
  if (timestamp < 100000000000) {
    return new Date(timestamp * 1000);
  }
  return new Date(timestamp);
};

const formatTime = (timestamp: number | string): string => {
  const date = parseTimestamp(timestamp);
  if (isNaN(date.getTime())) return '';
  
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

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onPress,
}) => {
  const otherUserName =
    conversation.workerName || conversation.employerName || 'Người dùng';
  const lastMessage = conversation.lastMessage?.content || 'Chưa có tin nhắn';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Card variant="default" onPress={() => onPress(conversation)} style={styles.card} padding={4}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{otherUserName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {otherUserName}
            </Text>
            {conversation.lastMessage && (
              <Text style={styles.time}>{formatTime(conversation.lastMessage.createdAt)}</Text>
            )}
          </View>

          <View style={styles.messageRow}>
            <Text style={[styles.message, hasUnread && styles.messageUnread]} numberOfLines={1}>
              {lastMessage}
            </Text>
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {conversation.jobTitle && (
            <Text style={styles.jobTitle} numberOfLines={1}>
              📋 {conversation.jobTitle}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[2],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginLeft: spacing[2],
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
    marginRight: spacing[2],
  },
  messageUnread: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  jobTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
});

