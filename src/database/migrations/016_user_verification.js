/**
 * Add verification fields to users table
 * id_image_url: URL of uploaded ID card / certificate image
 * verification_status: PENDING / APPROVED / REJECTED
 */

async function up(client) {
  const exec = async (sql) => {
    if (client) {
      await client.query(sql);
    } else {
      const db = require('../../config/db');
      await db.exec(sql);
    }
  };

  await exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS id_image_url TEXT;");
  await exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'NONE';");
  await exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at BIGINT;");

  console.log('Added verification columns to users table');
}

async function down(client) {
  const exec = async (sql) => {
    if (client) {
      await client.query(sql);
    } else {
      const db = require('../../config/db');
      await db.exec(sql);
    }
  };

  await exec('ALTER TABLE users DROP COLUMN IF EXISTS id_image_url;');
  await exec('ALTER TABLE users DROP COLUMN IF EXISTS verification_status;');
  await exec('ALTER TABLE users DROP COLUMN IF EXISTS verified_at;');

  console.log('Removed verification columns from users table');
}

module.exports = { up, down };
