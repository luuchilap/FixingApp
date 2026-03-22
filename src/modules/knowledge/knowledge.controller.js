/**
 * Knowledge controller
 * Handles knowledge articles CRUD operations
 */

const db = require('../../config/db');

/**
 * List published knowledge articles
 * GET /api/knowledge
 * Query params: category, page, limit
 */
async function listArticles(req, res) {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE is_published = TRUE';
    const params = [];

    if (category) {
      params.push(category);
      whereClause += ` AND category = $${params.length}`;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM knowledge_articles ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get articles
    const dataParams = [...params, parseInt(limit), offset];
    const result = await db.query(
      `SELECT id, title, summary, category, thumbnail_url, author_name, view_count, created_at, updated_at
       FROM knowledge_articles
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      data: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        category: row.category,
        thumbnailUrl: row.thumbnail_url,
        authorName: row.author_name,
        viewCount: row.view_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasMore: parseInt(page) < totalPages
      }
    });
  } catch (error) {
    console.error('Error listing knowledge articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get article by ID (full content)
 * GET /api/knowledge/:id
 */
async function getArticleById(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM knowledge_articles WHERE id = $1 AND is_published = TRUE`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment view count
    await db.query(
      'UPDATE knowledge_articles SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      thumbnailUrl: row.thumbnail_url,
      authorName: row.author_name,
      viewCount: row.view_count + 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error getting knowledge article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create a new article (Admin only)
 * POST /api/knowledge
 */
async function createArticle(req, res) {
  try {
    const { title, summary, content, category, thumbnailUrl, authorName } = req.body;

    if (!title || !summary || !content || !category) {
      return res.status(400).json({ error: 'Title, summary, content and category are required' });
    }

    const now = Date.now();
    const result = await db.query(
      `INSERT INTO knowledge_articles (title, summary, content, category, thumbnail_url, author_name, is_published, view_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 0, $7, $8)
       RETURNING *`,
      [title, summary, content, category, thumbnailUrl || null, authorName || 'Admin', now, now]
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
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error creating knowledge article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update an article (Admin only)
 * PUT /api/knowledge/:id
 */
async function updateArticle(req, res) {
  try {
    const { id } = req.params;
    const { title, summary, content, category, thumbnailUrl, authorName, isPublished } = req.body;

    const existing = await db.query('SELECT * FROM knowledge_articles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const now = Date.now();
    const result = await db.query(
      `UPDATE knowledge_articles
       SET title = COALESCE($1, title),
           summary = COALESCE($2, summary),
           content = COALESCE($3, content),
           category = COALESCE($4, category),
           thumbnail_url = COALESCE($5, thumbnail_url),
           author_name = COALESCE($6, author_name),
           is_published = COALESCE($7, is_published),
           updated_at = $8
       WHERE id = $9
       RETURNING *`,
      [title, summary, content, category, thumbnailUrl, authorName, isPublished, now, id]
    );

    const row = result.rows[0];
    res.json({
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
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error updating knowledge article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete an article (Admin only)
 * DELETE /api/knowledge/:id
 */
async function deleteArticle(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM knowledge_articles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  listArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
};
