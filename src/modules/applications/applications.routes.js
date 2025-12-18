/**
 * Applications routes
 * These routes are mounted under /api/jobs in the main app
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const {
  applyToJob,
  getJobApplications,
  acceptWorker,
  rejectWorker,
  getMyApplications
} = require('./applications.controller');

// All routes require authentication
router.use(authenticateToken);

// Worker routes
router.get('/my', requireRole('WORKER'), getMyApplications);
router.post('/:jobId/apply', requireRole('WORKER'), applyToJob);

// Employer routes
router.get('/:jobId/applications', requireRole('EMPLOYER'), getJobApplications);
router.post('/:jobId/accept/:workerId', requireRole('EMPLOYER'), acceptWorker);
router.post('/:jobId/reject/:workerId', requireRole('EMPLOYER'), rejectWorker);

module.exports = router;

