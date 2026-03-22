/**
 * Admin Panel controller (public - no auth required)
 * Provides user management for admin web interface
 */

const db = require('../../config/db');

/**
 * Get all users with their roles
 */
async function getAllUsers(req, res, next) {
  try {
    const { search, role, locked, verification } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(u.phone ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`r.name = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (locked === 'true') {
      whereConditions.push('u.is_locked = TRUE');
    } else if (locked === 'false') {
      whereConditions.push('(u.is_locked = FALSE OR u.is_locked IS NULL)');
    }

    if (verification) {
      whereConditions.push(`u.verification_status = $${paramIndex}`);
      params.push(verification);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const query = `
      SELECT 
        u.id,
        u.phone,
        u.full_name,
        u.address,
        u.is_locked,
        u.id_image_url,
        u.verification_status,
        u.verified_at,
        u.created_at,
        u.updated_at,
        r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const result = await db.query(query, params);

    const users = result.rows.map(user => ({
      id: user.id,
      phone: user.phone,
      fullName: user.full_name,
      address: user.address,
      role: user.role,
      isLocked: user.is_locked === true,
      idImageUrl: user.id_image_url || null,
      verificationStatus: user.verification_status || 'NONE',
      verifiedAt: user.verified_at || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    res.status(200).json({ data: users, total: users.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle lock/unlock a user account
 */
async function toggleUserLock(req, res, next) {
  try {
    const { userId } = req.params;

    const userResult = await db.query('SELECT id, phone, full_name, is_locked FROM users WHERE id = $1', [parseInt(userId)]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const newLockStatus = !(user.is_locked === true);

    await db.query('UPDATE users SET is_locked = $1, updated_at = $2 WHERE id = $3', [newLockStatus, Date.now(), parseInt(userId)]);

    res.status(200).json({
      message: newLockStatus ? 'Tài khoản đã bị khoá' : 'Tài khoản đã được mở khoá',
      userId: user.id,
      isLocked: newLockStatus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify or reject a user's ID/certificate
 */
async function setVerificationStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    const userResult = await db.query('SELECT id, verification_status, id_image_url FROM users WHERE id = $1', [parseInt(userId)]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = Date.now();
    await db.query(
      'UPDATE users SET verification_status = $1, verified_at = $2, updated_at = $3 WHERE id = $4',
      [status, now, now, parseInt(userId)]
    );

    res.status(200).json({
      message: status === 'APPROVED' ? 'Đã xác thực người dùng' : 'Đã từ chối xác thực',
      userId: parseInt(userId),
      verificationStatus: status,
      verifiedAt: now,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== KNOWLEDGE ARTICLES ====================

/**
 * Get all knowledge articles for admin
 */
async function getKnowledgeArticles(req, res, next) {
  try {
    const { category, search } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const result = await db.query(
      `SELECT * FROM knowledge_articles ${whereClause} ORDER BY created_at DESC`,
      params
    );

    const articles = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      thumbnailUrl: row.thumbnail_url,
      authorName: row.author_name,
      isPublished: row.is_published,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.status(200).json({ data: articles, total: articles.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a knowledge article
 */
async function createKnowledgeArticle(req, res, next) {
  try {
    const { title, summary, content, category, authorName } = req.body;

    if (!title || !summary || !content || !category) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ tiêu đề, tóm tắt, nội dung và danh mục' });
    }

    const now = Date.now();
    const result = await db.query(
      `INSERT INTO knowledge_articles (title, summary, content, category, author_name, is_published, view_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, 0, $6, $7)
       RETURNING *`,
      [title, summary, content, category, authorName || 'Admin', now, now]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      thumbnailUrl: row.thumbnail_url,
      authorName: row.author_name,
      isPublished: row.is_published,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a knowledge article
 */
async function updateKnowledgeArticle(req, res, next) {
  try {
    const { id } = req.params;
    const { title, summary, content, category, authorName, isPublished } = req.body;

    const existing = await db.query('SELECT * FROM knowledge_articles WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Bài viết không tồn tại' });
    }

    const now = Date.now();
    const result = await db.query(
      `UPDATE knowledge_articles
       SET title = COALESCE($1, title),
           summary = COALESCE($2, summary),
           content = COALESCE($3, content),
           category = COALESCE($4, category),
           author_name = COALESCE($5, author_name),
           is_published = COALESCE($6, is_published),
           updated_at = $7
       WHERE id = $8
       RETURNING *`,
      [title, summary, content, category, authorName, isPublished, now, parseInt(id)]
    );

    const row = result.rows[0];
    res.status(200).json({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      thumbnailUrl: row.thumbnail_url,
      authorName: row.author_name,
      isPublished: row.is_published,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a knowledge article
 */
async function deleteKnowledgeArticle(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM knowledge_articles WHERE id = $1 RETURNING id', [parseInt(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bài viết không tồn tại' });
    }

    res.status(200).json({ message: 'Đã xóa bài viết thành công' });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle publish status of a knowledge article
 */
async function toggleKnowledgePublish(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT id, is_published FROM knowledge_articles WHERE id = $1', [parseInt(id)]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Bài viết không tồn tại' });
    }

    const newStatus = !existing.rows[0].is_published;
    const now = Date.now();
    await db.query('UPDATE knowledge_articles SET is_published = $1, updated_at = $2 WHERE id = $3', [newStatus, now, parseInt(id)]);

    res.status(200).json({
      id: parseInt(id),
      isPublished: newStatus,
      message: newStatus ? 'Đã xuất bản bài viết' : 'Đã ẩn bài viết',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  toggleUserLock,
  setVerificationStatus,
  getKnowledgeArticles,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
  toggleKnowledgePublish,
};
