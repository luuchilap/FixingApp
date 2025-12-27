"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchMyJobs } from "@/lib/api/employer";
import type { Job, JobStatus } from "@/lib/types/jobs";

const JOB_STATUS_OPTIONS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "CHUA_LAM", label: "Chưa làm" },
  { value: "DANG_BAN_GIAO", label: "Đang bàn giao" },
  { value: "DA_HOAN_THANH", label: "Đã hoàn thành" },
  { value: "EXPIRED", label: "Hết hạn" },
];

export default function EmployerDashboardPage() {
  const { user, status } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");

  const isEmployer = status === "authenticated" && user?.role === "EMPLOYER";

  useEffect(() => {
    async function load() {
      if (!isEmployer) return;
      setLoading(true);
      setError(null);
      try {
        const list = await fetchMyJobs(statusFilter || undefined);
        setJobs(list);
      } catch {
        setError("Could not load your jobs.");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isEmployer, statusFilter]);

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
            Công việc đã đăng
          </h1>
          <p className="text-sm text-slate-600">
            Quản lý các công việc bạn đã đăng và theo dõi trạng thái.
          </p>
        </div>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Các công việc đã đăng</h2>
          <a
            href="/jobs/new"
            className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            Đăng việc
          </a>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Lọc theo trạng thái:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobStatus | "")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {JOB_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {loading && (
          <p className="mt-2 text-sm text-slate-600">Đang tải công việc...</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {!loading && jobs.length === 0 && (
          <p className="mt-2 text-sm text-slate-600">
            {statusFilter ? "Không có công việc nào với trạng thái này." : "Chưa có công việc nào. Tạo bài đăng đầu tiên của bạn."}
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


