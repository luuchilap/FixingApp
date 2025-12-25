/**
 * Workers API client
 * For employers to browse workers
 */

import { apiGet } from "./http";
import type { Worker, WorkersQuery } from "../types/workers";

export async function fetchWorkers(query: WorkersQuery = {}): Promise<Worker[]> {
  // Convert WorkersQuery to Record<string, unknown> for apiGet
  const queryParams: Record<string, unknown> = {};
  if (query.skill) queryParams.skill = query.skill;
  if (query.address) queryParams.address = query.address;
  
  return apiGet<Worker[]>("/api/workers", { query: queryParams, auth: true });
}

export async function fetchWorker(workerId: number): Promise<Worker> {
  return apiGet<Worker>(`/api/workers/${workerId}`, { auth: true });
}

