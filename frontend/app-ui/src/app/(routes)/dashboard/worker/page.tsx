"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { JobApplication } from "@/lib/types/applications";
import type { JobStatus } from "@/lib/types/jobs";
import {
  fetchCertificates,
  fetchMyApplications,
  fetchMyReviews,
  uploadCertificate,
  type WorkerCertificate,
  type WorkerReview,
} from "@/lib/api/worker";

const JOB_STATUS_OPTIONS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "CHUA_LAM", label: "Chưa làm" },
  { value: "DANG_BAN_GIAO", label: "Đang bàn giao" },
  { value: "DA_HOAN_THANH", label: "Đã hoàn thành" },
  { value: "EXPIRED", label: "Hết hạn" },
];

export default function WorkerDashboardPage() {
  const { user, status } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [certs, setCerts] = useState<WorkerCertificate[]>([]);
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatus | "">("");

  const isAuthedWorker = status === "authenticated" && user?.role === "WORKER";

  useEffect(() => {
    async function load() {
      if (!isAuthedWorker) return;
      setLoading(true);
      setError(null);
      try {
        const [appsRes, certRes, reviewRes] = await Promise.allSettled([
          fetchMyApplications(jobStatusFilter || undefined),
          fetchCertificates(),
          fetchMyReviews(),
        ]);

        if (appsRes.status === "fulfilled") setApplications(appsRes.value);
        if (certRes.status === "fulfilled") setCerts(certRes.value);
        if (reviewRes.status === "fulfilled") setReviews(reviewRes.value);

        if (
          [appsRes, certRes, reviewRes].every((r) => r.status === "rejected")
        ) {
          setError("Could not load worker data from the server.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isAuthedWorker, jobStatusFilter]);

  async function handleUploadClick() {
    if (!isAuthedWorker) return;
    setUploadMessage(null);
    
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const saved = await uploadCertificate(file);
        setCerts((prev) => [...prev, saved]);
        setUploadMessage("Certificate uploaded successfully.");
      } catch (error) {
        setUploadMessage("Upload failed. Please try again.");
        console.error("Certificate upload error:", error);
      }
    };
    input.click();
  }

  if (!isAuthedWorker) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">
          Log in as a worker to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Công việc đã apply
        </h1>
        <p className="text-sm text-slate-600">
          Theo dõi các công việc bạn đã apply, đánh giá và chứng chỉ.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Các công việc đã apply
          </h2>
          {loading && (
            <span className="text-xs text-slate-500">Đang tải...</span>
          )}
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Lọc theo trạng thái công việc:
          </label>
          <select
            value={jobStatusFilter}
            onChange={(e) => setJobStatusFilter(e.target.value as JobStatus | "")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {JOB_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error} (showing cached/empty data)
          </p>
        )}
        {applications.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Bạn chưa apply công việc nào.
          </p>
        ) : (
          <div className="mt-3 grid gap-3">
            {applications.map((app) => (
              <a
                key={app.id}
                href={`/jobs/${app.jobId}`}
                className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-sky-300 hover:shadow-md"
              >
                {app.job ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {app.job.title}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase text-slate-600">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{app.job.address}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-sky-700">
                        {app.job.price.toLocaleString("vi-VN")} đ
                      </p>
                      <span className="text-xs text-slate-500">
                        Trạng thái công việc: {app.job.status}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      Job #{app.jobId} (status: {app.status})
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {app.status}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
          {reviews.length > 0 && (
            <span className="text-xs text-slate-500">
              {reviews.length} review(s)
            </span>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No reviews yet. Complete jobs to collect feedback.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 text-sm">
            {reviews.map((rev) => (
              <li key={rev.id} className="py-2">
                <p className="font-medium">
                  {rev.reviewerName ?? "Customer"} — {rev.rating ?? "N/A"}★
                </p>
                <p className="text-slate-600">{rev.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Certificates
          </h2>
          <button
            type="button"
            onClick={handleUploadClick}
            className="rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            Upload certificate
          </button>
        </div>
        {uploadMessage && (
          <p className="mt-2 text-sm text-slate-600">{uploadMessage}</p>
        )}
        {certs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No certificates on file. Upload one to start verification.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 text-sm">
            {certs.map((cert, idx) => (
              <li key={cert.id ?? idx} className="py-2">
                <p className="font-medium">
                  {cert.status ?? "PENDING"} — {cert.imageUrl}
                </p>
                {cert.reviewedBy && (
                  <p className="text-xs text-slate-500">
                    Reviewed by user {cert.reviewedBy}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


