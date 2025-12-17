"use client";

import type { Message } from "@/lib/types/chat";
import { useAuth } from "@/lib/hooks/useAuth";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { user } = useAuth();
  const isOwnMessage = message.senderId === user?.id;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwnMessage
            ? "bg-sky-600 text-white"
            : "bg-slate-100 text-slate-900"
        }`}
      >
        {!isOwnMessage && (
          <p className="mb-1 text-xs font-semibold opacity-80">
            {message.senderName}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>
        <p
          className={`mt-1 text-[10px] ${
            isOwnMessage ? "text-sky-100" : "text-slate-500"
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

