/**
 * Add is_locked column to users table
 * Allows admin to lock/unlock user accounts
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

  await exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;');

  console.log('Added is_locked column to users table');
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

  await exec('ALTER TABLE users DROP COLUMN IF EXISTS is_locked;');

  console.log('Removed is_locked column from users table');
}

module.exports = { up, down };
