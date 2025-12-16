/**
 * System routes
 * System maintenance and task endpoints
 */

const express = require('express');
const router = express.Router();
const { expireHandoverJobs } = require('./system.controller');

// System task endpoint (no authentication required for system/internal use)
// In production, this should be protected or called by a scheduler
router.post('/jobs/expire-handover', expireHandoverJobs);

module.exports = router;

