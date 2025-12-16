import type { Worker } from "@/lib/types/workers";
import { WorkerCard } from "./WorkerCard";

interface WorkerListProps {
  workers: Worker[];
  isLoading: boolean;
}

export function WorkerList({ workers, isLoading }: WorkerListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Đang tải danh sách workers...
      </div>
    );
  }

  if (!workers.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        Không tìm thấy worker nào. Hãy thử điều chỉnh bộ lọc.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workers.map((worker) => (
        <WorkerCard key={worker.id} worker={worker} />
      ))}
    </div>
  );
}

