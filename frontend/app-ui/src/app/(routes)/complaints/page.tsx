"use client";

import { useEffect, useState } from "react";
import { getMyComplaints } from "@/lib/api/complaints";
import type { Complaint } from "@/lib/types/complaints";
import { useAuth } from "@/lib/hooks/useAuth";

export default function MyComplaintsPage() {
  const { user, status } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthed = status === "authenticated";

  useEffect(() => {
    async function load() {
      if (!isAuthed) return;
      setLoading(true);
      setError(null);
      try {
        const list = await getMyComplaints();
        setComplaints(list);
      } catch (err) {
        setError("Failed to load your complaints.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthed]);

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">
          Log in to view your complaints.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          My complaints
        </h1>
        <p className="text-sm text-slate-600">
          Track complaints you have filed on jobs.
        </p>
      </header>

      {loading && <p className="text-sm text-slate-600">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && complaints.length === 0 && (
        <p className="text-sm text-slate-600">
          You have not filed any complaints.
        </p>
      )}
      <ul className="space-y-2">
        {complaints.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Job #{c.jobId}</p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-600">
                {c.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{c.reason}</p>
            {c.decision && (
              <p className="text-xs text-slate-500">
                Decision: {c.decision} {c.notes ? `— ${c.notes}` : ""}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}


