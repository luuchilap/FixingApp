// User-related types
export type UserRole = 'EMPLOYER' | 'WORKER' | 'ADMIN';

export interface WorkerProfile {
  id: number;
  userId: number;
  skills: string[];
  experience?: string;
  rating?: number;
}

