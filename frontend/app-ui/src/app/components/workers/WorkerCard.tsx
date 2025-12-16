import Link from "next/link";
import Image from "next/image";
import type { Worker } from "@/lib/types/workers";
import { getSkillLabel } from "@/lib/constants/skills";

interface WorkerCardProps {
  worker: Worker;
}

export function WorkerCard({ worker }: WorkerCardProps) {
  return (
    <Link
      href={`/workers/${worker.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <div className="relative h-32 w-full bg-gradient-to-br from-sky-100 to-sky-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/80 p-6 text-2xl font-bold text-sky-700">
            {worker.fullName.charAt(0).toUpperCase()}
          </div>
        </div>
        {worker.isVerified && (
          <div className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
            ✓ Đã xác thực
          </div>
        )}
        {worker.skill && (
          <div className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
            {getSkillLabel(worker.skill)}
          </div>
        )}
      </div>

      <article className="flex flex-1 flex-col gap-2 p-4">
        <header>
          <h3 className="text-base font-semibold text-slate-900">
            {worker.fullName}
          </h3>
        </header>
        
        {worker.address && (
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
            <span className="line-clamp-1">{worker.address}</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-yellow-400"
            >
              <path
                fillRule="evenodd"
                d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-semibold text-slate-700">
              {worker.avgRating > 0 ? worker.avgRating.toFixed(1) : "Chưa có đánh giá"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

