export type ApplicationStatus =
  | "APPLIED"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED";

export interface JobApplication {
  id: number;
  jobId: number;
  workerId: number;
  status: ApplicationStatus;
  worker?: {
    id?: number;
    fullName?: string;
    phone?: string;
  };
}


