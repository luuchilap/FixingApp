/**
 * Admin routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const { getPendingComplaints, resolveComplaint } = require('../complaints/complaints.controller');
const {
  getPendingJobs,
  approveJob,
  rejectJob,
  getPendingCertificates,
  approveCertificate,
  rejectCertificate
} = require('./admin.controller');

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// Job approval routes
router.get('/jobs/pending', getPendingJobs);
router.post('/jobs/:jobId/approve', approveJob);
router.post('/jobs/:jobId/reject', rejectJob);

// Certificate approval routes
router.get('/certificates/pending', getPendingCertificates);
router.post('/certificates/:certificateId/approve', approveCertificate);
router.post('/certificates/:certificateId/reject', rejectCertificate);

// Complaints routes
router.get('/complaints', getPendingComplaints);
router.post('/complaints/:complaintId/resolve', resolveComplaint);

module.exports = router;

