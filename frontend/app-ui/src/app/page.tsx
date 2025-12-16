"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchJobs } from "../lib/api/jobs";
import type { Job } from "../lib/types/jobs";
import { JobList } from "./components/jobs/JobList";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchJobs({
          q: searchParams.get("q") ?? undefined,
        });
        setJobs(data.slice(0, 5));
      } catch {
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [searchParams]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    q ? params.set("q", q) : params.delete("q");
    router.push(`/jobs?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-8">
      <section className="rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 p-8 text-white shadow-sm">
        <h1 className="text-2xl font-semibold">
          Find trusted workers and jobs in your area
        </h1>
        <p className="mt-2 text-sm text-sky-50">
          Search by skill, address, or job title. Workers can browse and apply
          in a few taps.
        </p>
        <form
          onSubmit={handleSearchSubmit}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-full border border-sky-300 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/70"
            placeholder="Search jobs by title, description, or skill"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
          >
            Search jobs
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Latest jobs
        </h2>
        <JobList jobs={jobs} isLoading={isLoading} />
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="mx-auto flex max-w-5xl flex-col gap-8 py-8">
        <section className="rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 p-8 text-white shadow-sm">
          <h1 className="text-2xl font-semibold">
            Find trusted workers and jobs in your area
          </h1>
          <p className="mt-2 text-sm text-sky-50">
            Search by skill, address, or job title. Workers can browse and apply
            in a few taps.
          </p>
        </section>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading...
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
