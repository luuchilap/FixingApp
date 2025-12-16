/**
 * Applications controller
 * Handles job application operations
 */

const db = require('../../config/db');

/**
 * Apply to a job
 */
function applyToJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const workerId = req.user.id;

    // Get job
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    // Business rule: Cannot apply to completed job
    if (job.status === 'DA_XONG') {
      return res.status(400).json({
        error: 'Cannot apply',
        message: 'Cannot apply to a completed job'
      });
    }

    // Business rule: Cannot apply to own job (if worker is also employer)
    if (job.employer_id === workerId) {
      return res.status(400).json({
        error: 'Cannot apply',
        message: 'You cannot apply to your own job'
      });
    }

    // Check if already applied
    const existingApplication = db.prepare(`
      SELECT * FROM job_applications 
      WHERE job_id = ? AND worker_id = ?
    `).get(parseInt(jobId), workerId);

    if (existingApplication) {
      return res.status(400).json({
        error: 'Already applied',
        message: 'You have already applied to this job'
      });
    }

    // Create application
    const now = Date.now();
    const insertApplication = db.prepare(`
      INSERT INTO job_applications (job_id, worker_id, status, applied_at)
      VALUES (?, ?, 'APPLIED', ?)
    `);

    try {
      const result = insertApplication.run(parseInt(jobId), workerId, now);

      // Get created application
      const application = db.prepare(`
        SELECT * FROM job_applications WHERE id = ?
      `).get(result.lastInsertRowid);

      res.status(201).json({
        id: application.id,
        jobId: application.job_id,
        workerId: application.worker_id,
        status: application.status,
        appliedAt: application.applied_at
      });
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({
          error: 'Already applied',
          message: 'You have already applied to this job'
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get applications for a job (Employer only)
 */
function getJobApplications(req, res, next) {
  try {
    const { jobId } = req.params;
    const employerId = req.user.id;

    // Get job and verify ownership
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    if (job.employer_id !== employerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view applications for your own jobs'
      });
    }

    // Get applications with worker info
    const applications = db.prepare(`
      SELECT 
        ja.*,
        u.id as worker_user_id,
        u.phone as worker_phone,
        u.full_name as worker_full_name,
        u.address as worker_address,
        wp.skill as worker_skill,
        wp.avg_rating as worker_avg_rating,
        wp.is_verified as worker_is_verified
      FROM job_applications ja
      JOIN users u ON ja.worker_id = u.id
      LEFT JOIN worker_profiles wp ON u.id = wp.user_id
      WHERE ja.job_id = ?
      ORDER BY ja.applied_at DESC
    `).all(parseInt(jobId));

    const formattedApplications = applications.map(app => ({
      id: app.id,
      jobId: app.job_id,
      workerId: app.worker_id,
      status: app.status,
      appliedAt: app.applied_at,
      worker: {
        id: app.worker_user_id,
        phone: app.worker_phone,
        fullName: app.worker_full_name,
        address: app.worker_address,
        skill: app.worker_skill,
        avgRating: app.worker_avg_rating ? parseFloat(app.worker_avg_rating) : null,
        isVerified: app.worker_is_verified === 1
      }
    }));

    res.status(200).json(formattedApplications);
  } catch (error) {
    next(error);
  }
}

/**
 * Accept a worker application
 */
function acceptWorker(req, res, next) {
  try {
    const { jobId, workerId } = req.params;
    const employerId = req.user.id;

    // Get job and verify ownership
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    if (job.employer_id !== employerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only accept workers for your own jobs'
      });
    }

    // Business rule: Cannot accept more than one worker
    if (job.accepted_worker_id) {
      return res.status(400).json({
        error: 'Cannot accept worker',
        message: 'A worker has already been accepted for this job'
      });
    }

    // Get application
    const application = db.prepare(`
      SELECT * FROM job_applications 
      WHERE job_id = ? AND worker_id = ?
    `).get(parseInt(jobId), parseInt(workerId));

    if (!application) {
      return res.status(400).json({
        error: 'Application not found',
        message: 'This worker has not applied to this job'
      });
    }

    const now = Date.now();

    // Update job and application in transaction
    db.transaction(() => {
      // Update application status
      db.prepare(`
        UPDATE job_applications 
        SET status = 'ACCEPTED' 
        WHERE id = ?
      `).run(application.id);

      // Update job status and accepted worker
      db.prepare(`
        UPDATE jobs 
        SET status = 'DANG_BAN_GIAO',
            accepted_worker_id = ?,
            handover_deadline = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        parseInt(workerId),
        now + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        now,
        parseInt(jobId)
      );

      // Create status log
      db.prepare(`
        INSERT INTO job_status_logs (job_id, old_status, new_status, changed_by, changed_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        parseInt(jobId),
        job.status,
        'DANG_BAN_GIAO',
        employerId,
        now
      );
    })();

    // Get updated job
    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    res.status(200).json({
      id: updatedJob.id,
      employerId: updatedJob.employer_id,
      title: updatedJob.title,
      status: updatedJob.status,
      acceptedWorkerId: updatedJob.accepted_worker_id,
      handoverDeadline: updatedJob.handover_deadline
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a worker application
 */
function rejectWorker(req, res, next) {
  try {
    const { jobId, workerId } = req.params;
    const employerId = req.user.id;

    // Get job and verify ownership
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    if (job.employer_id !== employerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only reject workers for your own jobs'
      });
    }

    // Get application
    const application = db.prepare(`
      SELECT * FROM job_applications 
      WHERE job_id = ? AND worker_id = ?
    `).get(parseInt(jobId), parseInt(workerId));

    if (!application) {
      return res.status(400).json({
        error: 'Application not found',
        message: 'This worker has not applied to this job'
      });
    }

    // Update application status
    db.prepare(`
      UPDATE job_applications 
      SET status = 'REJECTED' 
      WHERE id = ?
    `).run(application.id);

    res.status(200).json({
      message: 'Worker application rejected successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  applyToJob,
  getJobApplications,
  acceptWorker,
  rejectWorker
};

