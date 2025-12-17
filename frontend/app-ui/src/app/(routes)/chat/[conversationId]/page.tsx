"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { fetchConversation, fetchConversations, markConversationAsRead } from "@/lib/api/chat";
import type { Conversation } from "@/lib/types/chat";
import { ChatWindow } from "@/app/components/chat/ChatWindow";
import { ConversationList } from "@/app/components/chat/ConversationList";
import type { ApiError } from "@/lib/api/http";

function ChatWindowPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, status } = useAuth();
  const conversationId = parseInt(params.conversationId as string);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated =
    status === "authenticated" &&
    (user?.role === "EMPLOYER" || user?.role === "WORKER");

  // Load conversation
  useEffect(() => {
    async function load() {
      if (!isAuthenticated || !conversationId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchConversation(conversationId);
        setConversation(data as Conversation);
        // Mark as read when opening
        await markConversationAsRead(conversationId);
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Không thể tải cuộc trò chuyện.");
        if (e.status === 404) {
          router.push("/chat");
        }
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [conversationId, isAuthenticated, router]);

  // Load conversations list for sidebar
  useEffect(() => {
    async function load() {
      if (!isAuthenticated) return;
      try {
        const data = await fetchConversations(20, 0);
        setConversations(data);
      } catch (err) {
        console.error("Error loading conversations:", err);
      }
    }

    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-red-600">
          Bạn cần đăng nhập với tư cách Employer hoặc Worker để sử dụng tính năng chat.
        </p>
      </div>
    );
  }

  if (isLoading && !conversation) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-slate-600">Đang tải cuộc trò chuyện...</p>
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl py-8">
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Sidebar - hidden on mobile */}
        <aside className="hidden md:block">
          <div className="sticky top-8 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Cuộc trò chuyện</h2>
            <ConversationList conversations={conversations} isLoading={false} />
          </div>
        </aside>

        {/* Main chat window */}
        <main>
          <ChatWindow conversation={conversation} />
        </main>
      </div>
    </div>
  );
}

export default function ChatWindowPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </div>
    }>
      <ChatWindowPageContent />
    </Suspense>
  );
}

