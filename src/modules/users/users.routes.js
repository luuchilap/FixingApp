/**
 * User routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const {
  getCurrentUser,
  updateCurrentUser,
  updateMyLocation,
  getUserLocation,
  uploadIdImage,
  uploadAvatar
} = require('./users.controller');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);
router.put('/me/location', updateMyLocation);
router.post('/me/upload-id', upload.single('image'), uploadIdImage);
router.post('/me/upload-avatar', upload.single('image'), uploadAvatar);
router.get('/:userId/location', getUserLocation);

module.exports = router;

