// App configuration constants
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the local network IP for development
// Change this to your Mac's IP address when testing on real devices
const DEV_MACHINE_IP = '10.0.214.66';

// Detect if running on a real device (not simulator/emulator)
const isDevice = Constants.executionEnvironment === 'storeClient' || 
                 (Constants.executionEnvironment === 'standalone');

const getDevBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2, real device uses actual IP
    return isDevice 
      ? `http://${DEV_MACHINE_IP}:3000/api`
      : 'http://10.0.2.2:3000/api';
  } else {
    // iOS: simulator can use localhost, real device needs actual IP
    return isDevice
      ? `http://${DEV_MACHINE_IP}:3000/api`
      : `http://${DEV_MACHINE_IP}:3000/api`; // Use IP for both to be safe
  }
};

export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: __DEV__
    ? getDevBaseUrl()
    : 'https://your-production-api.com/api', // Production URL
  
  // Timeout for API requests (milliseconds)
  TIMEOUT: 30000,
  
  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER: 'user',
  },
} as const;

export const APP_CONFIG = {
  NAME: 'FixingApp',
  VERSION: '1.0.0',
} as const;

