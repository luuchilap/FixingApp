/**
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const {
  registerEmployer,
  registerWorker,
  login,
  logout
} = require('./auth.controller');

// Public routes
router.post('/register-employer', registerEmployer);
router.post('/register-worker', registerWorker);
router.post('/login', login);

// Protected route (requires authentication)
const { authenticateToken } = require('../../middlewares/auth.middleware');
router.post('/logout', authenticateToken, logout);

module.exports = router;

