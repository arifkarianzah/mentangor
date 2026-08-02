const db = require('../config/db');
const { generateReportNumber } = require('../utils/generateReportNumber');
const { success, paginated, error, notFound } = require('../utils/response');
const { REPORT_STATUS, STATUS_TRANSITIONS, PAGINATION, DUPLICATE_CHECK_DAYS } = require('../config/constants');
const path = require('path');

// ============================================================
// PUBLIC ENDPOINTS (tanpa login)
// ============================================================

/**
 * GET /api/reports
 * Daftar laporan publik dengan filter dan paginasi
 */
const getPublicReports = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)   || PAGINATION.DEFAULT_PAGE;
    const limit  = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    const search = req.query.search || null;

    let where = ['r.status != ?'];
    let params = [REPORT_STATUS.DITOLAK]; // Laporan ditolak tidak tampil publik

    if (status && Object.values(REPORT_STATUS).includes(status)) {
      where.push('r.status = ?');
      params.push(status);
    }

    if (search) {
      where.push('(r.address LIKE ? OR r.title LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereStr = where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM reports r WHERE ${whereStr}`,
      params
    );
    const total = countRows[0].total;

    const [reports] = await db.query(
      `SELECT
        r.id, r.report_number, r.title, r.address, r.status,
        r.created_at,
        (SELECT image_path FROM report_images
         WHERE report_id = r.id AND type = 'before' LIMIT 1) AS before_image,
        (SELECT image_path FROM report_images
         WHERE report_id = r.id AND type = 'after' LIMIT 1) AS after_image
       FROM reports r
       WHERE ${whereStr}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginated(res, reports, {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('getPublicReports error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/reports/:id
 * Detail laporan publik
 */
const getPublicReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await db.query(
      `SELECT r.id, r.report_number, r.reporter_name, r.title,
              r.description, r.address, r.lat, r.lng, r.status,
              r.notes, r.created_at, r.updated_at
       FROM reports r WHERE r.id = ? AND r.status != ?`,
      [id, REPORT_STATUS.DITOLAK]
    );

    if (reports.length === 0) return notFound(res, 'Laporan tidak ditemukan');

    const [images] = await db.query(
      'SELECT id, image_path, type, uploaded_at FROM report_images WHERE report_id = ? ORDER BY type, uploaded_at',
      [id]
    );

    return success(res, { ...reports[0], images });
  } catch (err) {
    console.error('getPublicReportById error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/reports/number/:number
 * Cari laporan berdasarkan nomor (RPT-...)
 */
const getReportByNumber = async (req, res) => {
  try {
    const { number } = req.params;

    const [reports] = await db.query(
      `SELECT id, report_number, title, address, status, notes, created_at, updated_at
       FROM reports WHERE report_number = ?`,
      [number]
    );

    if (reports.length === 0) return notFound(res, 'Nomor laporan tidak ditemukan');

    const [images] = await db.query(
      'SELECT image_path, type FROM report_images WHERE report_id = ?',
      [reports[0].id]
    );

    return success(res, { ...reports[0], images });
  } catch (err) {
    console.error('getReportByNumber error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/reports/check-duplicate?address=Jl.Melati
 * Cek apakah ada laporan serupa dalam N hari terakhir
 */
const checkDuplicate = async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return success(res, { has_similar: false, similar_reports: [] });

    const [similar] = await db.query(
      `SELECT report_number, address, status, created_at
       FROM reports
       WHERE address LIKE ?
         AND status NOT IN (?, ?)
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       LIMIT 3`,
      [`%${address}%`, REPORT_STATUS.DITOLAK, REPORT_STATUS.SELESAI, DUPLICATE_CHECK_DAYS]
    );

    return success(res, {
      has_similar: similar.length > 0,
      similar_reports: similar,
    });
  } catch (err) {
    console.error('checkDuplicate error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * POST /api/reports
 * Submit laporan baru (tanpa login), termasuk upload foto before
 */
const createReport = async (req, res) => {
  try {
    const { reporter_name, reporter_phone, title, description, address, lat, lng } = req.body;

    const report_number = await generateReportNumber();

    const [result] = await db.query(
      `INSERT INTO reports
        (report_number, reporter_name, reporter_phone, title, description, address, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [report_number, reporter_name || null, reporter_phone || null,
       title, description || null, address, lat || null, lng || null]
    );

    const reportId = result.insertId;

    // Simpan foto before yang diupload
    if (req.files && req.files.length > 0) {
      const imageValues = req.files.map(file => [
        reportId,
        `reports/before/${file.filename}`,
        'before',
        null, // uploaded_by null (warga)
      ]);

      await db.query(
        'INSERT INTO report_images (report_id, image_path, type, uploaded_by) VALUES ?',
        [imageValues]
      );
    }

    return success(res, { id: reportId, report_number }, 'Laporan berhasil dikirim', 201);
  } catch (err) {
    console.error('createReport error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

// ============================================================
// ADMIN ENDPOINTS (butuh login)
// ============================================================

/**
 * GET /api/admin/reports
 * Daftar laporan untuk admin - dengan filter lengkap
 */
const getAdminReports = async (req, res) => {
  try {
    const page      = parseInt(req.query.page)  || PAGINATION.DEFAULT_PAGE;
    const limit     = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset    = (page - 1) * limit;
    const status    = req.query.status   || null;
    const search    = req.query.search   || null;
    const dateFrom  = req.query.date_from || null;
    const dateTo    = req.query.date_to   || null;

    let where  = ['1=1'];
    let params = [];

    if (status && Object.values(REPORT_STATUS).includes(status)) {
      where.push('r.status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(r.address LIKE ? OR r.title LIKE ? OR r.report_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (dateFrom) { where.push('DATE(r.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo)   { where.push('DATE(r.created_at) <= ?'); params.push(dateTo); }

    const whereStr = where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM reports r WHERE ${whereStr}`, params
    );
    const total = countRows[0].total;

    const [reports] = await db.query(
      `SELECT r.id, r.report_number, r.reporter_name, r.reporter_phone,
              r.title, r.address, r.status, r.created_at, r.updated_at,
              u.name AS verified_by_name,
              (SELECT image_path FROM report_images
               WHERE report_id = r.id AND type = 'before' LIMIT 1) AS before_image
       FROM reports r
       LEFT JOIN users u ON r.verified_by = u.id
       WHERE ${whereStr}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginated(res, reports, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getAdminReports error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/admin/reports/:id
 * Detail laporan untuk admin
 */
const getAdminReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await db.query(
      `SELECT r.*, u.name AS verified_by_name
       FROM reports r
       LEFT JOIN users u ON r.verified_by = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (reports.length === 0) return notFound(res, 'Laporan tidak ditemukan');

    const [images] = await db.query(
      `SELECT ri.*, u.name AS uploader_name
       FROM report_images ri
       LEFT JOIN users u ON ri.uploaded_by = u.id
       WHERE ri.report_id = ?
       ORDER BY ri.type, ri.uploaded_at`,
      [id]
    );

    return success(res, { ...reports[0], images });
  } catch (err) {
    console.error('getAdminReportById error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * PATCH /api/admin/reports/:id/status
 * Update status laporan
 */
const updateReportStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status, notes } = req.body;

    const [reports] = await db.query(
      'SELECT id, status FROM reports WHERE id = ?', [id]
    );
    if (reports.length === 0) return notFound(res, 'Laporan tidak ditemukan');

    const currentStatus = reports[0].status;
    const allowed = STATUS_TRANSITIONS[currentStatus];

    if (!allowed.includes(status)) {
      return error(res,
        `Tidak bisa ubah status dari "${currentStatus}" ke "${status}"`, 400
      );
    }

    // Jika diverifikasi, catat siapa yang memverifikasi
    const verifiedBy = (status === REPORT_STATUS.DIVERIFIKASI) ? req.user.id : undefined;
    const verifiedAt = (status === REPORT_STATUS.DIVERIFIKASI) ? new Date() : undefined;

    await db.query(
      `UPDATE reports SET
        status = ?,
        notes = COALESCE(?, notes),
        verified_by = COALESCE(?, verified_by),
        verified_at = COALESCE(?, verified_at)
       WHERE id = ?`,
      [status, notes || null, verifiedBy || null, verifiedAt || null, id]
    );

    return success(res, null, 'Status laporan berhasil diperbarui');
  } catch (err) {
    console.error('updateReportStatus error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * POST /api/admin/reports/:id/images
 * Upload foto after oleh admin/petugas
 */
const uploadAfterImages = async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await db.query('SELECT id FROM reports WHERE id = ?', [id]);
    if (reports.length === 0) return notFound(res, 'Laporan tidak ditemukan');

    if (!req.files || req.files.length === 0) {
      return error(res, 'Tidak ada file yang diupload', 400);
    }

    const imageValues = req.files.map(file => [
      id,
      `reports/after/${file.filename}`,
      'after',
      req.user.id,
    ]);

    await db.query(
      'INSERT INTO report_images (report_id, image_path, type, uploaded_by) VALUES ?',
      [imageValues]
    );

    return success(res, null, 'Foto sesudah berhasil diupload', 201);
  } catch (err) {
    console.error('uploadAfterImages error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * DELETE /api/admin/reports/:id
 * Hapus laporan (admin only)
 */
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await db.query('SELECT id FROM reports WHERE id = ?', [id]);
    if (reports.length === 0) return notFound(res, 'Laporan tidak ditemukan');

    // Gambar akan terhapus otomatis karena ON DELETE CASCADE
    await db.query('DELETE FROM reports WHERE id = ?', [id]);

    return success(res, null, 'Laporan berhasil dihapus');
  } catch (err) {
    console.error('deleteReport error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

module.exports = {
  getPublicReports,
  getPublicReportById,
  getReportByNumber,
  checkDuplicate,
  createReport,
  getAdminReports,
  getAdminReportById,
  updateReportStatus,
  uploadAfterImages,
  deleteReport,
};
