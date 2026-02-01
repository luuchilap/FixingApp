import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoginForm } from '../../components/auth/LoginForm';
import { AuthStackParamList } from '../../navigation/AuthStack';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const handleSuccess = () => {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LoginForm 
        onSuccess={handleSuccess} 
        onNavigateToRegister={(role) => {
          if (role === 'EMPLOYER') {
            navigation.navigate('RegisterEmployer');
          } else {
            navigation.navigate('RegisterWorker');
          }
        }} 
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
    justifyContent: 'center',
  },
});

