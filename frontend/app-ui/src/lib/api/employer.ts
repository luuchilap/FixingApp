import { apiGet, apiPost } from "./http";
import type { Job } from "../types/jobs";
import type { JobApplication } from "../types/applications";

export async function fetchMyJobs(): Promise<Job[]> {
  return apiGet<Job[]>("/api/jobs/my", { auth: true });
}

export interface CreateJobRequest {
  title: string;
  description: string;
  price: number;
  address: string;
  requiredSkill?: string | null;
  images?: Array<{ type?: string; url: string }>;
}

export async function createJob(body: CreateJobRequest): Promise<Job> {
  return apiPost<CreateJobRequest, Job>("/api/jobs", body, { auth: true });
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


