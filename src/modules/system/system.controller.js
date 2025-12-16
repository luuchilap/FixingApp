/**
 * System controller
 * Handles system tasks and maintenance operations
 */

const db = require('../../config/db');
const { sendNotification } = require('../notifications/notifications.controller');

/**
 * Expire handover jobs that are overdue (30 days)
 */
function expireHandoverJobs(req, res, next) {
  try {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Find jobs in DANG_BAN_GIAO status that are overdue
    const overdueJobs = db.prepare(`
      SELECT * FROM jobs
      WHERE status = 'DANG_BAN_GIAO'
        AND handover_deadline IS NOT NULL
        AND handover_deadline < ?
    `).all(now);

    const updatedJobs = [];

    // Update each overdue job
    for (const job of overdueJobs) {
      db.transaction(() => {
        // Update job status to CHUA_LAM (reset)
        db.prepare(`
          UPDATE jobs
          SET status = 'CHUA_LAM',
              accepted_worker_id = NULL,
              handover_deadline = NULL,
              updated_at = ?
          WHERE id = ?
        `).run(now, job.id);

        // Create status log
        db.prepare(`
          INSERT INTO job_status_logs (job_id, old_status, new_status, changed_by, changed_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          job.id,
          'DANG_BAN_GIAO',
          'CHUA_LAM',
          job.employer_id, // System change, attributed to employer
          now
        );

        // Send notifications
        if (job.employer_id) {
          sendNotification(
            job.employer_id,
            `Job "${job.title}" has been reset to "Chưa làm" due to overdue handover deadline.`
          );
        }
        if (job.accepted_worker_id) {
          sendNotification(
            job.accepted_worker_id,
            `Job "${job.title}" has been reset to "Chưa làm" due to overdue handover deadline.`
          );
        }
      })();

      updatedJobs.push({
        id: job.id,
        title: job.title,
        oldStatus: 'DANG_BAN_GIAO',
        newStatus: 'CHUA_LAM',
        handoverDeadline: job.handover_deadline
      });
    }

    res.status(200).json({
      message: `Processed ${updatedJobs.length} overdue job(s)`,
      jobs: updatedJobs
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  expireHandoverJobs
};

