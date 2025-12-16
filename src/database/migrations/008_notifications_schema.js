/**
 * Notifications schema migration
 * Creates: notifications table
 */

const db = require('../../config/db');

function up() {
  // Create notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);');

  console.log('Notifications schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS notifications;');

  console.log('Notifications schema migration rolled back');
}

module.exports = { up, down };

