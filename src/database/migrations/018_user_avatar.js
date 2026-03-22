/**
 * Add avatar_url column to users table
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

  await exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;");

  console.log('Added avatar_url column to users table');
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

  await exec("ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;");

  console.log('Removed avatar_url column from users table');
}

module.exports = { up, down };
