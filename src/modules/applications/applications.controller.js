/**
 * Applications controller
 * Handles job application operations
 */

const db = require('../../config/db');
const { sendNotification } = require('../notifications/notifications.controller');

/**
 * Apply to a job
 */
async function applyToJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const workerId = req.user.id;

    // Get job
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [parseInt(jobId)]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

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
    const existingApplicationResult = await db.query(`
      SELECT * FROM job_applications 
      WHERE job_id = $1 AND worker_id = $2
    `, [parseInt(jobId), workerId]);

    if (existingApplicationResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Already applied',
        message: 'You have already applied to this job'
      });
    }

    // Create application
    const now = Date.now();
    try {
      const result = await db.query(`
        INSERT INTO job_applications (job_id, worker_id, status, applied_at)
        VALUES ($1, $2, 'APPLIED', $3)
        RETURNING *
      `, [parseInt(jobId), workerId, now]);
      const application = result.rows[0];

      // Get worker name for notification
      const workerResult = await db.query('SELECT full_name, phone FROM users WHERE id = $1', [workerId]);
      const workerName = workerResult.rows[0]?.full_name || workerResult.rows[0]?.phone || 'Một người lao động';

      // Send notification to employer
      await sendNotification(
        job.employer_id,
        `${workerName} vừa ứng tuyển công việc "${job.title}"`
      );

      // Send notification to worker (confirmation)
      await sendNotification(
        workerId,
        `Bạn đã ứng tuyển công việc "${job.title}"`
      );

      res.status(201).json({
        id: application.id,
        jobId: application.job_id,
        workerId: application.worker_id,
        status: application.status,
        appliedAt: application.applied_at
      });
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === '23505') { // PostgreSQL unique violation
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
async function getJobApplications(req, res, next) {
  try {
    const { jobId } = req.params;
    const employerId = req.user.id;

    // Get job and verify ownership
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [parseInt(jobId)]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

    if (job.employer_id !== employerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view applications for your own jobs'
      });
    }

    // Get applications with worker info
    const applicationsResult = await db.query(`
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
      WHERE ja.job_id = $1
      ORDER BY ja.applied_at DESC
    `, [parseInt(jobId)]);

    const formattedApplications = applicationsResult.rows.map(app => ({
      id: app.id,
      jobId: app.job_id,
      workerId: app.worker_id,
      status: app.status,
      appliedAt: app.applied_at,
      acceptedAt: app.accepted_at || null,
      rejectedAt: app.rejected_at || null,
      worker: {
        id: app.worker_user_id,
        phone: app.worker_phone,
        fullName: app.worker_full_name,
        address: app.worker_address,
        skill: app.worker_skill,
        avgRating: app.worker_avg_rating ? parseFloat(app.worker_avg_rating) : null,
        isVerified: app.worker_is_verified === true
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
async function acceptWorker(req, res, next) {
  try {
    const { jobId, workerId } = req.params;
    const employerId = req.user.id;

    // Get job and verify ownership
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [parseInt(jobId)]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

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
    const applicationResult = await db.query(`
      SELECT * FROM job_applications 
      WHERE job_id = $1 AND worker_id = $2
    `, [parseInt(jobId), parseInt(workerId)]);

    if (applicationResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Application not found',
        message: 'This worker has not applied to this job'
      });
    }
    const application = applicationResult.rows[0];

    const now = Date.now();

    // Get worker name for notification
    const workerResult = await db.query('SELECT full_name, phone FROM users WHERE id = $1', [parseInt(workerId)]);
    const workerName = workerResult.rows[0]?.full_name || workerResult.rows[0]?.phone || 'Ứng viên';

    // Update job and application in transaction
    await db.transaction(async (client) => {
      // Update application status with accepted_at timestamp
      await client.query(`
        UPDATE job_applications 
        SET status = 'ACCEPTED', accepted_at = $2 
        WHERE id = $1
      `, [application.id, now]);

      // Update job status and accepted worker
      await client.query(`
        UPDATE jobs 
        SET status = 'DANG_BAN_GIAO',
            accepted_worker_id = $1,
            handover_deadline = $2,
            updated_at = $3
        WHERE id = $4
      `, [
        parseInt(workerId),
        now + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        now,
        parseInt(jobId)
      ]);

      // Create status log
      await client.query(`
        INSERT INTO job_status_logs (job_id, old_status, new_status, changed_by, changed_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        parseInt(jobId),
        job.status,
        'DANG_BAN_GIAO',
        employerId,
        now
      ]);
    });

    // Send notification to worker
    await sendNotification(
      parseInt(workerId),
      `Bạn đã được chấp nhận cho công việc "${job.title}"`
    );

    // Send notification to employer (confirmation)
    await sendNotification(
      employerId,
      `Bạn đã chấp nhận ${workerName} cho công việc "${job.title}"`
    );

    // Get updated job
    const updatedJobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [parseInt(jobId)]);
    const updatedJob = updatedJobResult.rows[0];

    res.status(200).json({
      id: updatedJob.id,
      employerId: updatedJob.employer_id,
      title: updatedJob.title,
      status: updatedJob.status,
      acceptedWorkerId: updatedJob.accepted_worker_id,
      handoverDeadline: updatedJob.handover_deadline,
      acceptedAt: now
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a worker application
 */
async function rejectWorker(req, res, next) {
  try {
    const { jobId, workerId } = req.params;
    const employerId = req.user.id;

    // Get job and verify ownership
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [parseInt(jobId)]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

    if (job.employer_id !== employerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only reject workers for your own jobs'
      });
    }

    // Get application
    const applicationResult = await db.query(`
      SELECT * FROM job_applications 
      WHERE job_id = $1 AND worker_id = $2
    `, [parseInt(jobId), parseInt(workerId)]);

    if (applicationResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Application not found',
        message: 'This worker has not applied to this job'
      });
    }
    const application = applicationResult.rows[0];

    const now = Date.now();

    // Get worker name for notification
    const workerResult = await db.query('SELECT full_name, phone FROM users WHERE id = $1', [parseInt(workerId)]);
    const workerName = workerResult.rows[0]?.full_name || workerResult.rows[0]?.phone || 'Ứng viên';

    // Update application status with rejected_at timestamp
    await db.query(`
      UPDATE job_applications 
      SET status = 'REJECTED', rejected_at = $2 
      WHERE id = $1
    `, [application.id, now]);

    // Send notification to worker
    await sendNotification(
      parseInt(workerId),
      `Bạn đã bị từ chối cho công việc "${job.title}"`
    );

    // Send notification to employer (confirmation)
    await sendNotification(
      employerId,
      `Bạn đã từ chối ${workerName} cho công việc "${job.title}"`
    );

    res.status(200).json({
      message: 'Worker application rejected successfully',
      rejectedAt: now
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get applications by current worker
 * Query params: jobStatus (optional) - filter by job status
 */
async function getMyApplications(req, res, next) {
  try {
    const workerId = req.user.id;
    const { jobStatus } = req.query;

    let query = `
      SELECT 
        ja.*,
        j.title as job_title,
        j.status as job_status,
        j.price as job_price,
        j.address as job_address,
        u.full_name as employer_name
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN users u ON j.employer_id = u.id
      WHERE ja.worker_id = $1
    `;
    
    const params = [workerId];
    
    // Add job status filter if provided
    if (jobStatus && jobStatus !== '') {
      query += ` AND j.status = $2`;
      params.push(jobStatus);
    }
    
    query += ` ORDER BY ja.applied_at DESC`;

    const applicationsResult = await db.query(query, params);

    const formattedApplications = applicationsResult.rows.map(app => ({
      id: app.id,
      jobId: app.job_id,
      workerId: app.worker_id,
      status: app.status,
      appliedAt: app.applied_at,
      acceptedAt: app.accepted_at || null,
      rejectedAt: app.rejected_at || null,
      job: {
        id: app.job_id,
        title: app.job_title,
        status: app.job_status,
        price: app.job_price,
        address: app.job_address,
        employerName: app.employer_name
      }
    }));

    res.status(200).json(formattedApplications);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  applyToJob,
  getJobApplications,
  getMyApplications,
  acceptWorker,
  rejectWorker
};
