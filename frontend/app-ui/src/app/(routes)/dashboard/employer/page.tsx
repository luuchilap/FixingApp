"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchMyJobs } from "@/lib/api/employer";
import type { Job } from "@/lib/types/jobs";

export default function EmployerDashboardPage() {
  const { user, status } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEmployer = status === "authenticated" && user?.role === "EMPLOYER";

  useEffect(() => {
    async function load() {
      if (!isEmployer) return;
      setLoading(true);
      setError(null);
      try {
        const list = await fetchMyJobs();
        setJobs(list);
      } catch {
        setError("Could not load your jobs.");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isEmployer]);

  if (!isEmployer) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">
          Log in as an employer to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Employer dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Manage your posted jobs and monitor status.
          </p>
        </div>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">My jobs</h2>
          <a
            href="/jobs/new"
            className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            Post a job
          </a>
        </div>
        {loading && (
          <p className="mt-2 text-sm text-slate-600">Loading your jobs...</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {!loading && jobs.length === 0 && (
          <p className="mt-2 text-sm text-slate-600">
            No jobs yet. Create your first posting.
          </p>
        )}
        <div className="mt-3 grid gap-3">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-sky-300 hover:shadow-md"
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
              <p className="text-xs font-semibold text-sky-700">
                {job.price.toLocaleString("vi-VN")} đ
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}


