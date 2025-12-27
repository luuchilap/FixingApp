/**
 * Reviews routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const {
  submitReview,
  getWorkerReviews,
  getMyReviews
} = require('./reviews.controller');

// Public route
router.get('/workers/:workerId/reviews', getWorkerReviews);

// Protected routes (require authentication)
router.use(authenticateToken);

// Worker-only route
router.get('/reviews/my', requireRole('WORKER'), getMyReviews);

// Employer-only route
router.post('/jobs/:jobId/review', requireRole('EMPLOYER'), submitReview);

module.exports = router;

