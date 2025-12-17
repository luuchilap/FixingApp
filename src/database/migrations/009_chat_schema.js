/**
 * Chat schema migration
 * Creates: conversations and messages tables
 */

const db = require('../../config/db');

function up() {
  // Create conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_message_at INTEGER,
      employer_unread_count INTEGER DEFAULT 0,
      worker_unread_count INTEGER DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(job_id, worker_id)
    );
  `);

  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      message_type VARCHAR(20) DEFAULT 'TEXT',
      is_read BOOLEAN DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_job ON conversations(job_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_employer ON conversations(employer_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_worker ON conversations(worker_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read, sender_id);');

  console.log('Chat schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS messages;');
  db.exec('DROP TABLE IF EXISTS conversations;');
  console.log('Chat schema migration rolled back');
}

module.exports = { up, down };

