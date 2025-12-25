/**
 * Conversations controller
 * Handles conversation and message operations
 */

const db = require('../../config/db');

/**
 * Get or create conversation between employer and worker for a job
 */
async function getOrCreateConversation(jobId, employerId, workerId) {
  // Check if conversation already exists
  const existingResult = await db.query(`
    SELECT * FROM conversations 
    WHERE job_id = $1 AND employer_id = $2 AND worker_id = $3
  `, [jobId, employerId, workerId]);

  if (existingResult.rows.length > 0) {
    return existingResult.rows[0];
  }

  // Create new conversation
  const now = Date.now();
  const result = await db.query(`
    INSERT INTO conversations (job_id, employer_id, worker_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [jobId, employerId, workerId, now, now]);
  
  return result.rows[0];
}

/**
 * List conversations for current user
 */
async function listConversations(req, res, next) {
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
          c.job_id as "jobId",
          c.employer_id as "employerId",
          c.worker_id as "workerId",
          c.employer_unread_count as "unreadCount",
          c.updated_at as "updatedAt",
          c.last_message_at as "lastMessageAt",
          j.title as "jobTitle",
          u_worker.full_name as "workerName",
          u_worker.phone as "workerPhone",
          u_employer.full_name as "employerName",
          u_employer.phone as "employerPhone"
        FROM conversations c
        JOIN jobs j ON c.job_id = j.id
        JOIN users u_worker ON c.worker_id = u_worker.id
        JOIN users u_employer ON c.employer_id = u_employer.id
        WHERE c.employer_id = $1
        ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    } else if (userRole === 'WORKER') {
      // Worker sees conversations where they are the worker
      query = `
        SELECT 
          c.id,
          c.job_id as "jobId",
          c.employer_id as "employerId",
          c.worker_id as "workerId",
          c.worker_unread_count as "unreadCount",
          c.updated_at as "updatedAt",
          c.last_message_at as "lastMessageAt",
          j.title as "jobTitle",
          u_worker.full_name as "workerName",
          u_worker.phone as "workerPhone",
          u_employer.full_name as "employerName",
          u_employer.phone as "employerPhone"
        FROM conversations c
        JOIN jobs j ON c.job_id = j.id
        JOIN users u_worker ON c.worker_id = u_worker.id
        JOIN users u_employer ON c.employer_id = u_employer.id
        WHERE c.worker_id = $1
        ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    } else {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only employers and workers can view conversations'
      });
    }

    const conversationsResult = await db.query(query, params);

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      conversationsResult.rows.map(async (conv) => {
        const lastMessageResult = await db.query(`
          SELECT id, content, sender_id as "senderId", created_at as "createdAt"
          FROM messages
          WHERE conversation_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `, [conv.id]);
        const lastMessage = lastMessageResult.rows[0] || null;

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
      })
    );

    res.status(200).json(conversationsWithMessages);
  } catch (error) {
    next(error);
  }
}

/**
 * Get conversation by ID
 */
