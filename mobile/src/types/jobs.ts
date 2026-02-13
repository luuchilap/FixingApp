// Job-related types
export interface Job {
  id: number;
  employerId: number;
  title: string;
  description: string;
  price: number;
  address: string;
  requiredSkill: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CHUA_LAM' | 'DANG_BAN_GIAO';
  acceptedWorkerId?: number;
  handoverDeadline?: string;
  scheduledAt?: number | null;
  createdAt: string;
  updatedAt: string;
  employerName?: string;
  employerPhone?: string;
  images?: Array<{ type?: string; url: string }>;
  latitude?: number | string | null; // Latitude coordinate
  longitude?: number | string | null; // Longitude coordinate
  distance?: number | null; // Distance in kilometers
  employerVerified?: boolean; // Employer verification status
}

/** Shared pagination info used across API responses */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

