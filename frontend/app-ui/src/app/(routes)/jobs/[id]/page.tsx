"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Job } from "@/lib/types/jobs";
import type { JobApplication } from "@/lib/types/applications";
import {
  applyToJob,
  fetchJob,
  fetchJobApplications,
} from "@/lib/api/jobs";
import {
  acceptApplication,
  rejectApplication,
} from "@/lib/api/employer";
import { fileComplaint } from "@/lib/api/complaints";
import type { ApiError } from "@/lib/api/http";
import { getSkillLabel } from "@/lib/constants/skills";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = Number(params.id);
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [complaintReason, setComplaintReason] = useState("");
  const [complaintMessage, setComplaintMessage] = useState<string | null>(null);

  const isWorker = user?.role === "WORKER";
  const isEmployerOwner = user?.role === "EMPLOYER" && user.id === job?.employerId;

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchJob(jobId);
        setJob(data);
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Failed to load job");
      } finally {
        setIsLoading(false);
      }
    }

    if (!Number.isNaN(jobId)) {
      load();
    }
  }, [jobId]);

  useEffect(() => {
    async function loadApplications() {
      if (!isEmployerOwner) return;
      setAppsLoading(true);
      try {
        const list = await fetchJobApplications(jobId);
        setApplications(list);
      } catch {
        // owner-only; ignore for now
        setApplications([]);
      } finally {
        setAppsLoading(false);
      }
    }

    loadApplications();
  }, [isEmployerOwner, jobId]);

  async function handleApply() {
    setActionMessage(null);
    try {
      const app = await applyToJob(jobId);
      setActionMessage("Application submitted successfully.");
      // optimistic state to indicate user has applied
      setApplications((prev) => [...prev, app]);
    } catch (err) {
      const e = err as ApiError;
      setActionMessage(e.message ?? "Could not apply for this job.");
    }
  }

  async function handleComplaintSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!complaintReason.trim()) return;
    setComplaintMessage(null);
    try {
      await fileComplaint({ jobId, reason: complaintReason.trim() });
      setComplaintMessage("Complaint submitted. We will review it soon.");
      setComplaintReason("");
    } catch (err) {
      const e = err as ApiError;
      setComplaintMessage(e.message ?? "Failed to submit complaint.");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">Loading job...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-red-600">
          {error ?? "Job not found or failed to load."}
        </p>
      </div>
    );
  }

  const canWorkerApply =
    isWorker && (job.status === "CHUA_LAM" || job.status === "DANG_BAN_GIAO");

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <header className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {job.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">{job.description}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-sky-700">
              {job.price.toLocaleString("vi-VN")} đ
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {job.status}
            </p>
          </div>
        </header>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-700">Address: </span>
            {job.address}
          </p>
          <p>
            <span className="font-medium text-slate-700">Required skill: </span>
            {getSkillLabel(job.requiredSkill)}
          </p>
          {(job.employerName || job.employerPhone) && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Người đăng việc
              </p>
              {job.employerName && (
                <p>
                  <span className="font-medium text-slate-700">Họ tên: </span>
                  {job.employerName}
                </p>
              )}
              {job.employerPhone && (
                <p className="mt-1">
                  <span className="font-medium text-slate-700">Số điện thoại: </span>
                  {job.employerPhone}
                </p>
              )}
            </div>
          )}
        </div>

        {canWorkerApply && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Apply for this job
            </button>
          </div>
        )}

        {actionMessage && (
          <p className="mt-3 text-sm text-slate-700">{actionMessage}</p>
        )}

        {user && (
          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              File a complaint
            </h3>
            <p className="text-xs text-slate-600">
              Tell us if there is an issue with this job or participant.
            </p>
            <form onSubmit={handleComplaintSubmit} className="mt-3 flex flex-col gap-2">
              <textarea
                value={complaintReason}
                onChange={(e) => setComplaintReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Describe the problem"
              />
              <button
                type="submit"
                className="self-start rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
              >
                Submit complaint
              </button>
            </form>
            {complaintMessage && (
              <p className="mt-2 text-xs text-slate-700">{complaintMessage}</p>
            )}
          </div>
        )}
      </section>

      {isEmployerOwner && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Applications
          </h2>
          {appsLoading ? (
            <p className="mt-2 text-sm text-slate-600">
              Loading applications...
            </p>
          ) : applications.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              No applications yet. Workers who apply will appear here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {app.worker?.fullName ?? `Worker #${app.workerId}`}{" "}
                      <span className="text-xs text-slate-500">
                        (ID: {app.workerId})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Status: {app.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const updated = await acceptApplication(
                            jobId,
                            app.workerId,
                          );
                          setApplications((prev) =>
                            prev.map((p) =>
                              p.id === app.id ? { ...p, status: updated.status } : p,
                            ),
                          );
                        } catch {
                          // ignore for now
                        }
                      }}
                      className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const updated = await rejectApplication(
                            jobId,
                            app.workerId,
                          );
                          setApplications((prev) =>
                            prev.map((p) =>
                              p.id === app.id ? { ...p, status: updated.status } : p,
                            ),
                          );
                        } catch {
                          // ignore for now
                        }
                      }}
                      className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}


