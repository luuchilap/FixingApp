import api from './api';

export interface UserProfile {
  id: number;
  phone: string;
  fullName: string;
  address?: string;
  role: string;
  createdAt: number | string;
  updatedAt?: number | string;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  address?: string;
}

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('/users/me');
  return response.data;
};

/**
 * Update current user profile
 */
export const updateUserProfile = async (
  data: UpdateUserProfileRequest
): Promise<UserProfile> => {
  const response = await api.put<UserProfile>('/users/me', data);
  return response.data;
};

