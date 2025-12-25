"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { fetchJobs } from "@/lib/api/jobs";
import type { Job } from "@/lib/types/jobs";
import { JobFilters } from "../../components/jobs/JobFilters";
import { JobList } from "../../components/jobs/JobList";

const JOBS_PER_PAGE = 10;

function JobsPageContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
        // Reset to page 1 when filters change
        setCurrentPage(1);
      } catch {
        setJobs([]);
        setCurrentPage(1);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [searchParams]);

  // Calculate pagination
  const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    return jobs.slice(startIndex, endIndex);
  }, [jobs, currentPage]);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of job list
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
        <p className="mt-2 text-sm text-slate-600">
          Filter jobs by keyword, skill, and price range. Results come directly
          from the backend.
        </p>
        {jobs.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            Hiển thị {paginatedJobs.length} trong tổng số {jobs.length} công việc
          </p>
        )}
      </header>

      <JobFilters />
      <JobList jobs={paginatedJobs} isLoading={isLoading} />

      {/* Pagination */}
      {!isLoading && jobs.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Trước
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => {
                if (page === "...") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-sm text-slate-500"
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
                      isActive
                        ? "bg-sky-600 text-white hover:bg-sky-700"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau →
            </button>
          </div>

          {/* Page info */}
          <p className="text-xs text-slate-500">
            Trang {currentPage} / {totalPages}
          </p>
        </div>
      )}
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


