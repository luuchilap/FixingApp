/**
 * App Guides controller
 * Handles app usage guides CRUD operations
 */

const db = require('../../config/db');

/**
 * List published app guides
 * GET /api/guides
 * Query params: category, page, limit
 */
async function listGuides(req, res) {
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
      `SELECT COUNT(*) as total FROM app_guides ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get guides
    const dataParams = [...params, parseInt(limit), offset];
    const result = await db.query(
      `SELECT id, title, summary, category, icon_name, sort_order, view_count, created_at, updated_at
       FROM app_guides
       ${whereClause}
       ORDER BY sort_order ASC, created_at DESC
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
        iconName: row.icon_name,
        sortOrder: row.sort_order,
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
    console.error('Error listing app guides:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get guide by ID (full content)
 * GET /api/guides/:id
 */
async function getGuideById(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM app_guides WHERE id = $1 AND is_published = TRUE`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    // Increment view count
    await db.query(
      'UPDATE app_guides SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      iconName: row.icon_name,
      sortOrder: row.sort_order,
      viewCount: row.view_count + 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error getting app guide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create a new guide (Admin only)
 * POST /api/guides
 */
async function createGuide(req, res) {
  try {
    const { title, summary, content, category, iconName, sortOrder } = req.body;

    if (!title || !summary || !content || !category) {
      return res.status(400).json({ error: 'Title, summary, content and category are required' });
    }

    const now = Date.now();
    const result = await db.query(
      `INSERT INTO app_guides (title, summary, content, category, icon_name, sort_order, is_published, view_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 0, $7, $8)
       RETURNING *`,
      [title, summary, content, category, iconName || null, sortOrder || 0, now, now]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      iconName: row.icon_name,
      sortOrder: row.sort_order,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error creating app guide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update a guide (Admin only)
 * PUT /api/guides/:id
 */
async function updateGuide(req, res) {
  try {
    const { id } = req.params;
    const { title, summary, content, category, iconName, sortOrder, isPublished } = req.body;

    const existing = await db.query('SELECT * FROM app_guides WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    const now = Date.now();
    const result = await db.query(
      `UPDATE app_guides
       SET title = COALESCE($1, title),
           summary = COALESCE($2, summary),
           content = COALESCE($3, content),
           category = COALESCE($4, category),
           icon_name = COALESCE($5, icon_name),
           sort_order = COALESCE($6, sort_order),
           is_published = COALESCE($7, is_published),
           updated_at = $8
       WHERE id = $9
       RETURNING *`,
      [title, summary, content, category, iconName, sortOrder, isPublished, now, id]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      category: row.category,
      iconName: row.icon_name,
      sortOrder: row.sort_order,
      isPublished: row.is_published,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error updating app guide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete a guide (Admin only)
 * DELETE /api/guides/:id
 */
async function deleteGuide(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM app_guides WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guide not found' });
    }

    res.json({ message: 'Guide deleted successfully' });
  } catch (error) {
    console.error('Error deleting app guide:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  listGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide
};
