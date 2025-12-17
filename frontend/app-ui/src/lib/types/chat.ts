/**
 * Chat-related TypeScript types
 */

export interface Conversation {
  id: number;
  jobId: number;
  jobTitle: string;
  employerId: number;
  employerName: string;
  employerPhone: string;
  workerId: number;
  workerName: string;
  workerPhone: string;
  lastMessage?: {
    id: number;
    content: string;
    senderId: number;
    createdAt: number;
  } | null;
  unreadCount: number;
  updatedAt: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
  isRead: boolean;
  createdAt: number;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface CreateConversationRequest {
  jobId: number;
  workerId: number;
}

export interface SendMessageRequest {
  content: string;
  messageType?: "TEXT" | "IMAGE" | "FILE";
  jobId?: number; // For creating new conversation
  workerId?: number; // For creating new conversation
}

