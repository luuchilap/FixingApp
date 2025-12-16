/**
 * Workers controller
 * Handles worker listing operations for employers
 */

const db = require('../../config/db');

/**
 * List workers with filters (for employers)
 * Only accessible by employers
 */
function listWorkers(req, res, next) {
  try {
    const { skill, address } = req.query;

    // Build query to get workers with their profiles
    let query = `
      SELECT 
        u.id,
        u.phone,
        u.full_name,
        u.address,
        u.created_at,
        wp.skill,
        wp.avg_rating,
        wp.is_verified
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      LEFT JOIN worker_profiles wp ON u.id = wp.user_id
      WHERE r.name = 'WORKER'
    `;
    const params = [];

    // Apply filters
    if (skill) {
      query += ` AND wp.skill = ?`;
      params.push(skill);
    }

    if (address) {
      query += ` AND u.address LIKE ?`;
      params.push(`%${address}%`);
    }

    query += ` ORDER BY u.created_at DESC`;

    const workers = db.prepare(query).all(...params);

    // Format response
    const formattedWorkers = workers.map(worker => ({
      id: worker.id,
      phone: worker.phone,
      fullName: worker.full_name,
      address: worker.address,
      skill: worker.skill,
      avgRating: worker.avg_rating || 0,
      isVerified: worker.is_verified === 1,
      createdAt: worker.created_at
    }));

    res.status(200).json(formattedWorkers);
  } catch (error) {
    console.error('Error listing workers:', error);
    next(error);
  }
}

/**
 * Get worker details by ID (for employers)
 */
function getWorkerById(req, res, next) {
  try {
    const { workerId } = req.params;

    const worker = db.prepare(`
      SELECT 
        u.id,
        u.phone,
        u.full_name,
        u.address,
        u.created_at,
        wp.skill,
        wp.avg_rating,
        wp.is_verified
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      LEFT JOIN worker_profiles wp ON u.id = wp.user_id
      WHERE r.name = 'WORKER' AND u.id = ?
    `).get(parseInt(workerId));

    if (!worker) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Worker not found'
      });
    }

    // Get worker certificates
    const certificates = db.prepare(`
      SELECT id, image_url, status, reviewed_at
      FROM worker_certificates
      WHERE worker_id = ? AND status = 'APPROVED'
      ORDER BY reviewed_at DESC
    `).all(parseInt(workerId));

    // Format response
    const formattedWorker = {
      id: worker.id,
      phone: worker.phone,
      fullName: worker.full_name,
      address: worker.address,
      skill: worker.skill,
      avgRating: worker.avg_rating || 0,
      isVerified: worker.is_verified === 1,
      createdAt: worker.created_at,
      certificates: certificates.map(cert => ({
        id: cert.id,
        imageUrl: cert.image_url,
        status: cert.status,
        reviewedAt: cert.reviewed_at
      }))
    };

    res.status(200).json(formattedWorker);
  } catch (error) {
    console.error('Error getting worker:', error);
    next(error);
  }
}

module.exports = {
  listWorkers,
  getWorkerById
};

