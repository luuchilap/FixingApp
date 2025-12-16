/**
 * Reviews controller
 * Handles worker review and rating operations
 */

const db = require('../../config/db');

/**
 * Submit a review for a worker (Employer only)
 */
function submitReview(req, res, next) {
  try {
    const { jobId } = req.params;
    const { stars, comment } = req.body;
    const employerId = req.user.id;

    // Validation
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Stars must be between 1 and 5'
      });
    }

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
        message: 'You can only review workers for your own jobs'
      });
    }

    // Business rule: Can only review completed jobs
    if (job.status !== 'DA_XONG') {
      return res.status(400).json({
        error: 'Cannot review job',
        message: 'Job must be completed (DA_XONG) before reviewing'
      });
    }

    // Business rule: Must have accepted worker
    if (!job.accepted_worker_id) {
      return res.status(400).json({
        error: 'Cannot review job',
        message: 'Job must have an accepted worker to review'
      });
    }

    // Business rule: Cannot review same job twice
    const existingReview = db.prepare('SELECT * FROM worker_reviews WHERE job_id = ?')
      .get(parseInt(jobId));

    if (existingReview) {
      return res.status(400).json({
        error: 'Already reviewed',
        message: 'You have already reviewed this job'
      });
    }

    const now = Date.now();

    // Create review and update worker average rating in transaction
    db.transaction(() => {
      // Insert review
      const insertReview = db.prepare(`
        INSERT INTO worker_reviews (
          job_id, worker_id, employer_id, stars, comment, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertReview.run(
        parseInt(jobId),
        job.accepted_worker_id,
        employerId,
        stars,
        comment || null,
        now
      );

      // Calculate new average rating for worker
      const reviews = db.prepare(`
        SELECT stars FROM worker_reviews WHERE worker_id = ?
      `).all(job.accepted_worker_id);

      const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)
        : stars.toFixed(1);

      // Update worker profile average rating
      db.prepare(`
        UPDATE worker_profiles
        SET avg_rating = ?
        WHERE user_id = ?
      `).run(parseFloat(avgRating), job.accepted_worker_id);
    })();

    // Get created review
    const review = db.prepare('SELECT * FROM worker_reviews WHERE job_id = ?')
      .get(parseInt(jobId));

    res.status(201).json({
      id: review.id,
      jobId: review.job_id,
      workerId: review.worker_id,
      employerId: review.employer_id,
      stars: review.stars,
      comment: review.comment,
      createdAt: review.created_at
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        error: 'Already reviewed',
        message: 'You have already reviewed this job'
      });
    }
    next(error);
  }
}

/**
 * Get reviews for a worker
 */
function getWorkerReviews(req, res, next) {
  try {
    const { workerId } = req.params;

    // Verify worker exists
    const worker = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(workerId));

    if (!worker) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Worker not found'
      });
    }

    // Get reviews with employer info
    const reviews = db.prepare(`
      SELECT 
        wr.*,
        u.phone as employer_phone,
        u.full_name as employer_full_name,
        j.title as job_title
      FROM worker_reviews wr
      JOIN users u ON wr.employer_id = u.id
      JOIN jobs j ON wr.job_id = j.id
      WHERE wr.worker_id = ?
      ORDER BY wr.created_at DESC
    `).all(parseInt(workerId));

    // Get worker profile for average rating
    const workerProfile = db.prepare('SELECT avg_rating FROM worker_profiles WHERE user_id = ?')
      .get(parseInt(workerId));

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      jobId: review.job_id,
      jobTitle: review.job_title,
      workerId: review.worker_id,
      employer: {
        id: review.employer_id,
        phone: review.employer_phone,
        fullName: review.employer_full_name
      },
      stars: review.stars,
      comment: review.comment,
      createdAt: review.created_at
    }));

    // Return reviews array directly (as expected by tests)
    res.status(200).json(formattedReviews);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitReview,
  getWorkerReviews
};

