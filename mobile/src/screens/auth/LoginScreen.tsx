import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';

interface LoginScreenProps {
  onNavigateToRegister?: (role: 'EMPLOYER' | 'WORKER') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const { user } = useAuth();

  const handleSuccess = () => {
    // Navigation will be handled by the navigation system
    // based on user role after login
    console.log('Login successful, user:', user);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LoginForm onSuccess={handleSuccess} onNavigateToRegister={onNavigateToRegister} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});

