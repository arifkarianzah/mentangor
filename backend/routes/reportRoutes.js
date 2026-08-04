const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadBefore, uploadAfter } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validation');

// ── PUBLIC ROUTES ──────────────────────────────────────────
router.get('/', ctrl.getPublicReports);
router.get('/check-duplicate', ctrl.checkDuplicate);
router.get('/number/:number', ctrl.getReportByNumber);
router.get('/public/:id', ctrl.getPublicReportById);

router.post('/',
  uploadBefore,
  [
    body('title').notEmpty().withMessage('Judul laporan wajib diisi'),
    body('address').notEmpty().withMessage('Alamat wajib diisi'),
  ],
  validate,
  ctrl.createReport
);

// ── ADMIN & PETUGAS ROUTES ──────────────────────────────────
router.get('/admin/list',
  authMiddleware,
  ctrl.getAdminReports
);

router.get('/admin/:id',
  authMiddleware,
  ctrl.getAdminReportById
);

router.patch('/admin/:id/status',
  authMiddleware,
  [
    body('status').notEmpty().withMessage('Status wajib diisi'),
  ],
  validate,
  ctrl.updateReportStatus
);

router.post('/admin/:id/images',
  authMiddleware,
  uploadAfter,
  ctrl.uploadAfterImages
);

router.delete('/admin/:id',
  authMiddleware,
  roleMiddleware('admin'),
  ctrl.deleteReport
);

// ── COMPATIBILITY ALIASES (Direct /reports/:id routes) ───────
router.get('/:id', (req, res, next) => {
  // If user has token, forward to getAdminReportById, else getPublicReportById
  const token = req.headers.authorization;
  if (token && token.startsWith('Bearer ')) {
    return ctrl.getAdminReportById(req, res, next);
  }
  return ctrl.getPublicReportById(req, res, next);
});

router.patch('/:id/status',
  authMiddleware,
  [
    body('status').notEmpty().withMessage('Status wajib diisi'),
  ],
  validate,
  ctrl.updateReportStatus
);

router.post('/:id/images',
  authMiddleware,
  uploadAfter,
  ctrl.uploadAfterImages
);

router.delete('/:id',
  authMiddleware,
  roleMiddleware('admin'),
  ctrl.deleteReport
);

module.exports = router;
