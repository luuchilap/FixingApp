"use client";

import Link from "next/link";
import { useNotifications } from "@/lib/hooks/useNotifications";

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-sky-300"
      aria-label="Notifications"
    >
      <span aria-hidden>🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}


