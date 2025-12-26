export type JobStatus = "CHUA_LAM" | "DANG_BAN_GIAO" | "DA_HOAN_THANH" | "EXPIRED";

export interface Job {
  id: number;
  employerId: number;
  employerName?: string;
  employerPhone?: string;
  title: string;
  description: string;
  price: number;
  address: string;
  requiredSkill?: string | null;
  status: JobStatus;
  acceptedWorkerId?: number | null;
  handoverDeadline?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null; // Distance in kilometers
  createdAt: number;
  updatedAt: number;
  images?: Array<{ type?: string; url: string }>;
}

export interface PaginatedJobs {
  items: Job[];
  total: number;
  page: number;
  limit: number;
}


