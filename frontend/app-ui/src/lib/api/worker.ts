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

export async function fetchMyApplications(jobStatus?: string): Promise<JobApplication[]> {
  // This endpoint is assumed; the backend swagger does not list it, so callers must handle errors.
  const params = jobStatus ? `?jobStatus=${encodeURIComponent(jobStatus)}` : '';
  return apiGet<JobApplication[]>(`/api/applications/my${params}`, { auth: true });
}

export async function fetchMyReviews(): Promise<WorkerReview[]> {
  // Assumed endpoint; handled gracefully by the caller on failure.
  return apiGet<WorkerReview[]>("/api/reviews/my", { auth: true });
}

export async function fetchCertificates(): Promise<WorkerCertificate[]> {
  // Backend endpoint: GET /api/workers/certificates/status
  // Returns: { certificates: WorkerCertificate[], isVerified: boolean }
  const response = await apiGet<{ certificates: WorkerCertificate[]; isVerified: boolean }>(
    "/api/workers/certificates/status",
    { auth: true }
  );
  return response.certificates || [];
}

export async function uploadCertificate(
  file: File,
): Promise<WorkerCertificate> {
  // Backend endpoint: POST /api/workers/certificates
  // Backend expects { imageUrl: string } in JSON body, not file upload
  // TODO: Need to upload file to S3 first, then submit the URL
  // For now, this function needs to be updated to:
  // 1. Upload file to S3 (similar to how jobs are uploaded)
  // 2. Get the S3 URL
  // 3. Call POST /api/workers/certificates with { imageUrl: <s3_url> }
  
  // Temporary: Convert file to base64 data URL (not ideal for production)
  // In production, should upload to S3 first
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imageUrl = reader.result as string;
        const response = await apiPost<{ imageUrl: string }, WorkerCertificate>(
          "/api/workers/certificates",
          { imageUrl },
          { auth: true }
        );
        resolve(response);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


