import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RegisterWorkerForm } from '../../components/auth/RegisterWorkerForm';
import { AuthStackParamList } from '../../navigation/AuthStack';

type RegisterWorkerScreenProps = NativeStackScreenProps<AuthStackParamList, 'RegisterWorker'>;

export const RegisterWorkerScreen: React.FC<RegisterWorkerScreenProps> = ({ navigation }) => {
  const handleSuccess = () => {};

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

