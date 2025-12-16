import type { Job } from "@/lib/types/jobs";
import { JobCard } from "./JobCard";

interface JobListProps {
  jobs?: Job[];
  isLoading: boolean;
}

export function JobList({ jobs, isLoading }: JobListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Loading jobs...
      </div>
    );
  }

  const list = jobs ?? [];

  if (!list.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        No jobs found. Try adjusting your filters or search keywords.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {list.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}


