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
    const token = await storage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      await storage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await storage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
    }
    return Promise.reject(error);
  }
);

export default api;

