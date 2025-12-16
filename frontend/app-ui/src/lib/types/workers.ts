/**
 * Worker-related types
 */

export interface Worker {
  id: number;
  phone: string;
  fullName: string;
  address: string | null;
  skill: string | null;
  avgRating: number;
  isVerified: boolean;
  createdAt: number;
  certificates?: WorkerCertificate[];
}

export interface WorkerCertificate {
  id: number;
  imageUrl: string;
  status: string;
  reviewedAt: number | null;
}

export interface WorkersQuery {
  skill?: string;
  address?: string;
}

