/**
 * Notifications controller
 * Handles notification operations
 */

const db = require('../../config/db');

/**
 * Get user's notifications with pagination
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { unreadOnly, page = 1, limit = 20 } = req.query;

    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = FALSE';
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM notifications ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results
    const query = `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitNum, offset);

    const notificationsResult = await db.query(query, params);

    const formattedNotifications = notificationsResult.rows.map(notif => ({
      id: notif.id,
      userId: notif.user_id,
      content: notif.content,
      type: notif.type || null,
      jobId: notif.job_id || null,
      isRead: notif.is_read === true,
      createdAt: typeof notif.created_at === 'string' ? parseInt(notif.created_at, 10) : notif.created_at
    }));

    res.status(200).json({
      data: formattedNotifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: pageNum < Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Get notification and verify ownership
    const notificationResult = await db.query('SELECT * FROM notifications WHERE id = $1', [parseInt(notificationId)]);
    if (notificationResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }
    const notification = notificationResult.rows[0];

    if (notification.user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only mark your own notifications as read'
      });
    }

    // Update notification
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [parseInt(notificationId)]);

    res.status(200).json({
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper function to send notification to a user
 */
async function sendNotification(userId, content, metadata = {}) {
  const now = Date.now();
  const { type = null, jobId = null } = metadata || {};

  await db.query(
    `
    INSERT INTO notifications (user_id, content, type, job_id, is_read, created_at)
    VALUES ($1, $2, $3, $4, FALSE, $5)
  `,
    [userId, content, type, jobId, now]
  );
}

module.exports = {
  getNotifications,
  markAsRead,
  sendNotification
};
