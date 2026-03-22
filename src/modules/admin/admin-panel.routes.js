/**
 * Admin Panel routes (public - no auth required)
 * For admin web interface
 */

const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserLock,
  setVerificationStatus,
  getKnowledgeArticles,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
  toggleKnowledgePublish,
} = require('./admin-panel.controller');

// Public routes - no authentication required

// Users
router.get('/users', getAllUsers);
router.patch('/users/:userId/toggle-lock', toggleUserLock);
router.patch('/users/:userId/verification', setVerificationStatus);

// Knowledge articles
router.get('/knowledge', getKnowledgeArticles);
router.post('/knowledge', createKnowledgeArticle);
router.put('/knowledge/:id', updateKnowledgeArticle);
router.delete('/knowledge/:id', deleteKnowledgeArticle);
router.patch('/knowledge/:id/toggle-publish', toggleKnowledgePublish);

module.exports = router;
