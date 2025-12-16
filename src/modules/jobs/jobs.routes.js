/**
 * Jobs routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const {
  createJob,
  getJobById,
  listJobs,
  getMyJobs,
  updateJob,
  deleteJob,
  getJobStatus,
  completeJob,
  resetJob
} = require('./jobs.controller');

// Public routes
router.get('/', listJobs);
router.get('/:jobId/status', getJobStatus); // Public status check (must come before /:jobId)

// Protected route for /my (must come before /:jobId to avoid route conflicts)
router.get('/my', authenticateToken, requireRole('EMPLOYER'), getMyJobs);

// Public route for getting job by ID
router.get('/:jobId', getJobById);

// Protected routes (require authentication)
router.use(authenticateToken);

// Employer-only routes
router.post('/', requireRole('EMPLOYER'), createJob);
router.put('/:jobId', requireRole('EMPLOYER'), updateJob);
router.delete('/:jobId', requireRole('EMPLOYER'), deleteJob);
router.post('/:jobId/complete', requireRole('EMPLOYER'), completeJob);
router.post('/:jobId/reset', requireRole('EMPLOYER'), resetJob);

module.exports = router;

