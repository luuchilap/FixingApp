/**
 * Admin Panel controller (public - no auth required)
 * Provides user management for admin web interface
 */

const db = require('../../config/db');

/**
 * Get all users with their roles
 */
async function getAllUsers(req, res, next) {
  try {
    const { search, role, locked, verification } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.phone ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`r.name = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (locked === 'true') {
      whereConditions.push('u.is_locked = TRUE');
    } else if (locked === 'false') {
      whereConditions.push('(u.is_locked = FALSE OR u.is_locked IS NULL)');
    }

    if (verification) {
      whereConditions.push(`u.verification_status = $${paramIndex}`);
      params.push(verification);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `
      SELECT 
        u.id,
        u.phone,
        u.full_name,
        u.address,
        u.is_locked,
        u.id_image_url,
        u.verification_status,
        u.verified_at,
        u.created_at,
        u.updated_at,
        r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const result = await db.query(query, params);

    const users = result.rows.map(user => ({
      id: user.id,
      phone: user.phone,
      fullName: user.full_name,
      address: user.address,
      role: user.role,
      isLocked: user.is_locked === true,
      idImageUrl: user.id_image_url || null,
      verificationStatus: user.verification_status || 'NONE',
      verifiedAt: user.verified_at || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    res.status(200).json({ data: users, total: users.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle lock/unlock a user account
 */
async function toggleUserLock(req, res, next) {
  try {
    const { userId } = req.params;

    const userResult = await db.query('SELECT id, phone, full_name, is_locked FROM users WHERE id = $1', [parseInt(userId)]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const newLockStatus = !(user.is_locked === true);

    await db.query('UPDATE users SET is_locked = $1, updated_at = $2 WHERE id = $3', [newLockStatus, Date.now(), parseInt(userId)]);

    res.status(200).json({
      message: newLockStatus ? 'Tài khoản đã bị khoá' : 'Tài khoản đã được mở khoá',
      userId: user.id,
      isLocked: newLockStatus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify or reject a user's ID/certificate
 */
async function setVerificationStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    const userResult = await db.query('SELECT id, verification_status, id_image_url FROM users WHERE id = $1', [parseInt(userId)]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = Date.now();
    await db.query(
      'UPDATE users SET verification_status = $1, verified_at = $2, updated_at = $3 WHERE id = $4',
      [status, now, now, parseInt(userId)]
    );

    res.status(200).json({
      message: status === 'APPROVED' ? 'Đã xác thực người dùng' : 'Đã từ chối xác thực',
      userId: parseInt(userId),
      verificationStatus: status,
      verifiedAt: now,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  toggleUserLock,
  setVerificationStatus,
};
