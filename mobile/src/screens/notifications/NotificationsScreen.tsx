import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getTotalUnreadCount } from '../../services/messagesApi';
import { colors, spacing, typography } from '../../constants/designTokens';
import { MainStackParamList } from '../../navigation/MainStack';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    // Poll for unread count every 10 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await getTotalUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNavigateToChat = () => {
    navigation.navigate('ChatList');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Thông báo</Text>
      
      <TouchableOpacity style={styles.chatCard} onPress={handleNavigateToChat}>
        <View style={styles.chatCardContent}>
          <Text style={styles.chatCardIcon}>💬</Text>
          <View style={styles.chatCardInfo}>
            <Text style={styles.chatCardTitle}>Tin nhắn</Text>
            <Text style={styles.chatCardSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} tin nhắn chưa đọc`
                : 'Không có tin nhắn mới'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Các thông báo khác sẽ hiển thị ở đây.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  content: {
    padding: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  },
  chatCard: {
    backgroundColor: colors.background.white,
    borderRadius: 8,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chatCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatCardIcon: {
    fontSize: 32,
    marginRight: spacing[3],
  },
  chatCardInfo: {
    flex: 1,
  },
  chatCardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  chatCardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
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
  infoBox: {
    backgroundColor: colors.background.gray,
    borderRadius: 8,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

