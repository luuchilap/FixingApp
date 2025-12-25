/**
 * Vercel Serverless Function Entry Point
 * Wraps the Express app for Vercel deployment
 * 
 * This file must be in the /api directory for Vercel to recognize it
 * as a serverless function when using the builds configuration.
 */

require('dotenv').config();

// Only run migrations once (cache the result per function instance)
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
// Vercel expects this to be a standard Express app export
const app = require('../src/app');

// For Vercel serverless functions, export the app directly
// The routing in vercel.json will handle path matching
module.exports = app;
