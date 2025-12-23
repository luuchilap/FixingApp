import axios from 'axios';
import { storage } from '../utils/storage';
import { API_CONFIG } from '../constants/config';

// Create axios instance
export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token from storage:', error);
      // Continue with request even if token retrieval fails
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      try {
        // Clear stored authentication data
        await storage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        await storage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
        
        // Note: Token refresh is not implemented as backend doesn't support it
        // In a production app with refresh tokens, you would:
        // 1. Attempt to refresh the token
        // 2. Retry the original request with the new token
        // 3. If refresh fails, redirect to login
        
        console.log('Authentication token expired or invalid. User will be redirected to login.');
      } catch (storageError) {
        console.error('Error clearing storage on 401:', storageError);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

