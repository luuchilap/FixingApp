/**
 * Notifications controller
 * Handles notification operations
 */

const db = require('../../config/db');

/**
 * Get user's notifications
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notificationsResult = await db.query(query, params);

    const formattedNotifications = notificationsResult.rows.map(notif => ({
      id: notif.id,
      userId: notif.user_id,
      content: notif.content,
      isRead: notif.is_read === true,
      createdAt: typeof notif.created_at === 'string' ? parseInt(notif.created_at, 10) : notif.created_at
    }));

    res.status(200).json(formattedNotifications);
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
async function sendNotification(userId, content) {
  const now = Date.now();
  await db.query(`
    INSERT INTO notifications (user_id, content, is_read, created_at)
    VALUES ($1, $2, FALSE, $3)
  `, [userId, content, now]);
}

module.exports = {
  getNotifications,
  markAsRead,
  sendNotification
};
