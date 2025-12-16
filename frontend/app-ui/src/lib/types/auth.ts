export interface LoginRequest {
  phone: string;
  password: string;
}

export type UserRole = "EMPLOYER" | "WORKER" | "ADMIN";

export interface AuthUser {
  id: number;
  phone: string;
  fullName: string;
  address?: string | null;
  role: UserRole;
  createdAt: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterEmployerRequest {
  phone: string;
  password: string;
  fullName: string;
  address?: string | null;
}

export interface RegisterWorkerRequest extends RegisterEmployerRequest {
  skill: string;
}


