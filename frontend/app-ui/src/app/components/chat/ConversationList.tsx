"use client";

import type { Conversation } from "@/lib/types/chat";
import { ConversationItem } from "./ConversationItem";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
}

export function ConversationList({
  conversations,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Đang tải cuộc trò chuyện...
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-600">
          Chưa có cuộc trò chuyện nào. Bắt đầu chat với người khác để xem cuộc trò chuyện ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((conversation) => (
        <ConversationItem key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}

