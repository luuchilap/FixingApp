/**
 * Add type and job_id columns to notifications table
 * so notifications can be linked to specific jobs or categories.
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

  await exec(`
    ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS job_id INTEGER;
  `);

  await exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_notifications_job'
      ) THEN
        ALTER TABLE notifications
        ADD CONSTRAINT fk_notifications_job
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
      END IF;
    END$$;
  `);

  await exec('CREATE INDEX IF NOT EXISTS idx_notifications_job ON notifications(job_id);');
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

  await exec(`
    ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS fk_notifications_job;
  `);

  await exec(`
    ALTER TABLE notifications
    DROP COLUMN IF EXISTS job_id,
    DROP COLUMN IF EXISTS type;
  `);

  await exec('DROP INDEX IF EXISTS idx_notifications_job;');
}

module.exports = { up, down };

