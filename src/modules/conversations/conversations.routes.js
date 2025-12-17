/**
 * Conversations routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const {
  listConversations,
  getConversation,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getTotalUnreadCount
} = require('./conversations.controller');

// All conversation routes require authentication
router.use(authenticateToken);
// Only employers and workers can access conversations
router.use(requireRole('EMPLOYER', 'WORKER'));

// Conversation list and creation
router.get('/', listConversations);
router.post('/', createConversation);

// Send message to new conversation (create conversation and send first message)
router.post('/messages', sendMessage);

// Total unread count (must be before /:conversationId routes)
router.get('/unread/total', getTotalUnreadCount);

// Individual conversation operations
router.get('/:conversationId', getConversation);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);
router.put('/:conversationId/read', markAsRead);
router.get('/:conversationId/unread', getUnreadCount);

module.exports = router;

