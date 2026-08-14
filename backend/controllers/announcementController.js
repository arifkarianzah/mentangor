const db = require('../config/db');
const { success, paginated, error, notFound } = require('../utils/response');
const { ANNOUNCEMENT_TYPE, PAGINATION } = require('../config/constants');

/**
 * GET /api/announcements
 * Daftar pengumuman aktif (pinned dulu, lalu terbaru)
 */
const getPublicAnnouncements = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || PAGINATION.DEFAULT_PAGE;
    const limit  = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;
    const type   = req.query.type || null;

    let where  = ['is_active = true', 'published_at <= NOW()'];
    let params = [];

    if (type && Object.values(ANNOUNCEMENT_TYPE).includes(type)) {
      where.push('type = ?');
      params.push(type);
    }

    const whereStr = where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM announcements WHERE ${whereStr}`, params
    );

    const [announcements] = await db.query(
      `SELECT id, title, content, type, image, is_pinned, published_at, created_at
       FROM announcements
       WHERE ${whereStr}
       ORDER BY is_pinned DESC, published_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginated(res, announcements, {
      page, limit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit),
    });
  } catch (err) {
    console.error('getPublicAnnouncements error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/announcements/:id
 */
const getAnnouncementById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM announcements WHERE id = ? AND is_active = true',
      [req.params.id]
    );
    if (rows.length === 0) return notFound(res, 'Pengumuman tidak ditemukan');
    return success(res, rows[0]);
  } catch (err) {
    console.error('getAnnouncementById error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/admin/announcements
 * Semua pengumuman termasuk nonaktif
 */
const getAdminAnnouncements = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || PAGINATION.DEFAULT_PAGE;
    const limit  = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;

    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM announcements');
    const [rows] = await db.query(
      `SELECT a.*, u.name AS created_by_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       ORDER BY a.is_pinned DESC, a.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return paginated(res, rows, {
      page, limit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit),
    });
  } catch (err) {
    console.error('getAdminAnnouncements error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * POST /api/admin/announcements
 */
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type, is_pinned, published_at } = req.body;
    const image = req.file ? `announcements/${req.file.filename}` : null;
    const pinnedVal = (is_pinned === true || is_pinned === 'true' || is_pinned === '1' || is_pinned === 1) ? true : false;

    const [result] = await db.query(
      `INSERT INTO announcements (title, content, type, image, is_pinned, is_active, created_by, published_at)
       VALUES (?, ?, ?, ?, ?, true, ?, ?)`,
      [title, content, type || 'umum', image, pinnedVal,
       req.user.id, published_at || new Date()]
    );

    return success(res, { id: result.insertId }, 'Pengumuman berhasil dibuat', 201);
  } catch (err) {
    console.error('createAnnouncement error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * PUT /api/admin/announcements/:id
 */
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, is_pinned, published_at } = req.body;

    const [rows] = await db.query('SELECT id FROM announcements WHERE id = ?', [id]);
    if (rows.length === 0) return notFound(res, 'Pengumuman tidak ditemukan');

    const image = req.file ? `announcements/${req.file.filename}` : null;
    const pinnedVal = (is_pinned === true || is_pinned === 'true' || is_pinned === '1' || is_pinned === 1) ? true : false;

    await db.query(
      `UPDATE announcements SET
        title = ?, content = ?, type = ?, is_pinned = ?,
        published_at = ?,
        image = COALESCE(?, image)
       WHERE id = ?`,
      [title, content, type || 'umum', pinnedVal,
       published_at || new Date(), image, id]
    );

    return success(res, null, 'Pengumuman berhasil diperbarui');
  } catch (err) {
    console.error('updateAnnouncement error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * PATCH /api/admin/announcements/:id/pin
 * Toggle is_pinned
 */
const togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE announcements SET is_pinned = NOT is_pinned WHERE id = ?', [id]
    );
    return success(res, null, 'Status pin diperbarui');
  } catch (err) {
    console.error('togglePin error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * PATCH /api/admin/announcements/:id/toggle
 * Toggle is_active
 */
const toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE announcements SET is_active = NOT is_active WHERE id = ?', [id]
    );
    return success(res, null, 'Status pengumuman diperbarui');
  } catch (err) {
    console.error('toggleActive error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * DELETE /api/admin/announcements/:id
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id FROM announcements WHERE id = ?', [id]);
    if (rows.length === 0) return notFound(res, 'Pengumuman tidak ditemukan');
    await db.query('DELETE FROM announcements WHERE id = ?', [id]);
    return success(res, null, 'Pengumuman berhasil dihapus');
  } catch (err) {
    console.error('deleteAnnouncement error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

module.exports = {
  getPublicAnnouncements,
  getAnnouncementById,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  togglePin,
  toggleActive,
  deleteAnnouncement,
};
