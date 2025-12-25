/**
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel deployment
 * 
 * Note: Migrations should be run separately before deployment
 * or on first function invocation (with caching to prevent re-runs)
 */

require('dotenv').config();

// Only run migrations once (cache the result)
let migrationsRun = false;

async function ensureMigrations() {
  if (migrationsRun) return;
  
  try {
    const { runMigrations } = require('../src/database/migrate');
    await runMigrations();
    migrationsRun = true;
    console.log('Migrations completed');
  } catch (error) {
    console.error('Migration error (non-fatal):', error.message);
    // Don't throw - allow API to work even if migrations fail
    // Migrations should ideally be run separately before deployment
  }
}

// Initialize migrations (non-blocking)
ensureMigrations().catch(console.error);

// Export the Express app as a serverless function
const app = require('../src/app');

module.exports = app;
