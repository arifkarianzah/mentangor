const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { success, paginated, error, notFound } = require('../utils/response');
const { PAGINATION } = require('../config/constants');

/**
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || PAGINATION.DEFAULT_PAGE;
    const limit  = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offset = (page - 1) * limit;

    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [users] = await db.query(
      'SELECT id, name, email, role, phone, avatar, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return paginated(res, users, {
      page, limit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / limit),
    });
  } catch (err) {
    console.error('getUsers error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * POST /api/admin/users
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return error(res, 'Email sudah terdaftar', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'petugas', phone || null]
    );

    return success(res, { id: result.insertId }, 'Pengguna berhasil ditambahkan', 201);
  } catch (err) {
    console.error('createUser error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone } = req.body;

    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) return notFound(res, 'Pengguna tidak ditemukan');

    await db.query(
      'UPDATE users SET name = ?, email = ?, role = ?, phone = ? WHERE id = ?',
      [name, email, role, phone || null, id]
    );

    return success(res, null, 'Pengguna berhasil diperbarui');
  } catch (err) {
    console.error('updateUser error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * PATCH /api/admin/users/:id/toggle
 * Aktifkan/nonaktifkan user
 */
const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return error(res, 'Tidak bisa menonaktifkan akun sendiri', 400);
    }

    await db.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
    return success(res, null, 'Status pengguna diperbarui');
  } catch (err) {
    console.error('toggleUserActive error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return error(res, 'Tidak bisa menghapus akun sendiri', 400);
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    return success(res, null, 'Pengguna berhasil dihapus');
  } catch (err) {
    console.error('deleteUser error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * PUT /api/admin/profile
 * Edit profil diri sendiri
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await db.query(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name, phone || null, req.user.id]
    );
    return success(res, null, 'Profil berhasil diperbarui');
  } catch (err) {
    console.error('updateProfile error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * PUT /api/admin/profile/password
 * Ganti password sendiri
 */
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?', [req.user.id]
    );

    const isMatch = await bcrypt.compare(current_password, users[0].password);
    if (!isMatch) {
      return error(res, 'Password lama tidak sesuai', 400);
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    return success(res, null, 'Password berhasil diubah');
  } catch (err) {
    console.error('changePassword error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

/**
 * POST /api/admin/profile/avatar
 * Upload avatar
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Tidak ada file yang diupload', 400);

    const avatarPath = `profile/${req.file.filename}`;
    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.user.id]);

    return success(res, { avatar: avatarPath }, 'Avatar berhasil diperbarui');
  } catch (err) {
    console.error('uploadAvatar error:', err);
    return error(res, 'Terjadi kesalahan server');
  }
};

module.exports = {
  getUsers, createUser, updateUser, toggleUserActive, deleteUser,
  updateProfile, changePassword, uploadAvatar,
};
