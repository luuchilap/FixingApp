/**
 * Chat API client functions
 */

import { apiGet, apiPost, apiPut } from "./http";
import type {
  Conversation,
  Message,
  MessagesResponse,
  CreateConversationRequest,
  SendMessageRequest,
} from "../types/chat";

export async function fetchConversations(
  limit?: number,
  offset?: number
): Promise<Conversation[]> {
  const query: Record<string, unknown> = {};
  if (limit !== undefined) query.limit = limit;
  if (offset !== undefined) query.offset = offset;
  return apiGet<Conversation[]>("/api/conversations", { query, auth: true });
}

export async function fetchConversation(
  conversationId: number
): Promise<Conversation> {
  return apiGet<Conversation>(`/api/conversations/${conversationId}`, {
    auth: true,
  });
}

export async function createConversation(
  data: CreateConversationRequest
): Promise<Conversation> {
  return apiPost<CreateConversationRequest, Conversation>("/api/conversations", data, { auth: true });
}

export async function fetchMessages(
  conversationId: number,
  limit?: number,
  before?: number
): Promise<MessagesResponse> {
  const query: Record<string, unknown> = {};
  if (limit !== undefined) query.limit = limit;
  if (before !== undefined) query.before = before;
  return apiGet<MessagesResponse>(
    `/api/conversations/${conversationId}/messages`,
    { query, auth: true }
  );
}

export async function sendMessage(
  conversationId: number | null,
  data: SendMessageRequest
): Promise<Message> {
  if (conversationId) {
    return apiPost<SendMessageRequest, Message>(
      `/api/conversations/${conversationId}/messages`,
      data,
      { auth: true }
    );
  } else {
    // Create new conversation and send first message
    if (!data.jobId || !data.workerId) {
      throw new Error("jobId and workerId are required for new conversations");
    }
    // Send message to new conversation endpoint
    const messageData = {
      content: data.content,
      messageType: data.messageType || "TEXT",
      jobId: data.jobId,
      workerId: data.workerId,
    };
    return apiPost<typeof messageData, Message>("/api/conversations/messages", messageData, {
      auth: true,
    });
  }
}

export async function markConversationAsRead(
  conversationId: number
): Promise<{ success: boolean; readCount: number }> {
  return apiPut<{}, { success: boolean; readCount: number }>(
    `/api/conversations/${conversationId}/read`,
    {},
    { auth: true }
  );
}

export async function getUnreadCount(
  conversationId: number
): Promise<{ unreadCount: number }> {
  return apiGet<{ unreadCount: number }>(
    `/api/conversations/${conversationId}/unread`,
    { auth: true }
  );
}

export async function getTotalUnreadCount(): Promise<{ totalUnreadCount: number }> {
  return apiGet<{ totalUnreadCount: number }>(
    "/api/conversations/unread/total",
    { auth: true }
  );
}

