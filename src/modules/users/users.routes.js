/**
 * User routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const {
  getCurrentUser,
  updateCurrentUser
} = require('./users.controller');

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);

module.exports = router;

