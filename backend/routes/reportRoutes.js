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
router.get('/:id', ctrl.getPublicReportById);

router.post('/',
  uploadBefore,
  [
    body('title').notEmpty().withMessage('Judul laporan wajib diisi'),
    body('address').notEmpty().withMessage('Alamat wajib diisi'),
  ],
  validate,
  ctrl.createReport
);

// ── ADMIN ROUTES ───────────────────────────────────────────
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

module.exports = router;
