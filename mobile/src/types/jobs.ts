// Job-related types
export interface Job {
  id: number;
  employerId: number;
  title: string;
  description: string;
  price: number;
  address: string;
  requiredSkill: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  acceptedWorkerId?: number;
  handoverDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: number;
  jobId: number;
  workerId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

