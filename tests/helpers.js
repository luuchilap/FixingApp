/**
 * Test helper functions
 * Provides utilities for creating test data, making authenticated requests, etc.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-change-in-production';

/**
 * Hash a password for testing
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Generate JWT token for a user
 */
function generateToken(userId, role) {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Create a test user in the database
 */
function createTestUser(db, userData) {
  const {
    phone = '0123456789',
    password = 'password123',
    fullName = 'Test User',
    address = 'Test Address',
    roleName = 'EMPLOYER'
  } = userData;

  const passwordHash = bcrypt.hashSync(password, 10);
  const now = Date.now();

  // Insert user
  const insertUser = db.prepare(`
    INSERT INTO users (phone, password_hash, full_name, address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = insertUser.run(phone, passwordHash, fullName, address, now, now);
  const userId = result.lastInsertRowid;

  // Get role ID
  const getRole = db.prepare('SELECT id FROM roles WHERE name = ?');
  const role = getRole.get(roleName);
  
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  // Assign role
  const assignRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
  assignRole.run(userId, role.id);

  // Create profile based on role
  if (roleName === 'EMPLOYER') {
    const createEmployerProfile = db.prepare('INSERT INTO employer_profiles (user_id) VALUES (?)');
    createEmployerProfile.run(userId);
  } else if (roleName === 'WORKER') {
    const createWorkerProfile = db.prepare(`
      INSERT INTO worker_profiles (user_id, skill) VALUES (?, ?)
    `);
    createWorkerProfile.run(userId, userData.skill || 'Plumbing');
  }

  return {
    id: userId,
    phone,
    fullName,
    role: roleName,
    token: generateToken(userId, roleName)
  };
}

/**
 * Create a test job in the database
 */
function createTestJob(db, jobData) {
  const {
    employerId,
    title = 'Test Job',
    description = 'Test Description',
    price = 100000,
    address = 'Test Address',
    requiredSkill = 'Plumbing',
    status = 'CHUA_LAM',
    acceptedWorkerId = null,
    handoverDeadline = null
  } = jobData;

  const now = Date.now();
  const finalHandoverDeadline = handoverDeadline !== undefined 
    ? handoverDeadline 
    : (status === 'DANG_BAN_GIAO' ? now + (30 * 24 * 60 * 60 * 1000) : null);

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      employer_id, title, description, price, address, required_skill,
      status, accepted_worker_id, handover_deadline, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertJob.run(
    employerId,
    title,
    description,
    price,
    address,
    requiredSkill,
    status,
    acceptedWorkerId,
    finalHandoverDeadline,
    now,
    now
  );

  return {
    id: result.lastInsertRowid,
    employerId,
    title,
    status
  };
}

/**
 * Create a test job application
 */
function createTestApplication(db, applicationData) {
  const {
    jobId,
    workerId,
    status = 'APPLIED'
  } = applicationData;

  const now = Date.now();

  const insertApplication = db.prepare(`
    INSERT INTO job_applications (job_id, worker_id, status, applied_at)
    VALUES (?, ?, ?, ?)
  `);

  const result = insertApplication.run(jobId, workerId, status, now);

  return {
    id: result.lastInsertRowid,
    jobId,
    workerId,
    status
  };
}

/**
 * Create a test worker certificate
 */
function createTestCertificate(db, certificateData) {
  const {
    workerId,
    imageUrl = '/static/test-certificate.jpg',
    status = 'PENDING'
  } = certificateData;

  const insertCert = db.prepare(`
    INSERT INTO worker_certificates (worker_id, image_url, status)
    VALUES (?, ?, ?)
  `);

  const result = insertCert.run(workerId, imageUrl, status);

  return {
    id: result.lastInsertRowid,
    workerId,
    imageUrl,
    status
  };
}

module.exports = {
  hashPassword,
  generateToken,
  createTestUser,
  createTestJob,
  createTestApplication,
  createTestCertificate,
  JWT_SECRET
};

