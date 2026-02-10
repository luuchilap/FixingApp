/**
 * Jobs controller
 * Handles job CRUD operations
 */

const db = require('../../config/db');
const { uploadToS3 } = require('./jobs.utils');
const { geocode, calculateDistance } = require('../../utils/trackasia');
const { sendNotification } = require('../notifications/notifications.controller');
const { normalizeSkill } = require('../../utils/normalizeSkill');

/**
 * Helper function to get job with images
 * Returns images in format expected by frontend: Array<{ type?: string; url: string }>
 */
async function getJobWithImages(jobId) {
  const jobResult = await db.query(`
    SELECT j.*, u.full_name as employer_name, u.phone as employer_phone
    FROM jobs j
    JOIN users u ON j.employer_id = u.id
    WHERE j.id = $1
  `, [jobId]);

  if (jobResult.rows.length === 0) {
    return null;
  }
  const job = jobResult.rows[0];

  const imagesResult = await db.query('SELECT * FROM job_images WHERE job_id = $1 ORDER BY is_primary DESC, id ASC', [jobId]);

  return {
    id: job.id,
    employerId: job.employer_id,
    employerName: job.employer_name,
    employerPhone: job.employer_phone,
    title: job.title,
    description: job.description,
    price: job.price,
    address: job.address,
    requiredSkill: job.required_skill,
    status: job.status,
    acceptedWorkerId: job.accepted_worker_id,
    handoverDeadline: job.handover_deadline,
    latitude: job.latitude,
    longitude: job.longitude,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    images: imagesResult.rows.map(img => ({
      type: 'IMAGE',
      url: img.image_url
    }))
  };
}

/**
 * Create a new job
 */
async function createJob(req, res, next) {
  try {
    const { title, description, price, address, requiredSkill, latitude, longitude } = req.body;
    let { images } = req.body; // Existing URLs if any
    const employerId = req.user.id;

    // Validation
    if (!title || !description || !price || !address) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'title, description, price, and address are required'
      });
    }

    // Geocode address if lat/lng not provided
    let jobLatitude = latitude ? parseFloat(latitude) : null;
    let jobLongitude = longitude ? parseFloat(longitude) : null;

    if (!jobLatitude || !jobLongitude) {
      try {
        const geocodeResult = await geocode(address);
        jobLatitude = geocodeResult.latitude;
        jobLongitude = geocodeResult.longitude;
      } catch (geocodeError) {
        console.warn('Geocoding failed, job will be created without coordinates:', geocodeError.message);
        // Continue without coordinates - job can still be created
      }
    }

    // Parse price (FormData sends strings, JSON sends numbers)
    const parsedPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        error: 'Invalid price',
        message: 'Price must be a valid number greater than 0'
      });
    }

    // Handle uploaded files from multer
    const uploadedFiles = req.files || [];
    const s3ImageUrls = [];

    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        const url = await uploadToS3(file);
        s3ImageUrls.push(url);
      }
    }

    // Combine existing URLs and new S3 URLs
    // If we have S3 URLs, they take priority
    let finalImages = [];
    if (s3ImageUrls.length > 0) {
      finalImages = s3ImageUrls;
    } else if (images) {
      // Backward compatibility for base64 or existing URLs
      finalImages = Array.isArray(images) ? images : [images];
    }

    // Validate images if provided
    if (finalImages.length > 0) {
      // Validate each image URL/data
      for (let i = 0; i < finalImages.length; i++) {
        const imageUrl = finalImages[i];
        if (typeof imageUrl !== 'string') {
          return res.status(400).json({
            error: 'Invalid image format',
            message: `Image at index ${i} must be a string`
          });
        }
      }
    }

    const now = Date.now();

    // Normalize skill to ensure it matches one of the fixed skill values
    const normalizedSkill = normalizeSkill(requiredSkill);

    // Create job and images in transaction
    const jobId = await db.transaction(async (client) => {
      // Insert job
      const jobResult = await client.query(`
        INSERT INTO jobs (
          employer_id, title, description, price, address, required_skill,
          status, latitude, longitude, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'CHUA_LAM', $7, $8, $9, $10)
        RETURNING id
      `, [employerId, title, description, parsedPrice, address, normalizedSkill, jobLatitude, jobLongitude, now, now]);
      const jobId = jobResult.rows[0].id;

      // Insert images if provided
      if (finalImages.length > 0) {
        for (let index = 0; index < finalImages.length; index++) {
          await client.query(`
            INSERT INTO job_images (job_id, image_url, is_primary)
            VALUES ($1, $2, $3)
          `, [jobId, finalImages[index], index === 0]);
        }
      }

      return jobId;
    });

    // Get created job with images
    const job = await getJobWithImages(jobId);

    // Send notification to employer (confirmation)
    await sendNotification(
      employerId,
      `Bạn đã đăng công việc "${title}"`
    );

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    next(error);
  }
}

