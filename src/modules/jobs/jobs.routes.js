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

const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'Image file exceeds 10MB limit'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 5 images allowed'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }
  if (err) {
    return res.status(400).json({
      error: 'Upload error',
      message: err.message || 'Failed to process file upload'
    });
  }
  next();
};

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
router.post('/', requireRole('EMPLOYER'), upload.array('images', 5), handleMulterError, createJob);
router.put('/:jobId', requireRole('EMPLOYER'), upload.array('images', 5), handleMulterError, updateJob);
router.delete('/:jobId', requireRole('EMPLOYER'), deleteJob);
router.post('/:jobId/complete', requireRole('EMPLOYER'), completeJob);
router.post('/:jobId/reset', requireRole('EMPLOYER'), resetJob);

module.exports = router;

