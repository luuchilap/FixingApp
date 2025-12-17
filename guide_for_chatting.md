# Thiết kế tính năng Chat giữa Employer và Worker

## 1. Tổng quan

Tính năng chat cho phép employer và worker giao tiếp trực tiếp về công việc. Chat được liên kết với job và có thể bắt đầu bất cứ lúc nào:
- Bất kỳ employer nào cũng có thể chat với bất kỳ worker nào về một job
- Bất kỳ worker nào cũng có thể chat với employer của một job
- Không cần worker phải apply vào job trước
- Không cần employer phải accept worker trước

## 2. Database Schema

### 2.1. Bảng `conversations`
Lưu thông tin cuộc trò chuyện giữa employer và worker về một job cụ thể.

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  employer_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_message_at INTEGER, -- Timestamp của tin nhắn cuối cùng
  employer_unread_count INTEGER DEFAULT 0, -- Số tin nhắn chưa đọc của employer
  worker_unread_count INTEGER DEFAULT 0, -- Số tin nhắn chưa đọc của worker
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(job_id, worker_id) -- Mỗi job chỉ có 1 conversation với mỗi worker
);

CREATE INDEX IF NOT EXISTS idx_conversations_job ON conversations(job_id);
CREATE INDEX IF NOT EXISTS idx_conversations_employer ON conversations(employer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_worker ON conversations(worker_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
```

### 2.2. Bảng `messages`
Lưu các tin nhắn trong conversation.

```sql
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL, -- user_id của người gửi
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'TEXT', -- TEXT, IMAGE, FILE
  is_read BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read, sender_id);
```

## 3. Backend API Design

### 3.1. Routes Structure

```
/api/conversations
  GET    /                          - Lấy danh sách conversations của user hiện tại
  POST   /                          - Tạo conversation mới (tự động khi gửi tin nhắn đầu tiên)
  GET    /:conversationId           - Lấy thông tin conversation
  GET    /:conversationId/messages  - Lấy danh sách messages (có pagination)
  POST   /:conversationId/messages  - Gửi tin nhắn mới
  PUT    /:conversationId/read      - Đánh dấu đã đọc
  GET    /:conversationId/unread    - Lấy số tin nhắn chưa đọc
```

### 3.2. API Endpoints Chi tiết

#### 3.2.1. GET /api/conversations
Lấy danh sách conversations của user hiện tại, sắp xếp theo thời gian tin nhắn cuối.

**Request:**
- Headers: `Authorization: Bearer <token>`
- Query params:
  - `limit` (optional, default: 20)
  - `offset` (optional, default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "jobId": 5,
    "jobTitle": "Sửa chữa đường ống nước",
    "employerId": 2,
    "employerName": "Nguyễn Văn A",
    "employerPhone": "0901234567",
    "workerId": 3,
    "workerName": "Lê Văn C",
    "workerPhone": "0913456789",
    "lastMessage": {
      "id": 15,
      "content": "Tôi sẽ đến lúc 2 giờ chiều",
      "senderId": 3,
      "createdAt": 1704067200000
    },
    "unreadCount": 2,
    "updatedAt": 1704067200000
  }
]
```

#### 3.2.2. POST /api/conversations
Tạo conversation mới. Tự động tạo nếu chưa tồn tại khi gửi tin nhắn đầu tiên.

**Request:**
```json
{
  "jobId": 5,
  "workerId": 3
}
```

**Response:**
```json
{
  "id": 1,
  "jobId": 5,
  "employerId": 2,
  "workerId": 3,
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

**Validation:**
- User phải là employer của job hoặc là worker (role: WORKER)
- Chỉ tạo được 1 conversation cho mỗi cặp (jobId, workerId)

#### 3.2.3. GET /api/conversations/:conversationId
Lấy thông tin chi tiết conversation.

**Response:**
```json
{
  "id": 1,
  "jobId": 5,
  "jobTitle": "Sửa chữa đường ống nước",
  "employerId": 2,
  "employerName": "Nguyễn Văn A",
  "workerId": 3,
  "workerName": "Lê Văn C",
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

#### 3.2.4. GET /api/conversations/:conversationId/messages
Lấy danh sách messages trong conversation.

**Request:**
- Query params:
  - `limit` (optional, default: 50)
  - `before` (optional, timestamp) - Lấy messages trước thời điểm này (pagination)

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "conversationId": 1,
      "senderId": 2,
      "senderName": "Nguyễn Văn A",
      "content": "Xin chào, bạn có thể làm việc này không?",
      "messageType": "TEXT",
      "isRead": true,
      "createdAt": 1704067200000
    },
    {
      "id": 2,
      "conversationId": 1,
      "senderId": 3,
      "senderName": "Lê Văn C",
      "content": "Có, tôi có thể làm",
      "messageType": "TEXT",
      "isRead": true,
      "createdAt": 1704067300000
    }
  ],
  "hasMore": false
}
```

#### 3.2.5. POST /api/conversations/:conversationId/messages
Gửi tin nhắn mới.

**Request:**
```json
{
  "content": "Tôi sẽ đến lúc 2 giờ chiều",
  "messageType": "TEXT"
}
```

**Response:**
```json
{
  "id": 15,
  "conversationId": 1,
  "senderId": 3,
  "senderName": "Lê Văn C",
  "content": "Tôi sẽ đến lúc 2 giờ chiều",
  "messageType": "TEXT",
  "isRead": false,
  "createdAt": 1704067400000
}
```

**Validation:**
- User phải là participant trong conversation
- Content không được rỗng
- Tự động tạo conversation nếu chưa tồn tại

#### 3.2.6. PUT /api/conversations/:conversationId/read
Đánh dấu tất cả tin nhắn trong conversation là đã đọc.

**Response:**
```json
{
  "success": true,
  "readCount": 5
}
```

#### 3.2.7. GET /api/conversations/:conversationId/unread
Lấy số tin nhắn chưa đọc của user hiện tại.

**Response:**
```json
{
  "unreadCount": 2
}
```

### 3.3. Business Logic

#### 3.3.1. Tạo Conversation
- Tự động tạo khi gửi tin nhắn đầu tiên
- Chỉ tạo được khi:
  - User là employer của job, HOẶC
  - User là worker (role: WORKER) - không cần apply trước
- Mỗi cặp (jobId, workerId) chỉ có 1 conversation
- Không có ràng buộc về application status

#### 3.3.2. Gửi Tin nhắn
- Tự động tạo conversation nếu chưa tồn tại
- Cập nhật `last_message_at` và `updated_at` của conversation
- Tăng `unread_count` của người nhận
- Reset `unread_count` của người gửi về 0

#### 3.3.3. Đánh dấu Đã đọc
- Khi user đánh dấu đã đọc, cập nhật `is_read = true` cho tất cả messages của người kia
- Reset `unread_count` của user hiện tại về 0

## 4. Frontend Design

### 4.1. Routes

```
/chat                          - Danh sách conversations
/chat/:conversationId          - Chat window với conversation cụ thể
```

### 4.2. Components Structure

```
components/chat/
  ├── ConversationList.tsx     - Sidebar danh sách conversations
  ├── ConversationItem.tsx     - Item trong danh sách conversations
  ├── ChatWindow.tsx           - Main chat window
  ├── MessageList.tsx          - Danh sách messages
  ├── MessageItem.tsx           - Single message item
  ├── MessageInput.tsx         - Input để gửi tin nhắn
  └── ChatHeader.tsx           - Header với thông tin người chat
