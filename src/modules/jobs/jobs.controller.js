/**
 * Jobs controller
 * Handles job CRUD operations
 */

const db = require('../../config/db');

/**
 * Normalize skill value - maps skill values to standardized ones
 * If skill doesn't match any known skill, returns 'OTHER'
 */
function normalizeSkill(skill) {
  if (!skill) return null;
  
  const upperSkill = skill.toUpperCase().trim();
  
  // Valid skill values (must match frontend constants)
  const validSkills = [
    'PLUMBING',
    'ELECTRICAL',
    'CARPENTRY',
    'PAINTING',
    'CLEANING',
    'AC_REPAIR',
    'APPLIANCE_REPAIR',
    'MASONRY',
    'GARDENING',
    'OTHER'
  ];
  
  // Check if it's already a valid skill
  if (validSkills.includes(upperSkill)) {
    return upperSkill;
  }
  
  // Map old/common variations to new standardized values
  const skillMap = {
    'PLUMBING': 'PLUMBING',
    'ELECTRICAL': 'ELECTRICAL',
    'CARPENTRY': 'CARPENTRY',
    'PAINTING': 'PAINTING',
    'CLEANING': 'CLEANING',
    'AC REPAIR': 'AC_REPAIR',
    'AC_REPAIR': 'AC_REPAIR',
    'APPLIANCE REPAIR': 'APPLIANCE_REPAIR',
    'APPLIANCE_REPAIR': 'APPLIANCE_REPAIR',
    'MASONRY': 'MASONRY',
    'GARDENING': 'GARDENING',
    'OTHER': 'OTHER'
  };
  
  // Check if it's a known variation
  if (skillMap[upperSkill]) {
    return skillMap[upperSkill];
  }
  
  // If not found, return OTHER
  return 'OTHER';
}

/**
 * Create a new job
 */
function createJob(req, res, next) {
  try {
    const { title, description, price, address, requiredSkill, images } = req.body;
    const employerId = req.user.id;

    // Validation
    if (!title || !description || !price || !address) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'title, description, price, and address are required'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        error: 'Invalid price',
        message: 'Price must be greater than 0'
      });
    }

    // Validate images if provided
    if (images !== undefined && images !== null) {
      if (!Array.isArray(images)) {
        return res.status(400).json({
          error: 'Invalid images format',
          message: 'images must be an array of strings (image URLs)'
        });
      }

      // Validate each image URL
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        if (typeof imageUrl !== 'string') {
          return res.status(400).json({
            error: 'Invalid image format',
            message: `Image at index ${i} must be a string (URL or base64 data URL)`
          });
        }

        // Validate base64 data URL format if it's a data URL
        if (imageUrl.startsWith('data:')) {
          // Check if it's a valid data URL format: data:[<mediatype>][;base64],<data>
          if (!imageUrl.match(/^data:image\/[^;]+;base64,/)) {
            return res.status(400).json({
              error: 'Invalid image format',
              message: `Image at index ${i} is not a valid base64 image data URL`
            });
          }

          // Check base64 data size
          // Base64 encoding increases size by ~33%, so we check the string length
          // For a 10MB original file, base64 would be ~13.3MB, so we allow up to 15MB base64 string
          const base64Data = imageUrl.split(',')[1];
          if (base64Data) {
            const base64SizeKB = Math.ceil(base64Data.length / 1024);
            const maxSizeKB = 15 * 1024; // 15MB in KB
            
            console.log(`Image ${i}: base64 size = ${base64SizeKB}KB (${(base64SizeKB / 1024).toFixed(2)}MB), max = ${maxSizeKB}KB`);
            
            if (base64Data.length > maxSizeKB * 1024) {
              return res.status(400).json({
                error: 'Image too large',
                message: `Image at index ${i} is too large. Base64 size: ${(base64SizeKB / 1024).toFixed(2)}MB, maximum allowed: 15MB`
              });
            }
          }
        }
      }
    }

    const now = Date.now();
    
    // Normalize skill to ensure it matches one of the fixed skill values
    const normalizedSkill = normalizeSkill(requiredSkill);

    // Create job and images in transaction
    const result = db.transaction(() => {
      // Insert job
      const insertJob = db.prepare(`
        INSERT INTO jobs (
          employer_id, title, description, price, address, required_skill,
          status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'CHUA_LAM', ?, ?)
      `);
      const jobResult = insertJob.run(
        employerId,
        title,
        description,
        price,
        address,
        normalizedSkill,
        now,
        now
      );
      const jobId = jobResult.lastInsertRowid;

      // Insert images if provided
      if (images && Array.isArray(images) && images.length > 0) {
        const insertImage = db.prepare(`
          INSERT INTO job_images (job_id, image_url, is_primary)
          VALUES (?, ?, ?)
        `);
        
        images.forEach((imageUrl, index) => {
          // Ensure imageUrl is a string
          const url = typeof imageUrl === 'string' ? imageUrl : String(imageUrl);
          insertImage.run(jobId, url, index === 0 ? 1 : 0);
        });
      }

      return jobId;
    })();

    // Get created job with images
    const job = getJobWithImages(result);

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    next(error);
  }
}

/**
 * Get job by ID
 */
