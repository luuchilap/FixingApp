import { apiGet, apiPost } from "./http";
import type { Complaint } from "../types/complaints";

export interface FileComplaintRequest {
  jobId: number;
  reason: string;
  evidences?: Array<{ type: "IMAGE" | "LOG"; url: string }>;
}

export async function fileComplaint(
  body: FileComplaintRequest,
): Promise<Complaint> {
  return apiPost<FileComplaintRequest, Complaint>("/api/complaints", body, {
    auth: true,
  });
}

export async function getMyComplaints(): Promise<Complaint[]> {
  return apiGet<Complaint[]>("/api/complaints/my", { auth: true });
}

export async function getAdminComplaints(): Promise<Complaint[]> {
  return apiGet<Complaint[]>("/api/admin/complaints", { auth: true });
}

export async function resolveComplaint(
  complaintId: number,
  decision: "ACCEPT" | "REJECT",
  notes?: string,
): Promise<void> {
  await apiPost(`/api/admin/complaints/${complaintId}/resolve`, {
    decision,
    notes,
  });
}


