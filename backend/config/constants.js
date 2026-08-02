/**
 * Konstanta global untuk Portal Desa
 * Gunakan konstanta ini di seluruh aplikasi —
 * jangan tulis string status secara langsung di controller.
 */

// Status laporan
const REPORT_STATUS = {
  MENUNGGU:    'menunggu',
  DIVERIFIKASI:'diverifikasi',
  DIPROSES:    'diproses',
  SELESAI:     'selesai',
  DITOLAK:     'ditolak',
};

// Status yang butuh tindakan (untuk card "Perlu Ditindak")
const PERLU_DITINDAK = [REPORT_STATUS.MENUNGGU, REPORT_STATUS.DIVERIFIKASI];

// Alur status yang valid (fleksibel untuk admin)
const STATUS_TRANSITIONS = {
  [REPORT_STATUS.MENUNGGU]:     [REPORT_STATUS.DIVERIFIKASI, REPORT_STATUS.DIPROSES, REPORT_STATUS.SELESAI, REPORT_STATUS.DITOLAK],
  [REPORT_STATUS.DIVERIFIKASI]: [REPORT_STATUS.MENUNGGU, REPORT_STATUS.DIPROSES, REPORT_STATUS.SELESAI, REPORT_STATUS.DITOLAK],
  [REPORT_STATUS.DIPROSES]:     [REPORT_STATUS.MENUNGGU, REPORT_STATUS.DIVERIFIKASI, REPORT_STATUS.SELESAI, REPORT_STATUS.DITOLAK],
  [REPORT_STATUS.SELESAI]:      [REPORT_STATUS.MENUNGGU, REPORT_STATUS.DIVERIFIKASI, REPORT_STATUS.DIPROSES, REPORT_STATUS.DITOLAK],
  [REPORT_STATUS.DITOLAK]:      [REPORT_STATUS.MENUNGGU, REPORT_STATUS.DIVERIFIKASI, REPORT_STATUS.DIPROSES, REPORT_STATUS.SELESAI],
};

// Tipe foto laporan
const IMAGE_TYPE = {
  BEFORE: 'before',
  AFTER:  'after',
};

// Role pengguna
const USER_ROLE = {
  ADMIN:   'admin',
  PETUGAS: 'petugas',
};

// Tipe pengumuman
const ANNOUNCEMENT_TYPE = {
  UMUM:          'umum',
  KEGIATAN:      'kegiatan',
  GOTONG_ROYONG: 'gotong_royong',
  POSYANDU:      'posyandu',
};

// Paginasi default
const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT:     100,
};

// Deteksi duplikat
const DUPLICATE_CHECK_DAYS = 7; // Cek laporan serupa dalam N hari terakhir

module.exports = {
  REPORT_STATUS,
  PERLU_DITINDAK,
  STATUS_TRANSITIONS,
  IMAGE_TYPE,
  USER_ROLE,
  ANNOUNCEMENT_TYPE,
  PAGINATION,
  DUPLICATE_CHECK_DAYS,
};
