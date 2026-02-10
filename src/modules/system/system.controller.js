/**
 * System controller
 * Handles system tasks and maintenance operations
 */

const db = require('../../config/db');
const { sendNotification } = require('../notifications/notifications.controller');
const { runMigrations } = require('../../database/migrate');

/**
 * Expire handover jobs that are overdue (30 days)
 */
async function expireHandoverJobs(req, res, next) {
  try {
    const now = Date.now();

    // Find jobs in DANG_BAN_GIAO status that are overdue
    const overdueJobsResult = await db.query(`
      SELECT * FROM jobs
      WHERE status = 'DANG_BAN_GIAO'
        AND handover_deadline IS NOT NULL
        AND handover_deadline < $1
    `, [now]);

    const updatedJobs = [];

    // Update each overdue job
    for (const job of overdueJobsResult.rows) {
      await db.transaction(async (client) => {
        // Update job status to CHUA_LAM (reset)
        await client.query(`
          UPDATE jobs
          SET status = 'CHUA_LAM',
              accepted_worker_id = NULL,
              handover_deadline = NULL,
              updated_at = $1
          WHERE id = $2
        `, [now, job.id]);

        // Create status log
        await client.query(`
          INSERT INTO job_status_logs (job_id, old_status, new_status, changed_by, changed_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          job.id,
          'DANG_BAN_GIAO',
          'CHUA_LAM',
          job.employer_id, // System change, attributed to employer
          now
        ]);

        // Send notifications
        if (job.employer_id) {
          await sendNotification(
            job.employer_id,
            `Job "${job.title}" has been reset to "Chưa làm" due to overdue handover deadline.`
          );
        }
        if (job.accepted_worker_id) {
          await sendNotification(
            job.accepted_worker_id,
            `Job "${job.title}" has been reset to "Chưa làm" due to overdue handover deadline.`
          );
        }
      });

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

/**
 * Run database migrations
 * Protected by MIGRATION_SECRET environment variable
 */
async function runDatabaseMigrations(req, res, next) {
  try {
    const migrationSecret = process.env.MIGRATION_SECRET;
    const providedSecret = req.headers['x-migration-key'] || req.body.secret;

    // Check if migration secret is configured
    if (!migrationSecret) {
      return res.status(500).json({
        error: 'Migration secret not configured',
        message: 'MIGRATION_SECRET environment variable must be set'
      });
    }

    // Verify secret
    if (providedSecret !== migrationSecret) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid migration secret'
      });
    }

    // Run migrations
    await runMigrations();

    res.status(200).json({
      message: 'Migrations completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      error: 'Migration failed',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}

module.exports = {
  expireHandoverJobs,
  runDatabaseMigrations
};
