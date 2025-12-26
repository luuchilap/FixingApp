"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RegisterTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterTypeModal({ isOpen, onClose }: RegisterTypeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  function handleSelect(type: "employer" | "worker") {
    router.push(`/register/${type}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Chọn loại tài khoản
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-600">
          Bạn muốn đăng ký với tư cách là?
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleSelect("employer")}
            className="flex flex-col items-start rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-sky-500 hover:bg-sky-50"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-full bg-sky-100 p-2">
                <svg
                  className="h-5 w-5 text-sky-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Người thuê (Employer)
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Đăng công việc và tìm kiếm người làm việc phù hợp
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("worker")}
            className="flex flex-col items-start rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-sky-500 hover:bg-sky-50"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-full bg-sky-100 p-2">
                <svg
                  className="h-5 w-5 text-sky-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Người làm việc (Worker)
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Tìm kiếm và ứng tuyển vào các công việc phù hợp với kỹ năng của bạn
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

