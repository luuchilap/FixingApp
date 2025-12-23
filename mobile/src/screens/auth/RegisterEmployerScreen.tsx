import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { RegisterEmployerForm } from '../../components/auth/RegisterEmployerForm';
import { useAuth } from '../../hooks/useAuth';

interface RegisterEmployerScreenProps {
  onNavigateToLogin?: () => void;
}

export const RegisterEmployerScreen: React.FC<RegisterEmployerScreenProps> = ({ onNavigateToLogin }) => {
  const { user } = useAuth();

  const handleSuccess = () => {
    // Navigation will be handled by the navigation system
    // based on user role after registration
    console.log('Registration successful, user:', user);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <RegisterEmployerForm onSuccess={handleSuccess} onNavigateToLogin={onNavigateToLogin} />
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

