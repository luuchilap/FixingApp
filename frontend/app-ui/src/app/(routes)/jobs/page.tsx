"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchJobs } from "@/lib/api/jobs";
import type { Job } from "@/lib/types/jobs";
import { JobFilters } from "../../components/jobs/JobFilters";
import { JobList } from "../../components/jobs/JobList";

function JobsPageContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchJobs({
          q: searchParams.get("q") ?? undefined,
          skill: searchParams.get("skill") ?? undefined,
          minPrice: searchParams.get("minPrice")
            ? Number(searchParams.get("minPrice"))
            : undefined,
          maxPrice: searchParams.get("maxPrice")
            ? Number(searchParams.get("maxPrice"))
            : undefined,
        });
        setJobs(data);
      } catch {
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
        <p className="mt-2 text-sm text-slate-600">
          Filter jobs by keyword, skill, and price range. Results come directly
          from the backend.
        </p>
      </header>

      <JobFilters />
      <JobList jobs={jobs} isLoading={isLoading} />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-5xl space-y-4 py-8">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
          <p className="mt-2 text-sm text-slate-600">
            Filter jobs by keyword, skill, and price range. Results come directly
            from the backend.
          </p>
        </header>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading...
        </div>
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  );
}


