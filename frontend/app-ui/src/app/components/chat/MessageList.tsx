"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types/chat";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function MessageList({
  messages,
  isLoading,
  onLoadMore,
  hasMore,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load more when scrolling to top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !onLoadMore || !hasMore) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && !isLoading) {
        onLoadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, hasMore, isLoading]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-600">Đang tải tin nhắn...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-600">
          Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
    >
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-xs text-sky-600 hover:text-sky-700 disabled:opacity-50"
          >
            {isLoading ? "Đang tải..." : "Tải thêm tin nhắn"}
          </button>
        </div>
      )}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

