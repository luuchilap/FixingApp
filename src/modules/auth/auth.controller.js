/**
 * Authentication controller
 * Handles registration, login, and logout
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const { normalizeSkill } = require('../../utils/normalizeSkill');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-change-in-production';

/**
 * Register a new employer
 */
async function registerEmployer(req, res, next) {
  try {
    const { phone, password, fullName, address } = req.body;

    // Validation
    if (!phone || !password || !fullName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'phone, password, and fullName are required'
      });
    }

    // Check if phone already exists
    const existingUserResult = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Phone number already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get EMPLOYER role ID
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['EMPLOYER']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        error: 'System error: EMPLOYER role not found'
      });
    }
    const role = roleResult.rows[0];

    const now = Date.now();

    // Create user and profile in transaction
    const result = await db.transaction(async (client) => {
      // Insert user
      const userResult = await client.query(`
        INSERT INTO users (phone, password_hash, full_name, address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [phone, passwordHash, fullName, address || null, now, now]);
      const userId = userResult.rows[0].id;

      // Assign role
      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, role.id]);

      // Create employer profile
      await client.query('INSERT INTO employer_profiles (user_id) VALUES ($1)', [userId]);

      return { userId, roleName: 'EMPLOYER' };
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.userId, role: result.roleName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get user data
    const userResult = await db.query('SELECT id, phone, full_name, address, created_at FROM users WHERE id = $1', [result.userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        address: user.address,
        role: result.roleName,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new worker
 */
async function registerWorker(req, res, next) {
  try {
    const { phone, password, fullName, address, skill } = req.body;

    // Validation
    if (!phone || !password || !fullName || !skill) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'phone, password, fullName, and skill are required'
      });
    }

    // Check if phone already exists
    const existingUserResult = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Phone number already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get WORKER role ID
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['WORKER']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        error: 'System error: WORKER role not found'
      });
    }
    const role = roleResult.rows[0];

    const now = Date.now();

    // Create user and profile in transaction
    const result = await db.transaction(async (client) => {
      // Insert user
      const userResult = await client.query(`
        INSERT INTO users (phone, password_hash, full_name, address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [phone, passwordHash, fullName, address || null, now, now]);
      const userId = userResult.rows[0].id;

      // Assign role
      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, role.id]);

      // Create worker profile
      // Normalize skill to ensure it matches one of the fixed skill values
      const normalizedSkill = normalizeSkill(skill);
      await client.query('INSERT INTO worker_profiles (user_id, skill) VALUES ($1, $2)', [userId, normalizedSkill]);

      return { userId, roleName: 'WORKER' };
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.userId, role: result.roleName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get user data
    const userResult = await db.query('SELECT id, phone, full_name, address, created_at FROM users WHERE id = $1', [result.userId]);
    const user = userResult.rows[0];

    res.status(201).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        address: user.address,
        role: result.roleName,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login
 */
async function login(req, res, next) {
  try {
    const { phone, password } = req.body;

    // Validation
    if (!phone || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'phone and password are required'
      });
    }

    // Find user
    const userResult = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Get user role
    const userRoleResult = await db.query(`
      SELECT r.name 
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `, [user.id]);

    if (userRoleResult.rows.length === 0) {
      return res.status(500).json({
        error: 'System error: User role not found'
      });
    }
    const userRole = userRoleResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: userRole.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        address: user.address,
        role: userRole.name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout (optional in MVP - token invalidation not implemented)
 */
function logout(req, res) {
  // In MVP, logout is just a success response
  // Token invalidation would require a token blacklist, which is out of scope
  res.status(200).json({
    message: 'Logged out successfully'
  });
}

module.exports = {
  registerEmployer,
  registerWorker,
  login,
  logout
};