function getJobById(req, res, next) {
  try {
    const { jobId } = req.params;
    
    // Handle case where 'my' is treated as jobId (should be handled by /my route)
    if (jobId === 'my') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    
    const job = getJobWithImages(parseInt(jobId));

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
 * List jobs with filters
 */
function listJobs(req, res, next) {
  try {
    const { keyword, category, minPrice, maxPrice } = req.query;

    let query = `
      SELECT j.*, u.full_name as employer_name
      FROM jobs j
      JOIN users u ON j.employer_id = u.id
      WHERE j.status != 'DA_XONG'
    `;
    const params = [];

    // Apply filters
    if (keyword) {
      query += ` AND (j.title LIKE ? OR j.description LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (category) {
      query += ` AND j.required_skill = ?`;
      params.push(category);
    }

    if (minPrice) {
      query += ` AND j.price >= ?`;
      params.push(parseInt(minPrice));
    }

    if (maxPrice) {
      query += ` AND j.price <= ?`;
      params.push(parseInt(maxPrice));
    }

    query += ` ORDER BY j.created_at DESC`;

    const jobs = db.prepare(query).all(...params);

    // Get images for each job
    const jobsWithImages = jobs.map(job => {
      const images = db.prepare('SELECT * FROM job_images WHERE job_id = ? ORDER BY is_primary DESC, id ASC').all(job.id);
      return {
        id: job.id,
        employerId: job.employer_id,
        employerName: job.employer_name,
        title: job.title,
        description: job.description,
        price: job.price,
        address: job.address,
        requiredSkill: job.required_skill,
        status: job.status,
        acceptedWorkerId: job.accepted_worker_id,
        handoverDeadline: job.handover_deadline,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        images: images.map(img => ({
          type: 'IMAGE',
          url: img.image_url
        }))
      };
    });

    res.status(200).json(jobsWithImages);
  } catch (error) {
    next(error);
  }
}

/**
 * Get jobs posted by current employer
 */
function getMyJobs(req, res, next) {
  try {
    const employerId = req.user.id;

    const jobs = db.prepare(`
      SELECT * FROM jobs
      WHERE employer_id = ?
      ORDER BY created_at DESC
    `).all(employerId);

    const jobsWithImages = jobs.map(job => getJobWithImages(job.id));

    res.status(200).json(jobsWithImages);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a job
 */
function updateJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const { title, description, price, address, requiredSkill } = req.body;
    const employerId = req.user.id;

    // Get existing job
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

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

    // Build update query
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({
          error: 'Invalid price',
          message: 'Price must be greater than 0'
        });
      }
      updates.push('price = ?');
      values.push(price);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (requiredSkill !== undefined) {
      // Normalize skill to ensure it matches one of the fixed skill values
      const normalizedSkill = normalizeSkill(requiredSkill);
      updates.push('required_skill = ?');
      values.push(normalizedSkill);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(parseInt(jobId));

    // Update job
    const updateQuery = `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...values);

    // Get updated job
    const updatedJob = getJobWithImages(parseInt(jobId));

    res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a job
 */
function deleteJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const employerId = req.user.id;

    // Get existing job
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

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
    db.prepare('DELETE FROM jobs WHERE id = ?').run(parseInt(jobId));

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
function getJobStatus(req, res, next) {
  try {
    const { jobId } = req.params;

    const job = db.prepare('SELECT id, status, accepted_worker_id FROM jobs WHERE id = ?')
      .get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

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
function completeJob(req, res, next) {
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
    db.transaction(() => {
      // Update job status
      db.prepare(`
        UPDATE jobs 
        SET status = 'DA_XONG',
            updated_at = ?
        WHERE id = ?
      `).run(now, parseInt(jobId));

      // Create status log
      db.prepare(`
        INSERT INTO job_status_logs (job_id, old_status, new_status, changed_by, changed_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        parseInt(jobId),
        job.status,
        'DA_XONG',
        employerId,
        now
      );
    })();

    // Get updated job
    const updatedJob = getJobWithImages(parseInt(jobId));

    res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
}

/**
 * Reset job status from DANG_BAN_GIAO to CHUA_LAM
 */
function resetJob(req, res, next) {
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
    db.transaction(() => {
      // Update job status and clear accepted worker
      db.prepare(`
        UPDATE jobs 
        SET status = 'CHUA_LAM',
            accepted_worker_id = NULL,
            handover_deadline = NULL,
            updated_at = ?
        WHERE id = ?
      `).run(now, parseInt(jobId));

      // Create status log
      db.prepare(`
        INSERT INTO job_status_logs (job_id, old_status, new_status, changed_by, changed_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        parseInt(jobId),
        job.status,
        'CHUA_LAM',
        employerId,
        now
      );
    })();

    // Get updated job
    const updatedJob = getJobWithImages(parseInt(jobId));

    res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
}

/**
 * Helper function to get job with images
 * Returns images in format expected by frontend: Array<{ type?: string; url: string }>
 */
function getJobWithImages(jobId) {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  
  if (!job) {
    return null;
  }

  const images = db.prepare('SELECT * FROM job_images WHERE job_id = ? ORDER BY is_primary DESC, id ASC').all(jobId);

  return {
    id: job.id,
    employerId: job.employer_id,
    title: job.title,
    description: job.description,
    price: job.price,
    address: job.address,
    requiredSkill: job.required_skill,
    status: job.status,
    acceptedWorkerId: job.accepted_worker_id,
    handoverDeadline: job.handover_deadline,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    images: images.map(img => ({
      type: 'IMAGE',
      url: img.image_url
    }))
  };
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

