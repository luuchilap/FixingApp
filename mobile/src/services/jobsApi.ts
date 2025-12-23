import api from './api';
import { Job } from '../types/jobs';

export interface ListJobsParams {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sort?: string;
}

export interface JobWithImages extends Job {
  employerName?: string;
  employerPhone?: string;
  images?: Array<{ type?: string; url: string }>;
}

/**
 * Get list of jobs with optional filters
 */
export const listJobs = async (params?: ListJobsParams): Promise<JobWithImages[]> => {
  const response = await api.get<JobWithImages[]>('/jobs', { params });
  return response.data;
};

/**
 * Get job by ID
 */
export const getJobById = async (jobId: number): Promise<JobWithImages> => {
  const response = await api.get<JobWithImages>(`/jobs/${jobId}`);
  return response.data;
};

/**
 * Get jobs posted by current employer
 */
export const getMyJobs = async (): Promise<JobWithImages[]> => {
  const response = await api.get<JobWithImages[]>('/jobs/my');
  return response.data;
};

// Note: applyToJob has been moved to applicationsApi.ts

/**
 * Create a new job (Employer only)
 */
export const createJob = async (formData: FormData): Promise<JobWithImages> => {
  // Axios will automatically set Content-Type with boundary for FormData
  // The interceptor already handles removing Content-Type for FormData
  const response = await api.post<JobWithImages>('/jobs', formData);
  return response.data;
};

