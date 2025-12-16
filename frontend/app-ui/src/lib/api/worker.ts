import { apiGet, apiPost } from "./http";
import type { JobApplication } from "../types/applications";

export interface WorkerCertificate {
  id?: number;
  imageUrl: string;
  status: string;
  reviewedBy?: number | null;
  reviewedAt?: number | null;
}

export interface WorkerReview {
  id: number;
  reviewerName?: string;
  rating?: number;
  comment?: string;
  createdAt?: number;
}

export async function fetchMyApplications(): Promise<JobApplication[]> {
  // This endpoint is assumed; the backend swagger does not list it, so callers must handle errors.
  return apiGet<JobApplication[]>("/api/applications/my", { auth: true });
}

export async function fetchMyReviews(): Promise<WorkerReview[]> {
  // Assumed endpoint; handled gracefully by the caller on failure.
  return apiGet<WorkerReview[]>("/api/reviews/my", { auth: true });
}

export async function fetchCertificates(): Promise<WorkerCertificate[]> {
  // Assumed endpoint; handled gracefully by the caller on failure.
  return apiGet<WorkerCertificate[]>("/api/certificates", { auth: true });
}

export async function uploadCertificate(
  file: File,
): Promise<WorkerCertificate> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPost<FormData, WorkerCertificate>("/api/certificates", formData, {
    auth: true,
    init: {
      body: formData,
    },
  });
}


