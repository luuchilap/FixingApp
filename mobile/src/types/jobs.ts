// Job-related types
export interface Job {
  id: number;
  employerId: number;
  title: string;
  description: string;
  price: number;
  address: string;
  requiredSkill: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CHUA_LAM' | 'DANG_BAN_GIAO';
  acceptedWorkerId?: number;
  handoverDeadline?: string;
  createdAt: string;
  updatedAt: string;
  employerName?: string;
  employerPhone?: string;
  images?: Array<{ type?: string; url: string }>;
}

export interface Application {
  id: number;
  jobId: number;
  workerId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

