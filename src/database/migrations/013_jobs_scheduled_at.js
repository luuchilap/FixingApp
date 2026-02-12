/**
 * Add scheduled_at column to jobs table
 * NULL = immediate / ngay bây giờ
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

    await exec('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_at BIGINT;');

    console.log('Migration 013: Added scheduled_at column to jobs table');
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

    await exec('ALTER TABLE jobs DROP COLUMN IF EXISTS scheduled_at;');

    console.log('Migration 013: Removed scheduled_at column from jobs table');
}

module.exports = { up, down };
