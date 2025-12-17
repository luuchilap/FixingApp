"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conversation, Message } from "@/lib/types/chat";
import { fetchMessages, sendMessage as apiSendMessage } from "@/lib/api/chat";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChatHeader } from "./ChatHeader";
import type { ApiError } from "@/lib/api/http";

interface ChatWindowProps {
  conversation: Conversation;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Load messages
  const loadMessages = useCallback(
    async (before?: number, append = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchMessages(conversation.id, 50, before);
        if (append) {
          setMessages((prev) => [...response.messages, ...prev]);
        } else {
          setMessages(response.messages);
        }
        setHasMore(response.hasMore);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "Không thể tải tin nhắn");
        console.error("Error loading messages:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [conversation.id]
  );

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Polling for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if we have messages (to get the latest timestamp)
      if (messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        loadMessages(latestMessage.createdAt + 1, false);
      } else {
        loadMessages();
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [messages, loadMessages]);

  // Load more messages
  const handleLoadMore = useCallback(() => {
    if (messages.length > 0 && hasMore && !isLoading) {
      const oldestMessage = messages[0];
      loadMessages(oldestMessage.createdAt, true);
    }
  }, [messages, hasMore, isLoading, loadMessages]);

  // Send message
  const handleSend = useCallback(
    async (content: string) => {
      setIsSending(true);
      setError(null);
      try {
        const newMessage = await apiSendMessage(conversation.id, {
          content,
          messageType: "TEXT",
        });
        setMessages((prev) => [...prev, newMessage]);
        // Reload to get updated conversation state
        setTimeout(() => loadMessages(), 500);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "Không thể gửi tin nhắn");
        console.error("Error sending message:", err);
      } finally {
        setIsSending(false);
      }
    },
    [conversation.id, loadMessages]
  );

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:h-[600px]">
      <ChatHeader conversation={conversation} />
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
      />
      <MessageInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}

