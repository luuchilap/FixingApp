import Link from "next/link";
import Image from "next/image";
import type { Job } from "@/lib/types/jobs";
import { getSkillLabel } from "@/lib/constants/skills";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <div className="relative h-44 w-full bg-slate-100">
        {job.images?.[0]?.url ? (
          <Image
            src={job.images[0].url}
            alt={job.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700">
          {job.status}
        </div>
        {/* Skill tag ở góc trên cùng bên phải với nền vàng */}
        {job.requiredSkill && (
          <div className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
            {getSkillLabel(job.requiredSkill)}
          </div>
        )}
      </div>

      <article className="flex flex-1 flex-col gap-2 p-4">
        <header className="flex items-start gap-2">
          <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
            {job.title}
          </h3>
        </header>
        <p className="line-clamp-2 text-sm text-slate-600">
          {job.description}
        </p>
        {/* Thông tin người đăng */}
        {(job.employerName || job.employerPhone) && (
          <div className="flex flex-col gap-1 text-xs text-slate-600">
            {job.employerName && (
              <p className="font-medium text-slate-700">
                Người đăng: <span className="font-normal">{job.employerName}</span>
              </p>
            )}
            {job.employerPhone && (
              <p className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-3.5 w-3.5 flex-shrink-0"
                >
                  <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
                  <path
                    fillRule="evenodd"
                    d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9v1.125A3.375 3.375 0 0012.375 7.5h1.125A3.375 3.375 0 0016.875 4.125V3h.375c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125H8.625A1.125 1.125 0 017.5 19.875V4.125z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{job.employerPhone}</span>
              </p>
            )}
          </div>
        )}
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 flex-shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.796.412l.01.004.01.001.003.001zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
              clipRule="evenodd"
            />
          </svg>
          <span>{job.address}</span>
        </p>
        {/* Giá ở dưới cùng */}
        <footer className="mt-auto pt-2 border-t border-slate-200 flex justify-center">
          <span className="inline-block rounded-lg bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm">
            {job.price.toLocaleString("vi-VN")} đ
          </span>
        </footer>
      </article>
    </Link>
  );
}


