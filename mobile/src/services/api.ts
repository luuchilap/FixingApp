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
      // If FormData is being sent, don't set Content-Type (axios will handle it)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    } catch {}
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
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;

