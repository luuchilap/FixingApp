import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterEmployerScreen } from '../screens/auth/RegisterEmployerScreen';
import { RegisterWorkerScreen } from '../screens/auth/RegisterWorkerScreen';

export type AuthStackParamList = {
  Login: undefined;
  RegisterEmployer: undefined;
  RegisterWorker: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterEmployer" component={RegisterEmployerScreen} />
      <Stack.Screen name="RegisterWorker" component={RegisterWorkerScreen} />
    </Stack.Navigator>
  );
};

