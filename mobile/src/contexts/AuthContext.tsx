import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '../types/auth';
import { storage } from '../utils/storage';
import { API_CONFIG } from '../constants/config';
import api from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth state on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await storage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = await storage.getItem(API_CONFIG.STORAGE_KEYS.USER);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await api.post<{ token: string; user: User }>(
        '/auth/login',
        credentials
      );

      const { token: newToken, user: newUser } = response.data;

      // Store token and user
      await storage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, newToken);
      await storage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    } catch (error: unknown) {
      console.error('Login error:', error);
      const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
      throw new Error(
        axiosError.response?.data?.message || axiosError.response?.data?.error || 'Login failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const endpoint = data.role === 'EMPLOYER' 
        ? '/auth/register-employer' 
        : '/auth/register-worker';

      const response = await api.post<{ token: string; user: User }>(
        endpoint,
        data
      );

      const { token: newToken, user: newUser } = response.data;

      // Store token and user
      await storage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, newToken);
      await storage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
      throw new Error(
        axiosError.response?.data?.message || axiosError.response?.data?.error || 'Registration failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional in MVP)
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Ignore logout API errors in MVP
        console.log('Logout API call failed (expected in MVP)');
      }

      // Clear storage
      await storage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await storage.removeItem(API_CONFIG.STORAGE_KEYS.USER);

      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state
      await storage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await storage.removeItem(API_CONFIG.STORAGE_KEYS.USER);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get<User>('/users/me');
      const updatedUser = response.data;
      
      await storage.setItem(API_CONFIG.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: unknown) {
      console.error('Error refreshing user:', error);
      // If refresh fails, user might be logged out
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        await logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

