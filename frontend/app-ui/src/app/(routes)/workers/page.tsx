"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWorkers } from "@/lib/api/workers";
import type { Worker } from "@/lib/types/workers";
import { WorkerFilters } from "../../components/workers/WorkerFilters";
import { WorkerList } from "../../components/workers/WorkerList";
import { useAuth } from "@/lib/hooks/useAuth";

function WorkersPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchWorkers({
          skill: searchParams.get("skill") ?? undefined,
          address: searchParams.get("address") ?? undefined,
        });
        setWorkers(data);
      } catch {
        setWorkers([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [searchParams]);

  // Check if user is employer or admin
  if (user && user.role !== "EMPLOYER" && user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">
          Chỉ có employer và admin mới có thể xem danh sách workers.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Danh sách Workers</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tìm kiếm và lọc workers theo skill và địa chỉ.
        </p>
      </header>

      <WorkerFilters />
      <WorkerList workers={workers} isLoading={isLoading} />
    </div>
  );
}

export default function WorkersPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-5xl py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Đang tải...
        </div>
      </div>
    }>
      <WorkersPageContent />
    </Suspense>
  );
}