/**
 * Get job by ID
 */
async function getJobById(req, res, next) {
  try {
    const { jobId } = req.params;

    // Handle case where 'my' is treated as jobId (should be handled by /my route)
    if (jobId === 'my') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    const job = await getJobWithImages(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
}

/**
 * List jobs with filters and pagination
 */
async function listJobs(req, res, next) {
  try {
    const { keyword, category, minPrice, maxPrice, latitude, longitude, maxDistance, page = 1, limit = 10 } = req.query;

    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = `WHERE j.status != 'DA_XONG'`;
    const params = [];
    let paramIndex = 1;

    // Apply filters
    if (keyword) {
      whereClause += ` AND (j.title LIKE $${paramIndex++} OR j.description LIKE $${paramIndex++})`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (category) {
      whereClause += ` AND j.required_skill = $${paramIndex++}`;
      params.push(category);
    }

    if (minPrice) {
      whereClause += ` AND j.price >= $${paramIndex++}`;
      params.push(parseInt(minPrice));
    }

    if (maxPrice) {
      whereClause += ` AND j.price <= $${paramIndex++}`;
      params.push(parseInt(maxPrice));
    }

    // Filter by location if provided
    if (latitude && longitude && maxDistance) {
      whereClause += ` AND j.latitude IS NOT NULL AND j.longitude IS NOT NULL`;
    }

    // Get total count first
    const countQuery = `SELECT COUNT(*) FROM jobs j ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated results
    const query = `
      SELECT j.*, u.full_name as employer_name, u.phone as employer_phone
      FROM jobs j
      JOIN users u ON j.employer_id = u.id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limitNum, offset);

    const jobsResult = await db.query(query, params);

    // Get images for each job and filter by distance if needed
    const userLat = latitude ? parseFloat(latitude) : null;
    const userLon = longitude ? parseFloat(longitude) : null;
    const maxDist = maxDistance ? parseFloat(maxDistance) : null;

    const jobsWithImages = await Promise.all(
      jobsResult.rows.map(async (job) => {
        const imagesResult = await db.query('SELECT * FROM job_images WHERE job_id = $1 ORDER BY is_primary DESC, id ASC', [job.id]);
        return {
          id: job.id,
          employerId: job.employer_id,
          employerName: job.employer_name,
          employerPhone: job.employer_phone,
          title: job.title,
          description: job.description,
          price: job.price,
          address: job.address,
          requiredSkill: job.required_skill,
          status: job.status,
          acceptedWorkerId: job.accepted_worker_id,
          handoverDeadline: job.handover_deadline,
          latitude: job.latitude,
          longitude: job.longitude,
          createdAt: job.created_at,
          updatedAt: job.updated_at,
          images: imagesResult.rows.map(img => ({
            type: 'IMAGE',
            url: img.image_url
          })),
          // Calculate distance if user location provided
          distance: (userLat && userLon && job.latitude != null && job.longitude != null)
            ? calculateDistance(userLat, userLon, parseFloat(job.latitude), parseFloat(job.longitude))
            : null
        };
      })
    );

    // Filter by distance if provided
    let filteredJobs = jobsWithImages;
    if (userLat && userLon && maxDist) {
      // Validate inputs are valid numbers
      if (isNaN(userLat) || isNaN(userLon) || isNaN(maxDist) || !isFinite(userLat) || !isFinite(userLon) || !isFinite(maxDist)) {
        console.error('Invalid location filter parameters:', { latitude, longitude, maxDistance, userLat, userLon, maxDist });
      } else {
        filteredJobs = jobsWithImages.filter(job => {
          // Only include jobs with valid coordinates and distance
          if (!job.distance || job.distance === null || job.distance === undefined) {
            return false;
          }
          // Check if distance is valid number
          if (isNaN(job.distance) || !isFinite(job.distance)) {
            return false;
          }
          // Check if distance is within maxDistance (strict comparison)
          return job.distance <= maxDist;
        });
        // Sort by distance
        filteredJobs.sort((a, b) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return distA - distB;
        });
      }
    }

    // Return paginated response
    res.status(200).json({
      data: filteredJobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: pageNum < Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get jobs posted by current employer
 * Query params: status (optional) - filter by job status
 */
async function getMyJobs(req, res, next) {
  try {
    const employerId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT * FROM jobs
      WHERE employer_id = $1
    `;

    const params = [employerId];

    // Add status filter if provided
    if (status && status !== '') {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const jobsResult = await db.query(query, params);

    const jobsWithImages = await Promise.all(
      jobsResult.rows.map(job => getJobWithImages(job.id))
    );

    res.status(200).json(jobsWithImages);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a job
 */
async function updateJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const { title, description, price, address, requiredSkill, latitude, longitude } = req.body;
    let { images } = req.body; // Existing URLs to keep if any
    const employerId = req.user.id;

    // Get existing job
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [parseInt(jobId)]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

    // Check ownership
    if (job.employer_id !== employerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own jobs'
      });
    }

    // Business rule: Cannot edit if worker is accepted
    if (job.accepted_worker_id) {
      return res.status(400).json({
        error: 'Cannot update job',
        message: 'Job cannot be updated when a worker has been accepted'
      });
    }

    // Business rule: Can only edit if status is CHUA_LAM
    if (job.status !== 'CHUA_LAM') {
      return res.status(400).json({
        error: 'Cannot update job',
        message: 'Job can only be updated when status is CHUA_LAM'
      });
    }

    // Handle new uploaded files from multer
    const uploadedFiles = req.files || [];
    const s3ImageUrls = [];

    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        const url = await uploadToS3(file);
        s3ImageUrls.push(url);
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({
          error: 'Invalid price',
          message: 'Price must be greater than 0'
        });
      }
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(address);

      // If address changed and no new lat/lng provided, geocode the new address
      if (address !== job.address && (!latitude || !longitude)) {
        try {
          const geocodeResult = await geocode(address);
          updates.push(`latitude = $${paramIndex++}`);
          updates.push(`longitude = $${paramIndex++}`);
          values.push(geocodeResult.latitude);
          values.push(geocodeResult.longitude);
        } catch (geocodeError) {
          console.warn('Geocoding failed during update:', geocodeError.message);
          // Continue without updating coordinates
        }
      }
    }

    if (latitude !== undefined && longitude !== undefined) {
      updates.push(`latitude = $${paramIndex++}`);
      updates.push(`longitude = $${paramIndex++}`);
      values.push(parseFloat(latitude));
      values.push(parseFloat(longitude));
    }
    if (requiredSkill !== undefined) {
      // Normalize skill to ensure it matches one of the fixed skill values
      const normalizedSkill = normalizeSkill(requiredSkill);
      updates.push(`required_skill = $${paramIndex++}`);
      values.push(normalizedSkill);
    }

    const now = Date.now();
    updates.push(`updated_at = $${paramIndex++}`);
    values.push(now);
    values.push(parseInt(jobId)); // For WHERE clause

    // Update job and images in transaction
    await db.transaction(async (client) => {
      // Update job fields if any
      if (updates.length > 0) {
        const updateQuery = `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
        await client.query(updateQuery, values);
      }

      // Update images if provided or uploaded
      if (s3ImageUrls.length > 0 || images !== undefined) {
        // Clear existing images first if we're replacing them
        await client.query('DELETE FROM job_images WHERE job_id = $1', [parseInt(jobId)]);

        // Use new S3 URLs first
        let finalImages = s3ImageUrls;

        // If no new files, use existing URLs if provided
        if (finalImages.length === 0 && images) {
          finalImages = Array.isArray(images) ? images : [images];
        }

        for (let index = 0; index < finalImages.length; index++) {
          await client.query(`
            INSERT INTO job_images (job_id, image_url, is_primary)
            VALUES ($1, $2, $3)
          `, [parseInt(jobId), finalImages[index], index === 0]);
        }
      }
    });

    // Get updated job
    const updatedJob = await getJobWithImages(parseInt(jobId));

    res.status(200).json(updatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    next(error);
  }
}

/**
 * Delete a job
 */
async function deleteJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const employerId = req.user.id;

    // Get existing job
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [parseInt(jobId)]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

    // Check ownership
    if (job.employer_id !== employerId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own jobs'
      });
    }

    // Business rule: Cannot delete if worker is accepted
    if (job.accepted_worker_id) {
      return res.status(400).json({
        error: 'Cannot delete job',
        message: 'Job cannot be deleted when a worker has been accepted'
      });
    }

    // Business rule: Can only delete if status is CHUA_LAM
    if (job.status !== 'CHUA_LAM') {
      return res.status(400).json({
        error: 'Cannot delete job',
        message: 'Job can only be deleted when status is CHUA_LAM'
      });
    }

    // Delete job (cascade will delete images)
    await db.query('DELETE FROM jobs WHERE id = $1', [parseInt(jobId)]);

    res.status(200).json({
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get job status
 */
async function getJobStatus(req, res, next) {
  try {
    const { jobId } = req.params;

    const jobResult = await db.query('SELECT id, status, accepted_worker_id FROM jobs WHERE id = $1', [parseInt(jobId)]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

    res.status(200).json({
      jobId: job.id,
      status: job.status,
      acceptedWorkerId: job.accepted_worker_id
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete a job
 */
async function completeJob(req, res, next) {
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
        message: 'You can only complete your own jobs'
      });
    }

    // Business rule: Can only complete job in DANG_BAN_GIAO status
    if (job.status !== 'DANG_BAN_GIAO') {
      return res.status(400).json({
        error: 'Cannot complete job',
        message: 'Job must be in DANG_BAN_GIAO status to be completed'
      });
    }

    // Business rule: Must have accepted worker
    if (!job.accepted_worker_id) {
      return res.status(400).json({
        error: 'Cannot complete job',
        message: 'Job must have an accepted worker to be completed'
      });
    }

    const now = Date.now();

    // Update job status and log change in transaction
    await db.transaction(async (client) => {
      // Update job status
      await client.query(`
        UPDATE jobs 
        SET status = 'DA_XONG',
            updated_at = $1
        WHERE id = $2
      `, [now, parseInt(jobId)]);

      // Create status log
      await client.query(`
        INSERT INTO job_status_logs (job_id, old_status, new_status, changed_by, changed_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        parseInt(jobId),
        job.status,
        'DA_XONG',
        employerId,
        now
      ]);
    });

    // Get updated job
    const updatedJob = await getJobWithImages(parseInt(jobId));

    res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
}

/**
 * Reset job status from DANG_BAN_GIAO to CHUA_LAM
 */
async function resetJob(req, res, next) {
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
        message: 'You can only reset your own jobs'
      });
    }

    // Business rule: Can only reset from DANG_BAN_GIAO
    if (job.status !== 'DANG_BAN_GIAO') {
      return res.status(400).json({
        error: 'Cannot reset job',
        message: 'Job can only be reset from DANG_BAN_GIAO status'
      });
    }

    const now = Date.now();

    // Reset job status and log change in transaction
    await db.transaction(async (client) => {
      // Update job status and clear accepted worker
      await client.query(`
        UPDATE jobs 
        SET status = 'CHUA_LAM',
            accepted_worker_id = NULL,
            handover_deadline = NULL,
            updated_at = $1
        WHERE id = $2
      `, [now, parseInt(jobId)]);

      // Create status log
      await client.query(`
        INSERT INTO job_status_logs (job_id, old_status, new_status, changed_by, changed_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        parseInt(jobId),
        job.status,
        'CHUA_LAM',
        employerId,
        now
      ]);
    });

    // Get updated job
    const updatedJob = await getJobWithImages(parseInt(jobId));

    res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createJob,
  getJobById,
  listJobs,
  getMyJobs,
  updateJob,
  deleteJob,
  getJobStatus,
  completeJob,
  resetJob
};
