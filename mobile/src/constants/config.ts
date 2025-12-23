// App configuration constants
import { Platform } from 'react-native';

export const API_CONFIG = {
  // Backend API base URL
  BASE_URL: __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:3000/api' // Android emulator uses 10.0.2.2 to access host
      : 'http://localhost:3000/api' // iOS simulator and web use localhost
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

