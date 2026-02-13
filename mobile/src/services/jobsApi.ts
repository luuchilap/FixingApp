import api from './api';
import { Job, PaginationInfo } from '../types/jobs';

export type { PaginationInfo };

export interface ListJobsParams {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sort?: string;
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  page?: number;
  limit?: number;
}

/** Job is already complete — this alias keeps naming explicit at call sites */
export type JobWithImages = Job;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Get list of jobs with optional filters and pagination
 */
export const listJobs = async (params?: ListJobsParams): Promise<PaginatedResponse<JobWithImages>> => {
  const response = await api.get<PaginatedResponse<JobWithImages>>('/jobs', { params });
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
 * Create a new job (Employer only)
 */
export const createJob = async (formData: FormData): Promise<JobWithImages> => {
  const response = await api.post<JobWithImages>('/jobs', formData);
  return response.data;
};

