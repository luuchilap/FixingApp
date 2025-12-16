 "use client";

import { useNotifications } from "@/lib/hooks/useNotifications";

export default function NotificationsPage() {
  const { notifications, loading, markAsRead } = useNotifications();

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-600">
          Updates about your jobs, applications, and complaints.
        </p>
      </header>

      {loading && <p className="text-sm text-slate-600">Loading...</p>}
      {!loading && notifications.length === 0 && (
        <p className="text-sm text-slate-600">No notifications yet.</p>
      )}

      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="pr-3">
              <p className="text-sm font-semibold text-slate-900">
                {n.title ?? "Notification"}
              </p>
              <p className="text-sm text-slate-700">{n.message}</p>
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => markAsRead(n.id)}
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-slate-950"
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}


