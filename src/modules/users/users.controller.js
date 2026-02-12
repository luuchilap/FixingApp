/**
 * User controller
 * Handles user profile operations
 */

const db = require('../../config/db');

/**
 * Get current user profile
 */
async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user.id;

    // Get user data
    const userResult = await db.query('SELECT id, phone, full_name, address, created_at FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get user role
    const userRoleResult = await db.query(`
      SELECT r.name 
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `, [userId]);
    const userRole = userRoleResult.rows[0];

    res.status(200).json({
      id: user.id,
      phone: user.phone,
      fullName: user.full_name,
      address: user.address,
      role: userRole.name,
      createdAt: user.created_at
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user profile
 */
async function updateCurrentUser(req, res, next) {
  try {
    const userId = req.user.id;
    const { fullName, address } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(fullName);
    }

    if (address !== undefined) {
      updates.push(`address = $${paramIndex++}`);
      values.push(address);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        message: 'Provide at least one field (fullName or address)'
      });
    }

    // Add updated_at
    updates.push(`updated_at = $${paramIndex++}`);
    values.push(Date.now());
    values.push(userId); // For WHERE clause

    // Update user
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await db.query(updateQuery, values);

    // Get updated user data
    const userResult = await db.query('SELECT id, phone, full_name, address, created_at, updated_at FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Get user role
    const userRoleResult = await db.query(`
      SELECT r.name 
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `, [userId]);
    const userRole = userRoleResult.rows[0];

    res.status(200).json({
      id: user.id,
      phone: user.phone,
      fullName: user.full_name,
      address: user.address,
      role: userRole.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current user's location (latitude/longitude)
 */
async function updateMyLocation(req, res, next) {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        error: 'latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates'
      });
    }

    const now = Date.now();
    await db.query(
      'UPDATE users SET latitude = $1, longitude = $2, location_updated_at = $3, updated_at = $4 WHERE id = $5',
      [lat, lng, now, now, userId]
    );

    res.status(200).json({
      latitude: lat,
      longitude: lng,
      locationUpdatedAt: now
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a user's location by user ID
 * Requires authentication. Used for tracking between worker/employer.
 */
async function getUserLocation(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.userId);
    const requesterId = req.user.id;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Security: only allow if there's an accepted application linking these two users
    const linkCheck = await db.query(`
      SELECT ja.id FROM job_applications ja
      JOIN jobs j ON j.id = ja.job_id
      WHERE (
        (j.employer_id = $1 AND ja.worker_id = $2)
        OR
        (j.employer_id = $2 AND ja.worker_id = $1)
      )
      AND ja.status = 'ACCEPTED'
      LIMIT 1
    `, [requesterId, targetUserId]);

    if (linkCheck.rows.length === 0) {
      return res.status(403).json({
        error: 'You can only view location of users linked through an accepted application'
      });
    }

    const result = await db.query(
      'SELECT latitude, longitude, location_updated_at FROM users WHERE id = $1',
      [targetUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.status(200).json({
      userId: targetUserId,
      latitude: user.latitude ? parseFloat(user.latitude) : null,
      longitude: user.longitude ? parseFloat(user.longitude) : null,
      locationUpdatedAt: user.location_updated_at ? parseInt(user.location_updated_at) : null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  updateMyLocation,
  getUserLocation
};
