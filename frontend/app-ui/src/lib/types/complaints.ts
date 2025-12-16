export type ComplaintStatus = "PENDING" | "RESOLVED";

export interface Complaint {
  id: number;
  jobId: number;
  reason: string;
  status: ComplaintStatus;
  decision?: "ACCEPT" | "REJECT";
  notes?: string;
}


