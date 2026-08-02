const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../config/jwt');
const { success, error, unauthorized } = require('../utils/response');

/**
 * POST /api/auth/login
 * Login untuk admin dan petugas
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user by email
    const [users] = await db.query(
      'SELECT id, name, email, password, role, avatar, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return unauthorized(res, 'Email atau password salah');
    }

    const user = users[0];

    if (!user.is_active) {
      return unauthorized(res, 'Akun Anda dinonaktifkan. Hubungi administrator.');
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return unauthorized(res, 'Email atau password salah');
    }

    // Generate token
    const token = generateToken({
      id:   user.id,
      name: user.name,
      role: user.role,
    });

    return success(res, {
      token,
      user: {
        id:     user.id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
        avatar: user.avatar,
      },
    }, 'Login berhasil');

  } catch (err) {
    console.error('login error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * GET /api/auth/me
 * Get profil user yang sedang login
 */
const me = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, phone, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return error(res, 'User tidak ditemukan', 404);
    }

    return success(res, users[0]);
  } catch (err) {
    console.error('me error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * POST /api/auth/logout
 * Logout (client hapus token)
 */
const logout = (req, res) => {
  return success(res, null, 'Logout berhasil');
};

/**
 * POST /api/auth/register
 * Registrasi petugas baru
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'petugas', phone } = req.body;

    // Cek apakah email sudah ada
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return error(res, 'Email sudah terdaftar', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, phone]
    );

    return success(res, { id: result.insertId }, 'Registrasi berhasil', 201);
  } catch (err) {
    console.error('register error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

module.exports = { login, me, logout, register };
