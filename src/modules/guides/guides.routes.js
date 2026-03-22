/**
 * App Guides routes
 * Public: list and get guides
 * Admin: create, update, delete guides
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const {
  listGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide
} = require('./guides.controller');

// Public routes (no auth required)
router.get('/', listGuides);
router.get('/:id', getGuideById);

// Admin routes
router.post('/', authenticateToken, requireRole('ADMIN'), createGuide);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateGuide);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteGuide);

module.exports = router;
