/**
 * Admin Panel routes (public - no auth required)
 * For admin web interface
 */

const express = require('express');
const router = express.Router();
const { getAllUsers, toggleUserLock, setVerificationStatus } = require('./admin-panel.controller');

// Public routes - no authentication required
router.get('/users', getAllUsers);
router.patch('/users/:userId/toggle-lock', toggleUserLock);
router.patch('/users/:userId/verification', setVerificationStatus);

module.exports = router;
