import { apiGet } from "./http";

export interface HealthResponse {
  status: string;
  timestamp?: string;
  uptime?: number;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/health");
}


