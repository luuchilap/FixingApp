/**
 * Notifications controller
 * Handles notification operations
 */

const db = require('../../config/db');

/**
 * Get user's notifications
 */
function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { unreadOnly } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = db.prepare(query).all(...params);

    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      userId: notif.user_id,
      content: notif.content,
      isRead: notif.is_read === 1,
      createdAt: notif.created_at
    }));

    res.status(200).json(formattedNotifications);
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as read
 */
function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Get notification and verify ownership
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?')
      .get(parseInt(notificationId));

    if (!notification) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found'
      });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only mark your own notifications as read'
      });
    }

    // Update notification
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?')
      .run(parseInt(notificationId));

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
function sendNotification(userId, content) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO notifications (user_id, content, is_read, created_at)
    VALUES (?, ?, 0, ?)
  `).run(userId, content, now);
}

module.exports = {
  getNotifications,
  markAsRead,
  sendNotification
};

