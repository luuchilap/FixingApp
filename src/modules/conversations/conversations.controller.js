/**
 * Conversations controller
 * Handles conversation and message operations
 */

const db = require('../../config/db');

/**
 * Get or create conversation between employer and worker for a job
 */
function getOrCreateConversation(jobId, employerId, workerId) {
  // Check if conversation already exists
  let conversation = db.prepare(`
    SELECT * FROM conversations 
    WHERE job_id = ? AND employer_id = ? AND worker_id = ?
  `).get(jobId, employerId, workerId);

  if (conversation) {
    return conversation;
  }

  // Create new conversation
  const now = Date.now();
  const insertConversation = db.prepare(`
    INSERT INTO conversations (job_id, employer_id, worker_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = insertConversation.run(jobId, employerId, workerId, now, now);
  conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
  
  return conversation;
}

/**
 * List conversations for current user
 */
function listConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let query;
    let params;

    if (userRole === 'EMPLOYER') {
      // Employer sees conversations where they are the employer
      query = `
        SELECT 
          c.id,
          c.job_id as jobId,
          c.employer_id as employerId,
          c.worker_id as workerId,
          c.employer_unread_count as unreadCount,
          c.updated_at as updatedAt,
          c.last_message_at as lastMessageAt,
          j.title as jobTitle,
          u_worker.full_name as workerName,
          u_worker.phone as workerPhone,
          u_employer.full_name as employerName,
          u_employer.phone as employerPhone
        FROM conversations c
        JOIN jobs j ON c.job_id = j.id
        JOIN users u_worker ON c.worker_id = u_worker.id
        JOIN users u_employer ON c.employer_id = u_employer.id
        WHERE c.employer_id = ?
        ORDER BY c.last_message_at DESC, c.updated_at DESC
        LIMIT ? OFFSET ?
      `;
      params = [userId, limit, offset];
    } else if (userRole === 'WORKER') {
      // Worker sees conversations where they are the worker
      query = `
        SELECT 
          c.id,
          c.job_id as jobId,
          c.employer_id as employerId,
          c.worker_id as workerId,
          c.worker_unread_count as unreadCount,
          c.updated_at as updatedAt,
          c.last_message_at as lastMessageAt,
          j.title as jobTitle,
          u_worker.full_name as workerName,
          u_worker.phone as workerPhone,
          u_employer.full_name as employerName,
          u_employer.phone as employerPhone
        FROM conversations c
        JOIN jobs j ON c.job_id = j.id
        JOIN users u_worker ON c.worker_id = u_worker.id
        JOIN users u_employer ON c.employer_id = u_employer.id
        WHERE c.worker_id = ?
        ORDER BY c.last_message_at DESC, c.updated_at DESC
        LIMIT ? OFFSET ?
      `;
      params = [userId, limit, offset];
    } else {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only employers and workers can view conversations'
      });
    }

    const conversations = db.prepare(query).all(...params);

    // Get last message for each conversation
    const conversationsWithMessages = conversations.map(conv => {
      const lastMessage = db.prepare(`
        SELECT id, content, sender_id as senderId, created_at as createdAt
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(conv.id);

      return {
        id: conv.id,
        jobId: conv.jobId,
        jobTitle: conv.jobTitle,
        employerId: conv.employerId,
        employerName: conv.employerName,
        employerPhone: conv.employerPhone,
        workerId: conv.workerId,
        workerName: conv.workerName,
        workerPhone: conv.workerPhone,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt
        } : null,
        unreadCount: conv.unreadCount || 0,
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json(conversationsWithMessages);
  } catch (error) {
    next(error);
  }
}

/**
 * Get conversation by ID
 */
