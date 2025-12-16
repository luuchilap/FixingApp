/**
 * Notifications routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const {
  getNotifications,
  markAsRead
} = require('./notifications.controller');

// All routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.post('/:notificationId/read', markAsRead);

module.exports = router;

