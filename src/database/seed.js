/**
 * Database seed script
 * Populates the database with sample data for testing
 */

require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Sample data
const sampleEmployers = [
  {
    phone: '0901234567',
    password: 'password123',
    fullName: 'Nguyễn Văn A',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    role: 'EMPLOYER'
  },
  {
    phone: '0902345678',
    password: 'password123',
    fullName: 'Trần Thị B',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    role: 'EMPLOYER'
  }
];

const sampleWorkers = [
  {
    phone: '0913456789',
    password: 'password123',
    fullName: 'Lê Văn C',
    address: '789 Đường DEF, Quận 3, TP.HCM',
    role: 'WORKER',
    skill: 'Plumbing'
  },
  {
    phone: '0914567890',
    password: 'password123',
    fullName: 'Phạm Thị D',
    address: '321 Đường GHI, Quận 4, TP.HCM',
    role: 'WORKER',
    skill: 'Electrical'
  },
  {
    phone: '0915678901',
    password: 'password123',
    fullName: 'Hoàng Văn E',
    address: '654 Đường JKL, Quận 5, TP.HCM',
    role: 'WORKER',
    skill: 'Carpentry'
  }
];

const sampleAdmins = [
  {
    phone: '0999999999',
    password: 'admin123',
    fullName: 'Admin User',
    address: 'Admin Office',
    role: 'ADMIN'
  }
];

const sampleJobs = [
  {
    employerPhone: '0901234567',
    title: 'Sửa chữa đường ống nước bị rò rỉ',
    description: 'Cần thợ sửa chữa đường ống nước trong nhà bị rò rỉ. Công việc cần hoàn thành trong 2 ngày.',
    price: 500000,
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requiredSkill: 'Plumbing',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0901234567',
    title: 'Lắp đặt hệ thống điện mới',
    description: 'Cần thợ điện lắp đặt hệ thống điện cho căn hộ mới. Diện tích 80m2.',
    price: 3000000,
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requiredSkill: 'Electrical',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0902345678',
    title: 'Đóng tủ bếp gỗ',
    description: 'Cần thợ mộc đóng tủ bếp gỗ theo thiết kế. Kích thước 3m x 0.6m.',
    price: 8000000,
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    requiredSkill: 'Carpentry',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0902345678',
    title: 'Sửa chữa vòi nước bị hỏng',
    description: 'Vòi nước trong phòng tắm bị hỏng, cần thay mới.',
    price: 300000,
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    requiredSkill: 'Plumbing',
    status: 'DANG_BAN_GIAO'
  }
];

const sampleCertificates = [
  {
    workerPhone: '0913456789',
    imageUrl: '/static/certificates/plumber-cert-001.jpg',
    status: 'APPROVED'
  },
  {
    workerPhone: '0914567890',
    imageUrl: '/static/certificates/electrician-cert-001.jpg',
    status: 'PENDING'
  }
];

/**
 * Get role ID by name
 */
function getRoleId(roleName) {
  const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }
  return role.id;
}

/**
 * Get user ID by phone
 */
function getUserIdByPhone(phone) {
  const user = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  return user ? user.id : null;
}

/**
 * Create a user with role and profile
 */
function createUser(userData) {
  const { phone, password, fullName, address, role, skill } = userData;
  
  // Check if user already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existingUser) {
    console.log(`  ⚠ User ${phone} already exists, skipping...`);
    return existingUser.id;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const now = Date.now();
  const roleId = getRoleId(role);

  // Insert user
  const insertUser = db.prepare(`
    INSERT INTO users (phone, password_hash, full_name, address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const userResult = insertUser.run(phone, passwordHash, fullName, address, now, now);
  const userId = userResult.lastInsertRowid;

  // Assign role
  const assignRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
  assignRole.run(userId, roleId);

  // Create profile
  if (role === 'EMPLOYER') {
    const createProfile = db.prepare('INSERT INTO employer_profiles (user_id) VALUES (?)');
    createProfile.run(userId);
  } else if (role === 'WORKER') {
    const createProfile = db.prepare(`
      INSERT INTO worker_profiles (user_id, skill) VALUES (?, ?)
    `);
    createProfile.run(userId, skill || null);
  }

  console.log(`  ✓ Created ${role} user: ${fullName} (${phone})`);
  return userId;
}

/**
 * Create a job
 */
function createJob(jobData) {
  const { employerPhone, title, description, price, address, requiredSkill, status } = jobData;
  
  const employerId = getUserIdByPhone(employerPhone);
  if (!employerId) {
    console.log(`  ⚠ Employer ${employerPhone} not found, skipping job: ${title}`);
    return null;
  }

  const now = Date.now();
  const handoverDeadline = status === 'DANG_BAN_GIAO' ? now + (30 * 24 * 60 * 60 * 1000) : null;

  const insertJob = db.prepare(`
    INSERT INTO jobs (
      employer_id, title, description, price, address, required_skill,
      status, handover_deadline, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertJob.run(
    employerId,
    title,
    description,
    price,
    address,
    requiredSkill,
    status,
    handoverDeadline,
    now,
    now
  );

  console.log(`  ✓ Created job: ${title}`);
  return result.lastInsertRowid;
}

/**
 * Create a certificate
 */
function createCertificate(certData) {
  const { workerPhone, imageUrl, status } = certData;
  
  const workerId = getUserIdByPhone(workerPhone);
  if (!workerId) {
    console.log(`  ⚠ Worker ${workerPhone} not found, skipping certificate`);
    return null;
  }

  const reviewedBy = status === 'APPROVED' ? getUserIdByPhone('0999999999') : null;
  const reviewedAt = status === 'APPROVED' ? Date.now() : null;

  const insertCert = db.prepare(`
    INSERT INTO worker_certificates (worker_id, image_url, status, reviewed_by, reviewed_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = insertCert.run(workerId, imageUrl, status, reviewedBy, reviewedAt);

  // Update worker profile if approved
  if (status === 'APPROVED') {
    db.prepare('UPDATE worker_profiles SET is_verified = 1 WHERE user_id = ?').run(workerId);
  }

  console.log(`  ✓ Created certificate for worker ${workerPhone} (${status})`);
  return result.lastInsertRowid;
}

/**
 * Main seed function
 */
function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Create users
    console.log('Creating users...');
    sampleAdmins.forEach(createUser);
    sampleEmployers.forEach(createUser);
    sampleWorkers.forEach(createUser);
    console.log('');

    // Create jobs
    console.log('Creating jobs...');
    sampleJobs.forEach(createJob);
    console.log('');

    // Create certificates
    console.log('Creating certificates...');
    sampleCertificates.forEach(createCertificate);
    console.log('');

    console.log('✅ Database seed completed successfully!');
    console.log('\n📋 Sample accounts:');
    console.log('  Admin:');
    console.log('    Phone: 0999999999');
    console.log('    Password: admin123');
    console.log('\n  Employers:');
    sampleEmployers.forEach(emp => {
      console.log(`    Phone: ${emp.phone}, Password: ${emp.password}`);
    });
    console.log('\n  Workers:');
    sampleWorkers.forEach(worker => {
      console.log(`    Phone: ${worker.phone}, Password: ${worker.password}, Skill: ${worker.skill}`);
    });
    console.log('\n💡 You can now test the API using these accounts in Swagger UI!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed();
  db.close();
}

module.exports = { seed };

