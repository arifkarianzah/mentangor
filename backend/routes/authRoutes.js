const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, me, logout, register } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');

router.post('/register',
  [
    body('name').notEmpty().withMessage('Nama wajib diisi'),
    body('email').isEmail().withMessage('Format email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  ],
  validate,
  register
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Format email tidak valid'),
    body('password').notEmpty().withMessage('Password wajib diisi'),
  ],
  validate,
  login
);

router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

module.exports = router;
