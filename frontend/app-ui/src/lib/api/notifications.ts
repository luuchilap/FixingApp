import { apiGet, apiPost } from "./http";
import type { AppNotification } from "../types/notifications";

export async function fetchNotifications(): Promise<AppNotification[]> {
  // Endpoint inferred; gracefully handled by callers on failure.
  return apiGet<AppNotification[]>("/api/notifications", { auth: true });
}

export async function markNotificationRead(id: number): Promise<void> {
  // Endpoint inferred; gracefully handled by callers on failure.
  await apiPost(`/api/notifications/${id}/read`, {});
}


