const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { uploadProfileAvatar } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validation');

// ── Admin: kelola pengguna ──────────────────────────────────
router.get('/',       authMiddleware, roleMiddleware('admin'), ctrl.getUsers);

router.post('/',
  authMiddleware,
  roleMiddleware('admin'),
  [
    body('name').notEmpty().withMessage('Nama wajib diisi'),
    body('email').isEmail().withMessage('Format email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('role').isIn(['admin', 'petugas']).withMessage('Role tidak valid'),
  ],
  validate,
  ctrl.createUser
);

router.put('/:id',       authMiddleware, roleMiddleware('admin'), ctrl.updateUser);
router.patch('/:id/toggle', authMiddleware, roleMiddleware('admin'), ctrl.toggleUserActive);
router.delete('/:id',   authMiddleware, roleMiddleware('admin'), ctrl.deleteUser);

// ── Profil diri sendiri ─────────────────────────────────────
router.put('/profile/me',       authMiddleware, ctrl.updateProfile);
router.put('/profile/password', authMiddleware, ctrl.changePassword);
router.post('/profile/avatar',  authMiddleware, uploadProfileAvatar, ctrl.uploadAvatar);

module.exports = router;
