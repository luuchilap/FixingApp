/**
 * Workers API client
 * For employers to browse workers
 */

import { apiGet } from "./http";
import type { Worker, WorkersQuery } from "../types/workers";

export async function fetchWorkers(query: WorkersQuery = {}): Promise<Worker[]> {
  return apiGet<Worker[]>("/api/workers", { query, auth: true });
}

export async function fetchWorker(workerId: number): Promise<Worker> {
  return apiGet<Worker>(`/api/workers/${workerId}`, { auth: true });
}

