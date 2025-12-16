"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getAdminComplaints,
  resolveComplaint,
} from "@/lib/api/complaints";
import type { Complaint } from "@/lib/types/complaints";

export default function AdminDashboardPage() {
  const { user, status } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = status === "authenticated" && user?.role === "ADMIN";

  useEffect(() => {
    async function load() {
      if (!isAdmin) return;
      setLoading(true);
      setError(null);
      try {
        const list = await getAdminComplaints();
        setComplaints(list);
      } catch {
        setError("Failed to load complaints.");
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  async function handleResolve(id: number, decision: "ACCEPT" | "REJECT") {
    try {
      await resolveComplaint(id, decision);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: "RESOLVED", decision } : c,
        ),
      );
    } catch {
      // keep simple for now
    }
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">
          Admin access required to view this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-600">
          Review and resolve user complaints.
        </p>
      </header>

      {loading && <p className="text-sm text-slate-600">Loading complaints...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="space-y-3">
        {complaints.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Complaint #{c.id}</p>
                <p className="text-xs text-slate-500">Job #{c.jobId}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-600">
                {c.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{c.reason}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleResolve(c.id, "ACCEPT")}
                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => handleResolve(c.id, "REJECT")}
                className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
        {!loading && complaints.length === 0 && (
          <p className="text-sm text-slate-600">No complaints found.</p>
        )}
      </ul>
    </div>
  );
}


