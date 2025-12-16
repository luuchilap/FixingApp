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
        <Image
          src={job.images?.[0]?.url ?? "/img_placeholder.jpg"}
          alt={job.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={false}
        />
        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700">
          {job.status}
        </div>
      </div>

      <article className="flex flex-1 flex-col gap-2 p-4">
        <header className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
            {job.title}
          </h3>
          <span className="text-sm font-semibold text-sky-700 whitespace-nowrap">
            {job.price.toLocaleString("vi-VN")} đ
          </span>
        </header>
        <p className="line-clamp-2 text-sm text-slate-600">
          {job.description}
        </p>
        <p className="text-xs text-slate-500">{job.address}</p>
        <footer className="mt-auto flex items-center justify-between text-xs text-slate-500">
          <span>{getSkillLabel(job.requiredSkill)}</span>
        </footer>
      </article>
    </Link>
  );
}


