/**
 * Admin controller
 * Handles admin operations for jobs and certificates
 */

const db = require('../../config/db');
const { getPendingCertificates, verifyCertificate } = require('../certificates/certificates.controller');

/**
 * Get pending jobs (for MVP, returns all jobs in CHUA_LAM status)
 */
function getPendingJobs(req, res, next) {
  try {
    // In MVP, jobs don't have approval_status, so return all jobs in CHUA_LAM status
    const jobs = db.prepare(`
      SELECT 
        j.*,
        u.phone as employer_phone,
        u.full_name as employer_full_name
      FROM jobs j
      JOIN users u ON j.employer_id = u.id
      WHERE j.status = 'CHUA_LAM'
      ORDER BY j.created_at DESC
    `).all();

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      employerId: job.employer_id,
      employerPhone: job.employer_phone,
      employerFullName: job.employer_full_name,
      title: job.title,
      description: job.description,
      price: job.price,
      address: job.address,
      requiredSkill: job.required_skill,
      status: job.status,
      createdAt: job.created_at
    }));

    res.status(200).json(formattedJobs);
  } catch (error) {
    next(error);
  }
}

/**
 * Approve a job (for MVP, just returns success - jobs are auto-approved)
 */
function approveJob(req, res, next) {
  try {
    const { jobId } = req.params;

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    // In MVP, jobs are auto-approved, so just return success
    res.status(200).json({
      id: job.id,
      approved: true
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a job (for MVP, deletes the job)
 */
function rejectJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    // In MVP, rejecting a job deletes it
    db.prepare('DELETE FROM jobs WHERE id = ?').run(parseInt(jobId));

    res.status(200).json({
      rejected: true,
      message: 'Job rejected and deleted',
      reason: reason || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve a certificate (wrapper for verifyCertificate)
 */
function approveCertificate(req, res, next) {
  req.body = { approved: true };
  verifyCertificate(req, res, next);
}

/**
 * Reject a certificate (wrapper for verifyCertificate)
 */
function rejectCertificate(req, res, next) {
  req.body = { approved: false };
  verifyCertificate(req, res, next);
}

module.exports = {
  getPendingJobs,
  approveJob,
  rejectJob,
  getPendingCertificates,
  approveCertificate,
  rejectCertificate
};

