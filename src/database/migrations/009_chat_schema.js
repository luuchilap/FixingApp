/**
 * Chat schema migration
 * Creates: conversations and messages tables
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
  
  // Create conversations table
  await exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      last_message_at BIGINT,
      employer_unread_count INTEGER DEFAULT 0,
      worker_unread_count INTEGER DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(job_id, worker_id)
    );
  `);

  // Create messages table
  await exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      message_type VARCHAR(20) DEFAULT 'TEXT',
      is_read BOOLEAN DEFAULT FALSE,
      created_at BIGINT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  await exec('CREATE INDEX IF NOT EXISTS idx_conversations_job ON conversations(job_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_conversations_employer ON conversations(employer_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_conversations_worker ON conversations(worker_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);');
  await exec('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);');
  await exec('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read, sender_id);');

  console.log('Chat schema migration completed');
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
  
  await exec('DROP TABLE IF EXISTS messages;');
  await exec('DROP TABLE IF EXISTS conversations;');
  console.log('Chat schema migration rolled back');
}

module.exports = { up, down };
