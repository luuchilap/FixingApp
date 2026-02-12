/**
 * User location migration
 * Adds latitude and longitude columns to users table for location tracking
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

  // Add latitude, longitude and location_updated_at to users table
  await exec(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
    ADD COLUMN IF NOT EXISTS location_updated_at BIGINT;
  `);

  // Index for location queries
  await exec('CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;');

  console.log('User location migration completed');
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

  await exec('DROP INDEX IF EXISTS idx_users_location;');
  await exec(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude,
    DROP COLUMN IF EXISTS location_updated_at;
  `);

  console.log('User location migration rolled back');
}

module.exports = { up, down };
