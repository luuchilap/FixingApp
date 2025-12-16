/**
 * Express application setup
 * Configures middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const { setupSwagger } = require('./config/swagger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simple version for MVP)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Swagger UI documentation
setupSwagger(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
// System routes (must come before /api/jobs to avoid route conflicts)
app.use('/api/system', require('./modules/system/system.routes'));
app.use('/api/jobs', require('./modules/jobs/jobs.routes'));
app.use('/api/jobs', require('./modules/applications/applications.routes'));
app.use('/api/workers/certificates', require('./modules/certificates/certificates.routes'));
app.use('/api', require('./modules/reviews/reviews.routes'));
app.use('/api/complaints', require('./modules/complaints/complaints.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
// etc.

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details in production
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;

