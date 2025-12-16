"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { JobApplication } from "@/lib/types/applications";
import {
  fetchCertificates,
  fetchMyApplications,
  fetchMyReviews,
  uploadCertificate,
  type WorkerCertificate,
  type WorkerReview,
} from "@/lib/api/worker";

export default function WorkerDashboardPage() {
  const { user, status } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [certs, setCerts] = useState<WorkerCertificate[]>([]);
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const isAuthedWorker = status === "authenticated" && user?.role === "WORKER";

  useEffect(() => {
    async function load() {
      if (!isAuthedWorker) return;
      setLoading(true);
      setError(null);
      try {
        const [appsRes, certRes, reviewRes] = await Promise.allSettled([
          fetchMyApplications(),
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
  }, [isAuthedWorker]);

  async function handleUploadClick() {
    if (!isAuthedWorker) return;
    setUploadMessage(null);
    try {
      // Use placeholder image per instruction; replace later with real file input.
      const res = await fetch("/img_placeholder.jpg");
      const blob = await res.blob();
      const file = new File([blob], "certificate-placeholder.jpg", {
        type: blob.type || "image/jpeg",
      });
      const saved = await uploadCertificate(file);
      setCerts((prev) => [...prev, saved]);
      setUploadMessage("Certificate uploaded (placeholder). Replace later.");
    } catch {
      setUploadMessage("Upload failed (placeholder endpoint).");
    }
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
          Worker dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Track your applications, reviews, and certificates.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Applications
          </h2>
          {loading && (
            <span className="text-xs text-slate-500">Loading data...</span>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error} (showing cached/empty data)
          </p>
        )}
        {applications.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            You have not applied to any jobs yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 text-sm">
            {applications.map((app) => (
              <li
                key={app.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="font-medium">
                    Job #{app.jobId} (status: {app.status})
                  </p>
                  <p className="text-xs text-slate-500">
                    Worker ID: {app.workerId}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {app.status}
                </span>
              </li>
            ))}
          </ul>
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
            Upload placeholder
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


