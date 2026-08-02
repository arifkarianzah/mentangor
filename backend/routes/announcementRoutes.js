const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/announcementController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validation');
const multer = require('../config/multer');

// Multer untuk gambar pengumuman
const uploadAnnouncementImage = multer.uploadAnnouncement;

// ── PUBLIC ROUTES ──────────────────────────────────────────
router.get('/', ctrl.getPublicAnnouncements);
router.get('/:id', ctrl.getAnnouncementById);

// ── ADMIN ROUTES ───────────────────────────────────────────
router.get('/admin/list', authMiddleware, ctrl.getAdminAnnouncements);

router.post('/admin',
  authMiddleware,
  roleMiddleware('admin'),
  uploadAnnouncementImage.single('image'),
  [
    body('title').notEmpty().withMessage('Judul wajib diisi'),
    body('content').notEmpty().withMessage('Isi pengumuman wajib diisi'),
  ],
  validate,
  ctrl.createAnnouncement
);

router.put('/admin/:id',
  authMiddleware,
  roleMiddleware('admin'),
  uploadAnnouncementImage.single('image'),
  [
    body('title').notEmpty().withMessage('Judul wajib diisi'),
    body('content').notEmpty().withMessage('Isi pengumuman wajib diisi'),
  ],
  validate,
  ctrl.updateAnnouncement
);

router.patch('/admin/:id/pin',  authMiddleware, roleMiddleware('admin'), ctrl.togglePin);
router.patch('/admin/:id/toggle', authMiddleware, roleMiddleware('admin'), ctrl.toggleActive);
router.delete('/admin/:id', authMiddleware, roleMiddleware('admin'), ctrl.deleteAnnouncement);

module.exports = router;
