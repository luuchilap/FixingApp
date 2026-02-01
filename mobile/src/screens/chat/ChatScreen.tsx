import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  Message,
  Conversation,
  getConversation,
} from '../../services/messagesApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { MainStackParamList } from '../../navigation/MainStack';

type ChatScreenProps = NativeStackScreenProps<MainStackParamList, 'Chat'>;

const parseTimestamp = (timestamp: number | string | null | undefined): Date => {
  if (!timestamp) return new Date(NaN);
  
  // If it's a string, try to parse it
  if (typeof timestamp === 'string') {
    // Check if it's a numeric string (Unix timestamp as string)
    const numValue = Number(timestamp);
    if (!isNaN(numValue)) {
      // It's a numeric string, treat as Unix timestamp
      if (numValue < 100000000000) {
        return new Date(numValue * 1000); // seconds to ms
      }
      return new Date(numValue);
    }
    // Otherwise parse as date string
    return new Date(timestamp);
  }
  
  // If it's a number
  if (timestamp < 100000000000) {
    return new Date(timestamp * 1000); // seconds to ms
  }
  return new Date(timestamp);
};

const formatTime = (timestamp: number | string): string => {
  const date = parseTimestamp(timestamp);
  if (isNaN(date.getTime())) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDate = (timestamp: number | string): string => {
  const date = parseTimestamp(timestamp);
  if (isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hôm nay';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  } else {
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' });
  }
};

export const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();
    loadMessages();
    markAsRead();
  }, [conversationId]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      loadMessages(true); // Silent refresh
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      const conv = await getConversation(conversationId);
      setConversation(conv);
      navigation.setOptions({
        title: conv.workerName || conv.employerName || 'Tin nhắn',
      });
    } catch {}
  };

  const loadMessages = async (silent = false, loadOlder = false) => {
    try {
      if (!silent) setLoading(true);
      
      let before: number | undefined;
      if (loadOlder && messages.length > 0) {
        // Load older messages (pagination)
        const oldestMessage = messages[0];
        before = oldestMessage.createdAt;
      }

      const response = await getMessages(conversationId, 50, before);

      if (loadOlder && messages.length > 0) {
        // Prepend older messages for pagination
        setMessages([...response.messages, ...messages]);
      } else {
        // Initial load or refresh - replace all messages
        setMessages(response.messages);
        // Scroll to bottom after initial load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }

      setHasMore(response.hasMore);
    } catch {} finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await markConversationAsRead(conversationId);
    } catch {}
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const newMessage = await sendMessage(conversationId, {
        content: text,
        messageType: 'TEXT',
      });

      setMessages([...messages, newMessage]);
      await loadConversation(); // Refresh conversation to update last message

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDate =
      !prevMessage ||
      new Date(item.createdAt).toDateString() !==
        new Date(prevMessage.createdAt).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.messageContainer, isMe && styles.messageContainerMe]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            inverted={false}
            onEndReached={() => {
              if (hasMore && !loading && messages.length > 0) {
                loadMessages(true, true); // Load older messages
              }
            }}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              loading && messages.length > 0 ? (
                <ActivityIndicator size="small" color={colors.primary[500]} style={{ marginVertical: spacing[2] }} />
              ) : null
            }
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Nhập tin nhắn..."
              multiline
              maxLength={5000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.sendButtonText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: spacing[3],
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    backgroundColor: colors.background.gray,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  messageContainer: {
    marginBottom: spacing[2],
    alignItems: 'flex-start',
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
    marginLeft: spacing[2],
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderTopLeftRadius: borderRadius.sm,
  },
  messageBubbleMe: {
    backgroundColor: colors.primary[500],
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.sm,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  messageTextMe: {
    color: colors.text.inverse,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: colors.text.inverse,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.white,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    maxHeight: 100,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginRight: spacing[2],
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[300],
    opacity: 0.6,
  },
  sendButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

