import { apiGet, apiPost } from "./http";
import type { Job } from "../types/jobs";
import type { JobApplication } from "../types/applications";

export interface JobsQuery {
  q?: string;
  skill?: string;
  category?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  maxDistance?: number; // Maximum distance in kilometers
}

export async function fetchJobs(query: JobsQuery): Promise<Job[]> {
  // Backend expects `keyword` and `category` query params (see swagger.yaml)
  const { q, skill, latitude, longitude, maxDistance, ...rest } = query;
  const finalQuery: Record<string, unknown> = {
    ...rest,
  };

  if (q) finalQuery.keyword = q;
  if (skill) finalQuery.category = skill;
  if (latitude !== undefined) finalQuery.latitude = latitude;
  if (longitude !== undefined) finalQuery.longitude = longitude;
  if (maxDistance !== undefined) finalQuery.maxDistance = maxDistance;

  console.log('fetchJobs called with query:', query);
  console.log('fetchJobs finalQuery:', finalQuery);
  
  return apiGet<Job[]>("/api/jobs", { query: finalQuery });
}

export async function fetchJob(jobId: number): Promise<Job> {
  return apiGet<Job>(`/api/jobs/${jobId}`);
}

export async function applyToJob(jobId: number): Promise<JobApplication> {
  return apiPost<undefined, JobApplication>(
    `/api/jobs/${jobId}/apply`,
    undefined as unknown as undefined,
    { auth: true },
  );
}

export async function fetchJobApplications(
  jobId: number,
): Promise<JobApplication[]> {
  return apiGet<JobApplication[]>(`/api/jobs/${jobId}/applications`, {
    auth: true,
  });
}



