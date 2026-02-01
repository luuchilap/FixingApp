import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RegisterEmployerForm } from '../../components/auth/RegisterEmployerForm';
import { AuthStackParamList } from '../../navigation/AuthStack';

type RegisterEmployerScreenProps = NativeStackScreenProps<AuthStackParamList, 'RegisterEmployer'>;

export const RegisterEmployerScreen: React.FC<RegisterEmployerScreenProps> = ({ navigation }) => {
  const handleSuccess = () => {};

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

