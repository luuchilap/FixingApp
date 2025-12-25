/**
 * Notifications schema migration
 * Creates: notifications table
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
  
  // Create notifications table
  await exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  await exec('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);');
  await exec('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);');

  console.log('Notifications schema migration completed');
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
  
  await exec('DROP TABLE IF EXISTS notifications;');

  console.log('Notifications schema migration rolled back');
}

module.exports = { up, down };
