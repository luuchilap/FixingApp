import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/auth/LoginScreen';

// Main app content that uses auth
function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <StatusBar style="auto" />
      </>
    );
  }

  // Show success screen when authenticated (temporary until we build main app)
  return (
    <View style={styles.container}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Welcome back!</Text>
        <Text style={styles.successSubtitle}>
          {user?.fullName || user?.phone}
        </Text>
        <Text style={styles.roleText}>Role: {user?.role}</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

// Root app component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  checkmark: {
    color: '#fff',
    fontSize: 50,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#475569',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
  },
});
