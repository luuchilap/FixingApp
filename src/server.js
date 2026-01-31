/**
 * Server entry point
 * Starts the Express server
 */

require('dotenv').config();
const { runMigrations } = require('./database/migrate');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Run migrations on startup, then start server
async function startServer() {
  try {
    await runMigrations();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
      console.log(`Network: http://10.0.214.66:${PORT} (for mobile devices)`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

const server = startServer();

module.exports = server;

