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
  appliedAt?: number;
  worker?: {
    id?: number;
    fullName?: string;
    phone?: string;
  };
  job?: {
    id: number;
    title: string;
    status: string;
    price: number;
    address: string;
  };
}


