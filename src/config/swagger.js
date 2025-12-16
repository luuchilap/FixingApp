/**
 * Swagger/OpenAPI configuration
 * Sets up Swagger UI for API documentation and testing
 */

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load Swagger YAML file
const swaggerDocument = YAML.load(path.join(__dirname, '../../swagger/swagger.yaml'));

// Swagger UI options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FixingApp API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true, // Keep authorization token after page refresh
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
};

// Custom setup function to expose swagger.json endpoint
const setupSwagger = (app) => {
  // Serve Swagger JSON
  app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
};

module.exports = {
  swaggerUi,
  swaggerDocument,
  swaggerOptions,
  setupSwagger
};

