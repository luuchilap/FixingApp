/**
 * User routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');
const {
  getCurrentUser,
  updateCurrentUser,
  updateMyLocation,
  getUserLocation
} = require('./users.controller');

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);
router.put('/me/location', updateMyLocation);
router.get('/:userId/location', getUserLocation);

module.exports = router;

