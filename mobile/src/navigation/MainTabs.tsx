import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { JobsScreen } from '../screens/jobs/JobsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { colors, spacing, typography } from '../constants/designTokens';
import { JobFilters as JobFiltersType } from '../components/jobs/JobFilters';

export type MainTabsParamList = {
  Dashboard: undefined;
  Jobs: { presetFilters?: JobFiltersType } | undefined;
  Profile: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

/**
 * Define which tabs are visible for each role
 * This allows easy customization of tab visibility based on user role
 * 
 * Example: To hide Notifications for WORKER, change:
 * case 'WORKER':
 *   return ['Dashboard', 'Jobs', 'Profile'];
 */
const getVisibleTabs = (role: string | undefined): (keyof MainTabsParamList)[] => {
  switch (role) {
    case 'EMPLOYER':
      // Employers see: Dashboard, Jobs, Notifications, Profile
      // Future: Could add 'Workers' tab to manage worker applications
      return ['Dashboard', 'Jobs', 'Notifications', 'Profile'];
    case 'WORKER':
      // Workers see: Dashboard, Jobs, Notifications, Profile
      // Future: Could add 'Applications' tab to track job applications
      return ['Dashboard', 'Jobs', 'Notifications', 'Profile'];
    case 'ADMIN':
      // Admins see all tabs
      return ['Dashboard', 'Jobs', 'Notifications', 'Profile'];
    default:
      // Default: show all tabs (fallback for safety)
      return ['Dashboard', 'Jobs', 'Notifications', 'Profile'];
  }
};

export const MainTabs: React.FC = () => {
  const { user } = useAuth();
  const { totalUnreadCount } = useNotifications();
  const userRole = user?.role;
  const visibleTabs = getVisibleTabs(userRole);

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#16a34a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {visibleTabs.includes('Dashboard') && (
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Trang chủ',
            tabBarLabel: 'Trang chủ',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}
      {visibleTabs.includes('Jobs') && (
        <Tab.Screen
          name="Jobs"
          component={JobsScreen}
          options={{
            title: userRole === 'EMPLOYER' ? 'Công việc đã đăng' : 'Công việc',
            tabBarLabel: userRole === 'EMPLOYER' ? 'Đã đăng' : 'Công việc',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'briefcase' : 'briefcase-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}
      {visibleTabs.includes('Notifications') && (
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            title: 'Thông báo',
            tabBarLabel: 'Thông báo',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={focused ? 'bell' : 'bell-outline'}
                  size={24}
                  color={color}
                />
                {totalUnreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
      )}
      {visibleTabs.includes('Profile') && (
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Hồ sơ',
            tabBarLabel: 'Hồ sơ',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'account' : 'account-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
});

