import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RegisterWorkerForm } from '../../components/auth/RegisterWorkerForm';
import { useAuth } from '../../hooks/useAuth';

export const RegisterWorkerScreen: React.FC = () => {
  const { user } = useAuth();

  const handleSuccess = () => {
    // Navigation will be handled by the navigation system
    // based on user role after registration
    console.log('Registration successful, user:', user);
  };

  return (
    <View style={styles.container}>
      <RegisterWorkerForm onSuccess={handleSuccess} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

