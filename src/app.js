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
// Increase body size limit to handle base64 images (50MB)
// Skip body parsing for multipart/form-data to allow multer to handle it
// This is critical for Vercel serverless functions where multer needs to parse multipart requests
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  // Skip body parsing for multipart/form-data - let multer handle it
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  // For non-multipart requests, apply JSON parser
  express.json({ limit: '500mb' })(req, res, next);
});
// Apply URL-encoded parser only for non-multipart requests
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  // Skip body parsing for multipart/form-data
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  // For non-multipart requests, apply URL-encoded parser
  express.urlencoded({ extended: true, limit: '500mb' })(req, res, next);
});

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

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
app.use('/api/applications', require('./modules/applications/applications.routes'));
app.use('/api/workers', require('./modules/workers/workers.routes'));
app.use('/api/workers/certificates', require('./modules/certificates/certificates.routes'));
app.use('/api', require('./modules/reviews/reviews.routes'));
app.use('/api/complaints', require('./modules/complaints/complaints.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/conversations', require('./modules/conversations/conversations.routes'));
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
  console.error('Error stack:', err.stack);

  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON. Please check your data format.'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request body is too large. Maximum size is 500MB.'
    });
  }

  // Don't leak error details in production
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
});

module.exports = app;

