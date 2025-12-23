import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RegisterEmployerForm } from '../../components/auth/RegisterEmployerForm';
import { useAuth } from '../../hooks/useAuth';

export const RegisterEmployerScreen: React.FC = () => {
  const { user } = useAuth();

  const handleSuccess = () => {
    // Navigation will be handled by the navigation system
    // based on user role after registration
    console.log('Registration successful, user:', user);
  };

  return (
    <View style={styles.container}>
      <RegisterEmployerForm onSuccess={handleSuccess} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

