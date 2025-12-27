import { apiGet, apiPost } from "./http";
import type { Job } from "../types/jobs";
import type { JobApplication } from "../types/applications";

export async function fetchMyJobs(status?: string): Promise<Job[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiGet<Job[]>(`/api/jobs/my${params}`, { auth: true });
}

export interface CreateJobRequest {
  title: string;
  description: string;
  price: number;
  address: string;
  requiredSkill?: string | null;
  images?: string[]; // Backend expects array of image URLs (strings), not objects
}

export async function createJob(body: CreateJobRequest | FormData): Promise<Job> {
  return apiPost<CreateJobRequest | FormData, Job>("/api/jobs", body, { auth: true });
}

export async function acceptApplication(
  jobId: number,
  workerId: number,
): Promise<JobApplication> {
  return apiPost<undefined, JobApplication>(
    `/api/jobs/${jobId}/accept/${workerId}`,
    undefined as unknown as undefined,
    { auth: true },
  );
}

export async function rejectApplication(
  jobId: number,
  workerId: number,
): Promise<JobApplication> {
  return apiPost<undefined, JobApplication>(
    `/api/jobs/${jobId}/reject/${workerId}`,
    undefined as unknown as undefined,
    { auth: true },
  );
}


