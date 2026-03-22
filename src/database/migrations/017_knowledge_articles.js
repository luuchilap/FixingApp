/**
 * Knowledge articles schema migration
 * Creates: knowledge_articles table
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

  // Create knowledge_articles table
  await exec(`
    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      thumbnail_url TEXT,
      author_name VARCHAR(150),
      is_published BOOLEAN DEFAULT TRUE,
      view_count INTEGER DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `);

  // Create indexes
  await exec('CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_articles(category);');
  await exec('CREATE INDEX IF NOT EXISTS idx_knowledge_published ON knowledge_articles(is_published);');
  await exec('CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge_articles(created_at DESC);');

  console.log('Knowledge articles schema migration completed');
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

  await exec('DROP TABLE IF EXISTS knowledge_articles;');
  console.log('Knowledge articles schema rollback completed');
}

module.exports = { up, down };
