// Authentication types
export interface User {
  id: number;
  phone: string;
  fullName: string;
  address?: string;
  role: 'EMPLOYER' | 'WORKER' | 'ADMIN';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  phone: string;
  password: string;
  fullName: string;
  address?: string;
  role: 'EMPLOYER' | 'WORKER';
  skill?: string; // Required for WORKER role
}

