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

/**
 * Apply to a job (Worker only)
 */
export const applyToJob = async (jobId: number): Promise<Application> => {
  const response = await api.post<Application>(`/jobs/${jobId}/apply`);
  return response.data;
};

/**
 * Get applications for a specific job (Employer only)
 */
export const getJobApplications = async (jobId: number): Promise<ApplicationWithWorker[]> => {
  const response = await api.get<ApplicationWithWorker[]>(`/jobs/${jobId}/applications`);
  return response.data;
};

/**
 * Get my applications (Worker only)
 * Uses /applications/my endpoint for workers
 */
export const getMyApplications = async (): Promise<ApplicationWithJob[]> => {
  const response = await api.get<ApplicationWithJob[]>('/applications/my');
  return response.data;
};

/**
 * Accept a worker application (Employer only)
 */
export const acceptApplication = async (jobId: number, workerId: number): Promise<void> => {
  await api.post(`/jobs/${jobId}/accept/${workerId}`);
};

/**
 * Reject a worker application (Employer only)
 */
export const rejectApplication = async (jobId: number, workerId: number): Promise<void> => {
  await api.post(`/jobs/${jobId}/reject/${workerId}`);
};