function getConversation(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = db.prepare(`
      SELECT 
        c.id,
        c.job_id as jobId,
        c.employer_id as employerId,
        c.worker_id as workerId,
        c.created_at as createdAt,
        c.updated_at as updatedAt,
        j.title as jobTitle,
        u_worker.full_name as workerName,
        u_worker.phone as workerPhone,
        u_employer.full_name as employerName,
        u_employer.phone as employerPhone
      FROM conversations c
      JOIN jobs j ON c.job_id = j.id
      JOIN users u_worker ON c.worker_id = u_worker.id
      JOIN users u_employer ON c.employer_id = u_employer.id
      WHERE c.id = ?
    `).get(conversationId);

    if (!conversation) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }

    // Verify user is a participant
    if (userRole === 'EMPLOYER' && conversation.employerId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view this conversation'
      });
    }
    if (userRole === 'WORKER' && conversation.workerId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view this conversation'
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
}

/**
 * Create conversation
 */
function createConversation(req, res, next) {
  try {
    const { jobId, workerId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation
    if (!jobId || !workerId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and workerId are required'
      });
    }

    // Verify job exists
    const job = db.prepare('SELECT employer_id FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    // Verify worker exists and is a worker
    const worker = db.prepare(`
      SELECT u.id 
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ? AND r.name = 'WORKER'
    `).get(workerId);

    if (!worker) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Worker not found'
      });
    }

    // Authorization: User must be employer of job OR be the worker
    if (userRole === 'EMPLOYER' && job.employer_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not the employer of this job'
      });
    }
    if (userRole === 'WORKER' && workerId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only create conversations for yourself'
      });
    }

    // Get or create conversation
    const conversation = getOrCreateConversation(jobId, job.employer_id, workerId);

    res.status(200).json({
      id: conversation.id,
      jobId: conversation.job_id,
      employerId: conversation.employer_id,
      workerId: conversation.worker_id,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get messages in a conversation
 */
function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before ? parseInt(req.query.before) : null;

    // Verify conversation exists and user is participant
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }

    // Verify user is a participant
    if (userRole === 'EMPLOYER' && conversation.employer_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view this conversation'
      });
    }
    if (userRole === 'WORKER' && conversation.worker_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view this conversation'
      });
    }

    // Build query
    let query = `
      SELECT 
        m.id,
        m.conversation_id as conversationId,
        m.sender_id as senderId,
        m.content,
        m.message_type as messageType,
        m.is_read as isRead,
        m.created_at as createdAt,
        u.full_name as senderName
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
    `;
    const params = [conversationId];

    if (before) {
      query += ' AND m.created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(limit + 1); // Fetch one extra to check if there are more

    const messages = db.prepare(query).all(...params);
    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // Reverse to get chronological order (oldest first)
    resultMessages.reverse();

    res.status(200).json({
      messages: resultMessages,
      hasMore
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send a message
 */
function sendMessage(req, res, next) {
  try {
    const conversationId = req.params.conversationId || null;
    const { content, messageType = 'TEXT' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Message content cannot be empty'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Message content is too long (max 5000 characters)'
      });
    }

    let conversation = null;
    let jobId = null;
    let employerId = null;
    let workerId = null;

    if (conversationId) {
      // Existing conversation
      conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
      if (!conversation) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Conversation not found'
        });
      }

      // Verify user is participant
      if (userRole === 'EMPLOYER' && conversation.employer_id !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not authorized to send messages in this conversation'
        });
      }
      if (userRole === 'WORKER' && conversation.worker_id !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not authorized to send messages in this conversation'
        });
      }

      jobId = conversation.job_id;
      employerId = conversation.employer_id;
      workerId = conversation.worker_id;
    } else {
      // New conversation - need jobId and workerId from body
      const { jobId: bodyJobId, workerId: bodyWorkerId } = req.body;
      if (!bodyJobId || !bodyWorkerId) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'jobId and workerId are required for new conversations'
        });
      }

      // Verify job exists
      const job = db.prepare('SELECT employer_id FROM jobs WHERE id = ?').get(bodyJobId);
      if (!job) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Job not found'
        });
      }

      // Verify worker exists
      const worker = db.prepare(`
        SELECT u.id 
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ? AND r.name = 'WORKER'
      `).get(bodyWorkerId);

      if (!worker) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Worker not found'
        });
      }

      // Authorization
      if (userRole === 'EMPLOYER' && job.employer_id !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not the employer of this job'
        });
      }
      if (userRole === 'WORKER' && bodyWorkerId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only create conversations for yourself'
        });
      }

      jobId = bodyJobId;
      employerId = job.employer_id;
      workerId = bodyWorkerId;

      // Get or create conversation
      conversation = getOrCreateConversation(jobId, employerId, workerId);
    }

    // Insert message
    const now = Date.now();
    const insertMessage = db.prepare(`
      INSERT INTO messages (conversation_id, sender_id, content, message_type, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    
    const result = insertMessage.run(conversation.id, userId, content.trim(), messageType, now);
    const messageId = result.lastInsertRowid;

    // Update conversation
    const updateConversation = db.prepare(`
      UPDATE conversations 
      SET updated_at = ?, 
          last_message_at = ?,
          employer_unread_count = CASE 
            WHEN ? = employer_id THEN 0 
            ELSE employer_unread_count + 1 
          END,
          worker_unread_count = CASE 
            WHEN ? = worker_id THEN 0 
            ELSE worker_unread_count + 1 
          END
      WHERE id = ?
    `);
    updateConversation.run(now, now, userId, userId, conversation.id);

    // Get sender name
    const sender = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId);

    // Return created message
    const message = db.prepare(`
      SELECT 
        id,
        conversation_id as conversationId,
        sender_id as senderId,
        content,
        message_type as messageType,
        is_read as isRead,
        created_at as createdAt
      FROM messages
      WHERE id = ?
    `).get(messageId);

    res.status(201).json({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: sender.full_name,
      content: message.content,
      messageType: message.messageType,
      isRead: message.isRead === 1,
      createdAt: message.createdAt
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark conversation as read
 */
function markAsRead(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify conversation exists
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }

    // Verify user is participant
    if (userRole === 'EMPLOYER' && conversation.employer_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to mark this conversation as read'
      });
    }
    if (userRole === 'WORKER' && conversation.worker_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to mark this conversation as read'
      });
    }

    // Mark all messages from the other person as read
    const otherUserId = userRole === 'EMPLOYER' ? conversation.worker_id : conversation.employer_id;
    const updateMessages = db.prepare(`
      UPDATE messages 
      SET is_read = 1 
      WHERE conversation_id = ? AND sender_id = ? AND is_read = 0
    `);
    const result = updateMessages.run(conversationId, otherUserId);

    // Reset unread count
    if (userRole === 'EMPLOYER') {
      db.prepare('UPDATE conversations SET employer_unread_count = 0 WHERE id = ?').run(conversationId);
    } else {
      db.prepare('UPDATE conversations SET worker_unread_count = 0 WHERE id = ?').run(conversationId);
    }

    res.status(200).json({
      success: true,
      readCount: result.changes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread count for conversation
 */
function getUnreadCount(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify conversation exists
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }

    // Verify user is participant
    if (userRole === 'EMPLOYER' && conversation.employer_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view this conversation'
      });
    }
    if (userRole === 'WORKER' && conversation.worker_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to view this conversation'
      });
    }

    const unreadCount = userRole === 'EMPLOYER' 
      ? conversation.employer_unread_count 
      : conversation.worker_unread_count;

    res.status(200).json({
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get total unread count for all conversations of current user
 */
function getTotalUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let totalUnread = 0;

    if (userRole === 'EMPLOYER') {
      // Sum all employer_unread_count for conversations where user is employer
      const result = db.prepare(`
        SELECT COALESCE(SUM(employer_unread_count), 0) as total
        FROM conversations
        WHERE employer_id = ?
      `).get(userId);
      totalUnread = result.total || 0;
    } else if (userRole === 'WORKER') {
      // Sum all worker_unread_count for conversations where user is worker
      const result = db.prepare(`
        SELECT COALESCE(SUM(worker_unread_count), 0) as total
        FROM conversations
        WHERE worker_id = ?
      `).get(userId);
      totalUnread = result.total || 0;
    }

    res.status(200).json({
      totalUnreadCount: totalUnread
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listConversations,
  getConversation,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getTotalUnreadCount
};

