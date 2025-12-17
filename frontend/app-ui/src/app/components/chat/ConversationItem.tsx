"use client";

import Link from "next/link";
import type { Conversation } from "@/lib/types/chat";
import { useAuth } from "@/lib/hooks/useAuth";

interface ConversationItemProps {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { user } = useAuth();
  const isEmployer = user?.role === "EMPLOYER";
  
  // Determine the other person's name
  const otherPersonName = isEmployer 
    ? conversation.workerName 
    : conversation.employerName;

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const lastMessageTime = conversation.lastMessage?.createdAt 
    ? formatTime(conversation.lastMessage.createdAt)
    : conversation.updatedAt 
    ? formatTime(conversation.updatedAt)
    : "";

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
            {conversation.jobTitle}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {otherPersonName}
          </p>
        </div>
        {conversation.unreadCount > 0 && (
          <span className="flex-shrink-0 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      
      {conversation.lastMessage && (
        <div className="flex items-center justify-between gap-2">
          <p className="flex-1 text-xs text-slate-600 line-clamp-1">
            {conversation.lastMessage.content}
          </p>
          <span className="flex-shrink-0 text-[10px] text-slate-400">
            {lastMessageTime}
          </span>
        </div>
      )}
    </Link>
  );
}

