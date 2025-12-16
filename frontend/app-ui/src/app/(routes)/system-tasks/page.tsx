"use client";

import { useEffect, useState } from "react";
import { fetchJobs } from "@/lib/api/jobs";
import type { Job } from "@/lib/types/jobs";

export default function SystemTasksPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJobs({}); // use public jobs list to reflect system-driven statuses
        setJobs(data.slice(0, 10));
      } catch {
        setError("Failed to load system task statuses.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          System task status
        </h1>
        <p className="text-sm text-slate-600">
          Latest job statuses as reported by the backend (system-driven updates).
        </p>
      </header>

      {loading && <p className="text-sm text-slate-600">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && jobs.length === 0 && (
        <p className="text-sm text-slate-600">No jobs found.</p>
      )}

      <ul className="space-y-2">
        {jobs.map((job) => (
          <li
            key={job.id}
            className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                {job.title}
              </p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-600">
                {job.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">{job.address}</p>
            <p className="text-xs text-slate-600 line-clamp-2">
              {job.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}


