/**
 * App guides schema migration
 * Creates: app_guides table for "Hướng dẫn sử dụng app" section
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

  // Create app_guides table
  await exec(`
    CREATE TABLE IF NOT EXISTS app_guides (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      icon_name VARCHAR(100),
      sort_order INTEGER DEFAULT 0,
      is_published BOOLEAN DEFAULT TRUE,
      view_count INTEGER DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `);

  // Create indexes
  await exec('CREATE INDEX IF NOT EXISTS idx_app_guides_category ON app_guides(category);');
  await exec('CREATE INDEX IF NOT EXISTS idx_app_guides_published ON app_guides(is_published);');
  await exec('CREATE INDEX IF NOT EXISTS idx_app_guides_sort ON app_guides(sort_order ASC, created_at DESC);');

  console.log('App guides schema migration completed');
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

  await exec('DROP TABLE IF EXISTS app_guides;');
  console.log('App guides schema rollback completed');
}

module.exports = { up, down };
