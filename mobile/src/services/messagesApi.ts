import api from './api';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  isRead: boolean;
  createdAt: number;
}

export interface Conversation {
  id: number;
  jobId: number;
  jobTitle?: string;
  employerId: number;
  employerName?: string;
  employerPhone?: string;
  workerId: number;
  workerName?: string;
  workerPhone?: string;
  lastMessage?: {
    id: number;
    content: string;
    senderId: number;
    createdAt: number;
  };
  unreadCount: number;
  updatedAt: number;
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
  messageType?: 'TEXT' | 'IMAGE' | 'FILE';
  jobId?: number;
  workerId?: number;
}

/**
 * Get list of conversations for current user
 */
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get<Conversation[]>('/conversations');
  return response.data;
};

/**
 * Get conversation by ID
 */
export const getConversation = async (conversationId: number): Promise<Conversation> => {
  const response = await api.get<Conversation>(`/conversations/${conversationId}`);
  return response.data;
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  data: CreateConversationRequest
): Promise<Conversation> => {
  const response = await api.post<Conversation>('/conversations', data);
  return response.data;
};

/**
 * Get messages in a conversation
 */
export const getMessages = async (
  conversationId: number,
  limit?: number,
  before?: number
): Promise<MessagesResponse> => {
  const params: Record<string, string> = {};
  if (limit) params.limit = limit.toString();
  if (before) params.before = before.toString();

  const response = await api.get<MessagesResponse>(`/conversations/${conversationId}/messages`, {
    params,
  });
  return response.data;
};

/**
 * Send a message
 */
export const sendMessage = async (
  conversationId: number | null,
  data: SendMessageRequest
): Promise<Message> => {
  if (conversationId) {
    const response = await api.post<Message>(`/conversations/${conversationId}/messages`, data);
    return response.data;
  } else {
    // Create new conversation and send message
    const response = await api.post<Message>('/conversations/messages', data);
    return response.data;
  }
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (conversationId: number): Promise<void> => {
  await api.put(`/conversations/${conversationId}/read`);
};

/**
 * Get unread message count for a conversation
 */
export const getUnreadCount = async (conversationId: number): Promise<number> => {
  const response = await api.get<{ unreadCount: number }>(`/conversations/${conversationId}/unread`);
  return response.data.unreadCount;
};

/**
 * Get total unread count for all conversations
 */
export const getTotalUnreadCount = async (): Promise<number> => {
  const response = await api.get<{ unreadCount: number }>('/conversations/unread/total');
  return response.data.unreadCount;
};

