import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { JobsScreen } from '../screens/jobs/JobsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { useAuth } from '../hooks/useAuth';

export type MainTabsParamList = {
  Dashboard: undefined;
  Jobs: undefined;
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
  const userRole = user?.role;
  const visibleTabs = getVisibleTabs(userRole);

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0284c7',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
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
            title: 'Dashboard',
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, { color }]}>🏠</Text>
              </View>
            ),
          }}
        />
      )}
      {visibleTabs.includes('Jobs') && (
        <Tab.Screen
          name="Jobs"
          component={JobsScreen}
          options={{
            title: 'Jobs',
            tabBarLabel: 'Jobs',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, { color }]}>💼</Text>
              </View>
            ),
          }}
        />
      )}
      {visibleTabs.includes('Notifications') && (
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            title: 'Notifications',
            tabBarLabel: 'Notifications',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, { color }]}>🔔</Text>
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
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, { color }]}>👤</Text>
              </View>
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
  },
  icon: {
    fontSize: 22,
  },
});

