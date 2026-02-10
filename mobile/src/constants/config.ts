import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEV_MACHINE_IP = '192.168.1.7';

const isDevice = Constants.executionEnvironment === 'storeClient' ||
  (Constants.executionEnvironment === 'standalone');

const getDevBaseUrl = () => {
  if (Platform.OS === 'android') {
    return isDevice
      ? `http://${DEV_MACHINE_IP}:3000/api`
      : 'http://10.0.2.2:3000/api';
  } else {
    return `http://${DEV_MACHINE_IP}:3000/api`;
  }
};

export const API_CONFIG = {
  // Dùng backend online cho cả dev & prod
  BASE_URL: 'https://fixing-app.vercel.app/api',
  TIMEOUT: 10000,
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER: 'user',
  },
} as const;

export const APP_CONFIG = {
  NAME: 'FixingApp',
  VERSION: '1.0.0',
} as const;

