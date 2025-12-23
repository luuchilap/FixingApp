import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RegisterWorkerForm } from '../../components/auth/RegisterWorkerForm';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/AuthStack';

type RegisterWorkerScreenProps = NativeStackScreenProps<AuthStackParamList, 'RegisterWorker'>;

export const RegisterWorkerScreen: React.FC<RegisterWorkerScreenProps> = ({ navigation }) => {
  const { user } = useAuth();

  const handleSuccess = () => {
    // Navigation will be handled by the navigation system
    // based on user role after registration
    console.log('Registration successful, user:', user);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <RegisterWorkerForm 
        onSuccess={handleSuccess} 
        onNavigateToLogin={() => navigation.navigate('Login')} 
      />
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

