"use client";

import { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api/system";

export default function HealthPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchHealth();
        setStatus(res.status);
        setUptime(res.uptime ?? null);
        setTimestamp(res.timestamp ?? null);
      } catch {
        setError("Health endpoint is unreachable.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">System health</h1>
        <p className="text-sm text-slate-600">
          Backend service heartbeat and uptime from /health.
        </p>
      </header>

      {loading && <p className="text-sm text-slate-600">Checking health...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-700">
            Status:{" "}
            <span
              className={`font-semibold ${
                status === "ok" ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {status ?? "unknown"}
            </span>
          </p>
          {uptime !== null && (
            <p className="text-sm text-slate-700">
              Uptime: {(uptime / 60).toFixed(1)} minutes
            </p>
          )}
          {timestamp && (
            <p className="text-xs text-slate-500">Timestamp: {timestamp}</p>
          )}
        </div>
      )}
    </div>
  );
}


