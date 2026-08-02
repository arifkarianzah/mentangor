const db = require('../config/db');

/**
 * Generate nomor laporan otomatis
 * Format: RPT-YYYYMMDD-XXXX
 * Contoh: RPT-20260728-0015
 */
const generateReportNumber = async () => {
  const today = new Date();
  const year  = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day   = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Hitung laporan hari ini untuk urutan
  const [rows] = await db.query(
    'SELECT COUNT(*) AS total FROM reports WHERE DATE(created_at) = CURDATE()'
  );

  const seq = String(rows[0].total + 1).padStart(4, '0');
  return `RPT-${dateStr}-${seq}`;
};

module.exports = { generateReportNumber };