```

### 4.3. Pages

#### 4.3.1. /chat (Conversation List Page)
- Hiển thị danh sách conversations
- Mỗi item hiển thị:
  - Job title
  - Tên người chat (employer hoặc worker)
  - Tin nhắn cuối cùng (preview)
  - Thời gian tin nhắn cuối
  - Badge số tin nhắn chưa đọc
- Click vào item → navigate đến `/chat/:conversationId`
- Responsive: trên mobile có thể ẩn list khi đang chat

#### 4.3.2. /chat/:conversationId (Chat Window Page)
- Layout 2 cột (desktop):
  - Cột trái: ConversationList (có thể collapse)
  - Cột phải: ChatWindow
- ChatWindow bao gồm:
  - ChatHeader: Job title, tên người chat, nút back (mobile)
  - MessageList: Scrollable list of messages
  - MessageInput: Input field + Send button
- Auto-scroll to bottom khi có tin nhắn mới
- Loading state khi fetch messages
- Infinite scroll để load messages cũ hơn

### 4.4. Real-time Updates

**Option 1: Polling (Đơn giản, phù hợp MVP)**
- Poll `/api/conversations/:conversationId/messages` mỗi 3-5 giây
- Chỉ poll khi user đang ở trong chat window
- Poll `/api/conversations` mỗi 10 giây khi ở conversation list

**Option 2: WebSocket (Tốt hơn, phức tạp hơn)**
- Sử dụng Socket.io hoặc native WebSocket
- Server push messages mới đến client
- Cần thêm WebSocket server

**Recommendation:** Bắt đầu với Polling cho MVP, sau đó nâng cấp lên WebSocket nếu cần.

### 4.5. State Management

Sử dụng React hooks:
- `useState` cho local state
- `useEffect` cho polling
- Custom hook `useConversations()` để fetch và manage conversations
- Custom hook `useMessages(conversationId)` để fetch và manage messages

### 4.6. UI/UX Features

1. **Message Status Indicators:**
   - Hiển thị "Đã gửi" / "Đã đọc" (nếu cần)
   - Timestamp cho mỗi message

2. **Typing Indicator:**
   - Hiển thị "Đang gõ..." khi người kia đang gõ (nếu có WebSocket)

3. **Unread Badge:**
   - Hiển thị số tin nhắn chưa đọc trên conversation item
   - Hiển thị trên icon chat trong header

4. **Message Formatting:**
   - Support line breaks
   - Auto-link URLs
   - Emoji support (optional)

5. **Notifications:**
   - Tích hợp với notification system hiện có
   - Gửi notification khi có tin nhắn mới (nếu user không online)

## 5. Security & Permissions

1. **Authentication:**
   - Tất cả endpoints yêu cầu JWT authentication
   - Verify user là participant trong conversation

2. **Authorization:**
   - User chỉ có thể xem conversations mà họ tham gia
   - User chỉ có thể gửi tin nhắn trong conversations của họ
   - Verify job ownership (cho employer) hoặc worker role (cho worker)
   - Không cần verify application status

3. **Input Validation:**
   - Sanitize message content (prevent XSS)
   - Limit message length (max 5000 characters)
   - Rate limiting cho việc gửi tin nhắn

4. **Data Privacy:**
   - Không expose thông tin nhạy cảm
   - Chỉ hiển thị thông tin cần thiết (tên, số điện thoại)

## 6. Implementation Steps

### Phase 1: Database & Backend
1. Tạo migration cho `conversations` và `messages` tables
2. Implement `conversations.controller.js` với các functions:
   - `listConversations`
   - `getConversation`
   - `createConversation`
   - `getMessages`
   - `sendMessage`
   - `markAsRead`
   - `getUnreadCount`
3. Implement `conversations.routes.js`
4. Test API endpoints với Postman/curl

### Phase 2: Frontend Components
1. Tạo types cho `Conversation` và `Message`
2. Implement API client functions trong `lib/api/chat.ts`
3. Tạo custom hooks: `useConversations`, `useMessages`
4. Implement `ConversationList` component
5. Implement `ChatWindow` component
6. Implement `MessageList` và `MessageItem` components
7. Implement `MessageInput` component

### Phase 3: Pages & Integration
1. Tạo `/chat` page (conversation list)
2. Tạo `/chat/[conversationId]` page (chat window)
3. Thêm link "Chat" vào navigation
4. Thêm notification badge cho unread messages
5. Implement polling logic

### Phase 4: Polish & Testing
1. Add loading states
2. Add error handling
3. Add empty states
4. Test với nhiều users
5. Test responsive design
6. Performance optimization

## 7. Future Enhancements

1. **File/Image Sharing:**
   - Upload images/files
   - Store trong storage service
   - Support preview

2. **Message Search:**
   - Search messages trong conversation
   - Full-text search

3. **Message Reactions:**
   - Like/emoji reactions
   - Reply to specific message

4. **Voice Messages:**
   - Record và gửi voice messages

5. **Group Chat:**
   - Chat với nhiều workers cho 1 job

6. **Message Templates:**
   - Quick replies
   - Pre-defined messages

## 8. Database Migration File

Tạo file: `src/database/migrations/008_chat_schema.js`

```javascript
const db = require('../../config/db');

function up() {
  // Create conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_message_at INTEGER,
      employer_unread_count INTEGER DEFAULT 0,
      worker_unread_count INTEGER DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(job_id, worker_id)
    );
  `);

  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      message_type VARCHAR(20) DEFAULT 'TEXT',
      is_read BOOLEAN DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_job ON conversations(job_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_employer ON conversations(employer_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_worker ON conversations(worker_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read, sender_id);');

  console.log('Chat schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS messages;');
  db.exec('DROP TABLE IF EXISTS conversations;');
  console.log('Chat schema migration rolled back');
}

module.exports = { up, down };
```

## 9. Notes

- Chat được liên kết với job, không phải standalone
- Mỗi job chỉ có 1 conversation với mỗi worker
- Conversation tự động tạo khi gửi tin nhắn đầu tiên
- Unread count được track để hiển thị badge
- Có thể mở rộng thêm features như file sharing, voice messages sau

