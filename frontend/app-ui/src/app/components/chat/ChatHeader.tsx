"use client";

import { useRouter } from "next/navigation";
import type { Conversation } from "@/lib/types/chat";
import { useAuth } from "@/lib/hooks/useAuth";

interface ChatHeaderProps {
  conversation: Conversation;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEmployer = user?.role === "EMPLOYER";

  const otherPersonName = isEmployer
    ? conversation.workerName
    : conversation.employerName;

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4">
      <button
        onClick={() => router.back()}
        className="md:hidden rounded-md p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M9.293 2.293a1 1 0 011.414 0l7 7a1 1 0 010 1.414l-7 7a1 1 0 01-1.414-1.414L15.586 11H3a1 1 0 110-2h12.586L9.293 3.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-slate-900 line-clamp-1">
          {conversation.jobTitle}
        </h2>
        <p className="text-xs text-slate-600 line-clamp-1">{otherPersonName}</p>
      </div>
    </div>
  );
}