async function getConversation(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversationResult = await db.query(`
      SELECT 
        c.id,
        c.job_id as "jobId",
        c.employer_id as "employerId",
        c.worker_id as "workerId",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        j.title as "jobTitle",
        u_worker.full_name as "workerName",
        u_worker.phone as "workerPhone",
        u_employer.full_name as "employerName",
        u_employer.phone as "employerPhone"
      FROM conversations c
      JOIN jobs j ON c.job_id = j.id
      JOIN users u_worker ON c.worker_id = u_worker.id
      JOIN users u_employer ON c.employer_id = u_employer.id
      WHERE c.id = $1
    `, [conversationId]);

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    const conversation = conversationResult.rows[0];

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
async function createConversation(req, res, next) {
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
    const jobResult = await db.query('SELECT employer_id FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

    // Verify worker exists and is a worker
    const workerResult = await db.query(`
      SELECT u.id 
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = 'WORKER'
    `, [workerId]);

    if (workerResult.rows.length === 0) {
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
    const conversation = await getOrCreateConversation(jobId, job.employer_id, workerId);

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
async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before ? parseInt(req.query.before) : null;

    // Verify conversation exists and user is participant
    const conversationResult = await db.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    const conversation = conversationResult.rows[0];

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
        m.conversation_id as "conversationId",
        m.sender_id as "senderId",
        m.content,
        m.message_type as "messageType",
        m.is_read as "isRead",
        m.created_at as "createdAt",
        u.full_name as "senderName"
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
    `;
    const params = [conversationId];
    let paramIndex = 2;

    if (before) {
      query += ` AND m.created_at < $${paramIndex++}`;
      params.push(before);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit + 1); // Fetch one extra to check if there are more

    const messagesResult = await db.query(query, params);
    const messages = messagesResult.rows;
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
async function sendMessage(req, res, next) {
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
      const conversationResult = await db.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
      if (conversationResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Conversation not found'
        });
      }
      conversation = conversationResult.rows[0];

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
      const jobResult = await db.query('SELECT employer_id FROM jobs WHERE id = $1', [bodyJobId]);
      if (jobResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Job not found'
        });
      }
      const job = jobResult.rows[0];

      // Verify worker exists
      const workerResult = await db.query(`
        SELECT u.id 
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1 AND r.name = 'WORKER'
      `, [bodyWorkerId]);

      if (workerResult.rows.length === 0) {
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
      conversation = await getOrCreateConversation(jobId, employerId, workerId);
    }

    // Insert message
    const now = Date.now();
    const messageResult = await db.query(`
      INSERT INTO messages (conversation_id, sender_id, content, message_type, is_read, created_at)
      VALUES ($1, $2, $3, $4, FALSE, $5)
      RETURNING *
    `, [conversation.id, userId, content.trim(), messageType, now]);
    const message = messageResult.rows[0];

    // Update conversation
    await db.query(`
      UPDATE conversations 
      SET updated_at = $1, 
          last_message_at = $1,
          employer_unread_count = CASE 
            WHEN $2 = employer_id THEN 0 
            ELSE employer_unread_count + 1 
          END,
          worker_unread_count = CASE 
            WHEN $2 = worker_id THEN 0 
            ELSE worker_unread_count + 1 
          END
      WHERE id = $3
    `, [now, userId, conversation.id]);

    // Get sender name
    const senderResult = await db.query('SELECT full_name FROM users WHERE id = $1', [userId]);
    const sender = senderResult.rows[0];

    // Return created message
    res.status(201).json({
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderName: sender.full_name,
      content: message.content,
      messageType: message.message_type,
      isRead: message.is_read === true,
      createdAt: message.created_at
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark conversation as read
 */
async function markAsRead(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify conversation exists
    const conversationResult = await db.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    const conversation = conversationResult.rows[0];

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
    const updateResult = await db.query(`
      UPDATE messages 
      SET is_read = TRUE 
      WHERE conversation_id = $1 AND sender_id = $2 AND is_read = FALSE
    `, [conversationId, otherUserId]);

    // Reset unread count
    if (userRole === 'EMPLOYER') {
      await db.query('UPDATE conversations SET employer_unread_count = 0 WHERE id = $1', [conversationId]);
    } else {
      await db.query('UPDATE conversations SET worker_unread_count = 0 WHERE id = $1', [conversationId]);
    }

    res.status(200).json({
      success: true,
      readCount: updateResult.rowCount
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread count for conversation
 */
async function getUnreadCount(req, res, next) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify conversation exists
    const conversationResult = await db.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    const conversation = conversationResult.rows[0];

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
async function getTotalUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let totalUnread = 0;

    if (userRole === 'EMPLOYER') {
      // Sum all employer_unread_count for conversations where user is employer
      const result = await db.query(`
        SELECT COALESCE(SUM(employer_unread_count), 0) as total
        FROM conversations
        WHERE employer_id = $1
      `, [userId]);
      totalUnread = parseInt(result.rows[0].total) || 0;
    } else if (userRole === 'WORKER') {
      // Sum all worker_unread_count for conversations where user is worker
      const result = await db.query(`
        SELECT COALESCE(SUM(worker_unread_count), 0) as total
        FROM conversations
        WHERE worker_id = $1
      `, [userId]);
      totalUnread = parseInt(result.rows[0].total) || 0;
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
