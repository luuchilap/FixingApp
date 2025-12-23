import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions!');
      return false;
    }

    // Get push token (for future use with backend push notifications)
    // This is optional - permissions can still be granted without a push token
    if (Platform.OS !== 'web') {
      // Check if projectId is available before attempting to get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (projectId) {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          console.log('Expo Push Token:', token.data);
          // In production, you would send this token to your backend
        } catch (error: any) {
          console.log('Push token not available:', error.message);
          // Don't throw - permissions are still granted, just no push token
        }
      } else {
        // ProjectId not configured - skip push token (normal in development)
        console.log('Push token skipped (projectId not configured). Local notifications will still work.');
      }
    }

    return true;
  } catch (error: any) {
    // Only return false if permission request itself failed
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Set notification badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * Clear notification badge
 */
export const clearBadge = async (): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
};

/**
 * Schedule a local notification (for testing or offline scenarios)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

