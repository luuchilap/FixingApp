/**
 * Certificates routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const {
  submitCertificate,
  getCertificateStatus,
  getPendingCertificates,
  verifyCertificate
} = require('./certificates.controller');

// All routes require authentication
router.use(authenticateToken);

// Worker routes
router.post('/', requireRole('WORKER'), submitCertificate);
router.get('/status', requireRole('WORKER'), getCertificateStatus);

// Admin routes
router.get('/pending', requireRole('ADMIN'), getPendingCertificates);
router.post('/:certificateId/verify', requireRole('ADMIN'), verifyCertificate);

module.exports = router;

