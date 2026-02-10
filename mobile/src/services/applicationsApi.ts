import api from './api';

export interface Application {
  id: number;
  jobId: number;
  workerId: number;
  status: 'APPLIED' | 'ACCEPTED' | 'REJECTED' | 'PENDING';
  appliedAt: number;
  acceptedAt?: number;
  rejectedAt?: number;
  createdAt?: string;
  updatedAt?: string;
  worker?: {
    id: number;
    phone: string;
    fullName: string;
    address?: string;
    skill?: string;
    avgRating?: number | null;
    isVerified: boolean;
  };
  job?: {
    id: number;
    title: string;
    price: number;
    address: string;
    status: string;
    employerName?: string;
  };
}

export interface ApplicationWithJob extends Application {
  job: {
    id: number;
    title: string;
    price: number;
    address: string;
    status: string;
    employerName?: string;
  };
}

export interface ApplicationWithWorker extends Application {
  worker: {
    id: number;
    phone: string;
    fullName: string;
    address?: string;
    skill?: string;
    avgRating?: number | null;
    isVerified: boolean;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedApplications {
  data: ApplicationWithJob[];
  pagination: PaginationInfo;
}

/**
 * Apply to a job (Worker only)
 */
export const applyToJob = async (jobId: number): Promise<Application> => {
  // Backend routes for applications are mounted under /api/applications
  const response = await api.post<Application>(`/applications/${jobId}/apply`);
  return response.data;
};

/**
 * Get applications for a specific job (Employer only)
 */
export const getJobApplications = async (jobId: number): Promise<ApplicationWithWorker[]> => {
  const response = await api.get<ApplicationWithWorker[]>(`/applications/${jobId}/applications`);
  return response.data;
};

/**
 * Get my applications with pagination (Worker only)
 */
export const getMyApplications = async (params?: { page?: number; limit?: number }): Promise<PaginatedApplications> => {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = params.page.toString();
  if (params?.limit) queryParams.limit = params.limit.toString();
  
  const response = await api.get<PaginatedApplications>('/applications/my', { params: queryParams });
  return response.data;
};

/**
 * Accept a worker application (Employer only)
 */
export const acceptApplication = async (jobId: number, workerId: number): Promise<void> => {
  await api.post(`/applications/${jobId}/accept/${workerId}`);
};

/**
 * Reject a worker application (Employer only)
 */
export const rejectApplication = async (jobId: number, workerId: number): Promise<void> => {
  await api.post(`/applications/${jobId}/reject/${workerId}`);
};

