import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AuthStack } from './src/navigation/AuthStack';
import { MainStack } from './src/navigation/MainStack';

// Navigation reference type for root navigation
type RootNavigationParamList = {
  AuthStack: undefined;
  MainStack: undefined;
};

/**
 * Main app content that integrates navigation with authentication context
 * 
 * Navigation Flow:
 * - When not authenticated: Shows AuthStack (Login, Register screens)
 * - When authenticated: Shows MainStack (MainTabs with Dashboard, Jobs, etc.)
 * - Navigation automatically switches when auth state changes
 * - NavigationContainer handles the transition between stacks
 */
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootNavigationParamList>>(null);
  const previousAuthState = useRef<boolean | null>(null);

  // Track auth state changes for navigation reset
  useEffect(() => {
    // Skip on initial load
    if (previousAuthState.current === null) {
      previousAuthState.current = isAuthenticated;
      return;
    }

    // If auth state changed, log for debugging
    if (previousAuthState.current !== isAuthenticated) {
      previousAuthState.current = isAuthenticated;
      
      // NavigationContainer automatically handles stack switching
      // when the component tree changes (AuthStack <-> MainStack)
      // This ensures clean navigation state on login/logout
      if (isAuthenticated) {
        console.log('User authenticated, switching to MainStack');
      } else {
        console.log('User logged out, switching to AuthStack');
      }
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

// Root app component with AuthProvider and SafeAreaProvider
export default function App() {
  // Notification feature removed - using backend API only for in-app notifications

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
});
