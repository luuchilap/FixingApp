/**
 * Authentication controller
 * Handles registration, login, and logout
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

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
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({
        error: 'Phone number already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get EMPLOYER role ID
    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get('EMPLOYER');
    if (!role) {
      return res.status(500).json({
        error: 'System error: EMPLOYER role not found'
      });
    }

    const now = Date.now();

    // Create user and profile in transaction
    const result = db.transaction(() => {
      // Insert user
      const insertUser = db.prepare(`
        INSERT INTO users (phone, password_hash, full_name, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const userResult = insertUser.run(phone, passwordHash, fullName, address || null, now, now);
      const userId = userResult.lastInsertRowid;

      // Assign role
      const assignRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      assignRole.run(userId, role.id);

      // Create employer profile
      const createProfile = db.prepare('INSERT INTO employer_profiles (user_id) VALUES (?)');
      createProfile.run(userId);

      return { userId, roleName: 'EMPLOYER' };
    })();

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.userId, role: result.roleName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get user data
    const user = db.prepare('SELECT id, phone, full_name, address, created_at FROM users WHERE id = ?')
      .get(result.userId);

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
    const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingUser) {
      return res.status(400).json({
        error: 'Phone number already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get WORKER role ID
    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get('WORKER');
    if (!role) {
      return res.status(500).json({
        error: 'System error: WORKER role not found'
      });
    }

    const now = Date.now();

    // Create user and profile in transaction
    const result = db.transaction(() => {
      // Insert user
      const insertUser = db.prepare(`
        INSERT INTO users (phone, password_hash, full_name, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const userResult = insertUser.run(phone, passwordHash, fullName, address || null, now, now);
      const userId = userResult.lastInsertRowid;

      // Assign role
      const assignRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      assignRole.run(userId, role.id);

      // Create worker profile
      const createProfile = db.prepare('INSERT INTO worker_profiles (user_id, skill) VALUES (?, ?)');
      createProfile.run(userId, skill);

      return { userId, roleName: 'WORKER' };
    })();

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.userId, role: result.roleName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get user data
    const user = db.prepare('SELECT id, phone, full_name, address, created_at FROM users WHERE id = ?')
      .get(result.userId);

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
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Get user role
    const userRole = db.prepare(`
      SELECT r.name 
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).get(user.id);

    if (!userRole) {
      return res.status(500).json({
        error: 'System error: User role not found'
      });
    }

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

