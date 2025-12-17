"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchConversations } from "@/lib/api/chat";
import type { Conversation } from "@/lib/types/chat";
import { ConversationList } from "../../components/chat/ConversationList";
import type { ApiError } from "@/lib/api/http";

function ChatPageContent() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated =
    status === "authenticated" &&
    (user?.role === "EMPLOYER" || user?.role === "WORKER");

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchConversations(50, 0);
        setConversations(data);
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Không thể tải cuộc trò chuyện.");
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    }

    load();

    // Poll for new conversations every 10 seconds
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-red-600">
          Bạn cần đăng nhập với tư cách Employer hoặc Worker để sử dụng tính năng chat.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Tin nhắn</h1>
        <p className="mt-2 text-sm text-slate-600">
          Quản lý các cuộc trò chuyện của bạn
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <ConversationList conversations={conversations} isLoading={isLoading} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

