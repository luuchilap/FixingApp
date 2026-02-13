import api from './api';

export interface UserProfile {
  id: number;
  phone: string;
  fullName: string;
  address?: string;
  role: string;
  idImageUrl?: string | null;
  verificationStatus?: string;
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

// ── Location APIs ──

export interface UserLocationResponse {
  userId?: number;
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt: number | null;
}

/**
 * Update current user's location
 */
export const updateMyLocation = async (
  latitude: number,
  longitude: number
): Promise<UserLocationResponse> => {
  const response = await api.put<UserLocationResponse>('/users/me/location', {
    latitude,
    longitude,
  });
  return response.data;
};

/**
 * Get a specific user's location (must be linked via accepted application)
 */
export const getUserLocation = async (
  userId: number
): Promise<UserLocationResponse> => {
  const response = await api.get<UserLocationResponse>(`/users/${userId}/location`);
  return response.data;
};

/**
 * Upload ID card / certificate image for verification
 */
export const uploadIdImage = async (imageUri: string): Promise<{ idImageUrl: string; verificationStatus: string }> => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const response = await api.post('/users/me/upload-id', formData);
  return response.data;
};

