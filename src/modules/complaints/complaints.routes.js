/**
 * Complaints routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const {
  fileComplaint,
  getMyComplaints,
  getPendingComplaints,
  resolveComplaint
} = require('./complaints.controller');

// All routes require authentication
router.use(authenticateToken);

// User routes
router.post('/', fileComplaint);
router.get('/my', getMyComplaints);

module.exports = router;

