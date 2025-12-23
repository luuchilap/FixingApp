import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RegisterEmployerForm } from '../../components/auth/RegisterEmployerForm';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/AuthStack';

type RegisterEmployerScreenProps = NativeStackScreenProps<AuthStackParamList, 'RegisterEmployer'>;

export const RegisterEmployerScreen: React.FC<RegisterEmployerScreenProps> = ({ navigation }) => {
  const { user } = useAuth();

  const handleSuccess = () => {
    // Navigation will be handled by the navigation system
    // based on user role after registration
    console.log('Registration successful, user:', user);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <RegisterEmployerForm 
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

