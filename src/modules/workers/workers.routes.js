/**
 * Workers routes
 * Routes for worker listing (for employers)
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const { listWorkers, getWorkerById } = require('./workers.controller');

// All routes require authentication and EMPLOYER role
router.get('/', authenticateToken, requireRole(['EMPLOYER', 'ADMIN']), listWorkers);
router.get('/:workerId', authenticateToken, requireRole(['EMPLOYER', 'ADMIN']), getWorkerById);

module.exports = router;

