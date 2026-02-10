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
    skill: 'PLUMBING'
  },
  {
    phone: '0914567890',
    password: 'password123',
    fullName: 'Phạm Thị D',
    address: '321 Đường GHI, Quận 4, TP.HCM',
    role: 'WORKER',
    skill: 'ELECTRICAL'
  },
  {
    phone: '0915678901',
    password: 'password123',
    fullName: 'Hoàng Văn E',
    address: '654 Đường JKL, Quận 5, TP.HCM',
    role: 'WORKER',
    skill: 'CARPENTRY'
  },
  {
    phone: '0916789012',
    password: 'password123',
    fullName: 'Nguyễn Thị F',
    address: '987 Đường MNO, Quận 6, TP.HCM',
    role: 'WORKER',
    skill: 'PAINTING'
  },
  {
    phone: '0917890123',
    password: 'password123',
    fullName: 'Trần Văn G',
    address: '654 Đường PQR, Quận 7, TP.HCM',
    role: 'WORKER',
    skill: 'AC_REPAIR'
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
    requiredSkill: 'PLUMBING',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0901234567',
    title: 'Lắp đặt hệ thống điện mới',
    description: 'Cần thợ điện lắp đặt hệ thống điện cho căn hộ mới. Diện tích 80m2.',
    price: 3000000,
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requiredSkill: 'ELECTRICAL',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0902345678',
    title: 'Đóng tủ bếp gỗ',
    description: 'Cần thợ mộc đóng tủ bếp gỗ theo thiết kế. Kích thước 3m x 0.6m.',
    price: 8000000,
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    requiredSkill: 'CARPENTRY',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0902345678',
    title: 'Sửa chữa vòi nước bị hỏng',
    description: 'Vòi nước trong phòng tắm bị hỏng, cần thay mới.',
    price: 300000,
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    requiredSkill: 'PLUMBING',
    status: 'DANG_BAN_GIAO'
  },
  {
    employerPhone: '0901234567',
    title: 'Sơn lại tường phòng khách',
    description: 'Cần thợ sơn lại tường phòng khách, diện tích 30m2.',
    price: 2000000,
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requiredSkill: 'PAINTING',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0902345678',
    title: 'Sửa máy lạnh không lạnh',
    description: 'Máy lạnh trong phòng ngủ không lạnh, cần kiểm tra và sửa chữa.',
    price: 1500000,
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    requiredSkill: 'AC_REPAIR',
    status: 'CHUA_LAM'
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
async function getRoleId(roleName) {
  const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [roleName]);
  if (roleResult.rows.length === 0) {
    throw new Error(`Role ${roleName} not found`);
  }
  return roleResult.rows[0].id;
}

/**
 * Get user ID by phone
 */
async function getUserIdByPhone(phone) {
  const userResult = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
  return userResult.rows.length > 0 ? userResult.rows[0].id : null;
}

/**
 * Normalize skill value - maps old skill values to new standardized ones
 * If skill doesn't match any known skill, returns 'OTHER'
 */
function normalizeSkill(skill) {
  if (!skill) return null;

  const upperSkill = skill.toUpperCase().trim();

  // Map old values to new standardized values
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
    'ENTERTAINMENT': 'ENTERTAINMENT',
    'HOUSEWORK': 'HOUSEWORK',
    'DELIVERY': 'DELIVERY',
    'ERRANDS': 'ERRANDS',
    'MISC_TASKS': 'MISC_TASKS',
    'OTHER': 'OTHER'
  };

  // Check if it's a known skill
  if (skillMap[upperSkill]) {
    return skillMap[upperSkill];
  }

  // If not found, return OTHER
  return 'OTHER';
}

/**
 * Create a user with role and profile
 */
async function createUser(userData) {
  const { phone, password, fullName, address, role, skill } = userData;

  // Check if user already exists
  const existingUserId = await getUserIdByPhone(phone);
  if (existingUserId) {
    console.log(`  ⚠ User ${phone} already exists, skipping...`);
    return existingUserId;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = Date.now();
  const roleId = await getRoleId(role);

  // Insert user
  const userResult = await db.query(`
    INSERT INTO users (phone, password_hash, full_name, address, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [phone, passwordHash, fullName, address, now, now]);
  const userId = userResult.rows[0].id;

  // Assign role
  await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);

  // Create profile
  if (role === 'EMPLOYER') {
    await db.query('INSERT INTO employer_profiles (user_id) VALUES ($1)', [userId]);
  } else if (role === 'WORKER') {
    const normalizedSkill = normalizeSkill(skill);
    await db.query('INSERT INTO worker_profiles (user_id, skill) VALUES ($1, $2)', [userId, normalizedSkill]);
  }

  console.log(`  ✓ Created ${role} user: ${fullName} (${phone})`);
  return userId;
}

/**
 * Create a job
 */
async function createJob(jobData) {
  const { employerPhone, title, description, price, address, requiredSkill, status } = jobData;

  const employerId = await getUserIdByPhone(employerPhone);
  if (!employerId) {
    console.log(`  ⚠ Employer ${employerPhone} not found, skipping job: ${title}`);
    return null;
  }

  const now = Date.now();
  const handoverDeadline = status === 'DANG_BAN_GIAO' ? now + (30 * 24 * 60 * 60 * 1000) : null;

  // Normalize skill to ensure it matches one of the fixed skill values
  const normalizedSkill = normalizeSkill(requiredSkill);

  const result = await db.query(`
    INSERT INTO jobs (
      employer_id, title, description, price, address, required_skill,
      status, handover_deadline, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [
    employerId,
    title,
    description,
    price,
    address,
    normalizedSkill,
    status,
    handoverDeadline,
    now,
    now
  ]);

  console.log(`  ✓ Created job: ${title}`);
  return result.rows[0].id;
}

/**
 * Create a certificate
 */
async function createCertificate(certData) {
  const { workerPhone, imageUrl, status } = certData;

  const workerId = await getUserIdByPhone(workerPhone);
  if (!workerId) {
    console.log(`  ⚠ Worker ${workerPhone} not found, skipping certificate`);
    return null;
  }

  const reviewedBy = status === 'APPROVED' ? await getUserIdByPhone('0999999999') : null;
  const reviewedAt = status === 'APPROVED' ? Date.now() : null;

  const result = await db.query(`
    INSERT INTO worker_certificates (worker_id, image_url, status, reviewed_by, reviewed_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [workerId, imageUrl, status, reviewedBy, reviewedAt]);

  // Update worker profile if approved
  if (status === 'APPROVED') {
    await db.query('UPDATE worker_profiles SET is_verified = TRUE WHERE user_id = $1', [workerId]);
  }

  console.log(`  ✓ Created certificate for worker ${workerPhone} (${status})`);
  return result.rows[0].id;
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Create users
    console.log('Creating users...');
    for (const admin of sampleAdmins) {
      await createUser(admin);
    }
    for (const employer of sampleEmployers) {
      await createUser(employer);
    }
    for (const worker of sampleWorkers) {
      await createUser(worker);
    }
    console.log('');

    // Create jobs
    console.log('Creating jobs...');
    for (const job of sampleJobs) {
      await createJob(job);
    }
    console.log('');

    // Create certificates
    console.log('Creating certificates...');
    for (const cert of sampleCertificates) {
      await createCertificate(cert);
    }
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
  } finally {
    // Close database connection pool
    await db.pool.end();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}

module.exports = { seed };
