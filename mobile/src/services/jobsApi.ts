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

/**
 * Apply to a job (Worker only)
 */
export const applyToJob = async (jobId: number): Promise<void> => {
  await api.post(`/jobs/${jobId}/apply`);
};

