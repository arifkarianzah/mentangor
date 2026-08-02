const db = require('../config/db');
const { success, error } = require('../utils/response');
const { REPORT_STATUS, PERLU_DITINDAK } = require('../config/constants');

/**
 * GET /api/admin/dashboard/stats
 * Semua statistik untuk dashboard
 */
const getStats = async (req, res) => {
  try {
    // Hitung per status
    const [statusCounts] = await db.query(
      `SELECT status, COUNT(*) AS total FROM reports GROUP BY status`
    );

    const stats = {
      total: 0, selesai: 0, menunggu: 0,
      diverifikasi: 0, diproses: 0, ditolak: 0,
      perlu_ditindak: 0, bulan_ini: 0,
    };

    statusCounts.forEach(row => {
      stats[row.status] = row.total;
      stats.total += row.total;
    });

    stats.perlu_ditindak = (stats.menunggu || 0) + (stats.diverifikasi || 0);

    // Laporan bulan ini
    const [bulanIni] = await db.query(
      `SELECT COUNT(*) AS total FROM reports
       WHERE MONTH(created_at) = MONTH(NOW())
         AND YEAR(created_at) = YEAR(NOW())`
    );
    stats.bulan_ini = bulanIni[0].total;

    return success(res, stats);
  } catch (err) {
    console.error('getStats error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/admin/dashboard/hotspots
 * Titik lokasi paling sering dilaporkan
 */
const getHotspots = async (req, res) => {
  try {
    const [hotspots] = await db.query(
      `SELECT address, COUNT(*) AS total
       FROM reports
       WHERE status != ?
       GROUP BY address
       ORDER BY total DESC
       LIMIT 5`,
      [REPORT_STATUS.DITOLAK]
    );

    return success(res, hotspots);
  } catch (err) {
    console.error('getHotspots error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/admin/dashboard/recent
 * 5 laporan terbaru
 */
const getRecentReports = async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT id, report_number, reporter_name, address, status, created_at
       FROM reports
       ORDER BY created_at DESC
       LIMIT 5`
    );

    return success(res, reports);
  } catch (err) {
    console.error('getRecentReports error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

module.exports = { getStats, getHotspots, getRecentReports };
