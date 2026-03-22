/**
 * Knowledge routes
 * Public: list and get articles
 * Admin: create, update, delete articles
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../../middlewares/auth.middleware');
const {
  listArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} = require('./knowledge.controller');

// Public routes (no auth required)
router.get('/', listArticles);
router.get('/:id', getArticleById);

// Admin routes
router.post('/', authenticateToken, requireRole('ADMIN'), createArticle);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateArticle);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteArticle);

module.exports = router;
