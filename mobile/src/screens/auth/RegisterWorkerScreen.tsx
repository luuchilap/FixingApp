import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { RegisterWorkerForm } from '../../components/auth/RegisterWorkerForm';
import { useAuth } from '../../hooks/useAuth';

interface RegisterWorkerScreenProps {
  onNavigateToLogin?: () => void;
}

export const RegisterWorkerScreen: React.FC<RegisterWorkerScreenProps> = ({ onNavigateToLogin }) => {
  const { user } = useAuth();

  const handleSuccess = () => {
    // Navigation will be handled by the navigation system
    // based on user role after registration
    console.log('Registration successful, user:', user);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <RegisterWorkerForm onSuccess={handleSuccess} onNavigateToLogin={onNavigateToLogin} />
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
  },
});

