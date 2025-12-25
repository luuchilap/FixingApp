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

module.exports = {
  getCurrentUser,
  updateCurrentUser
};
