const { forbidden } = require('../utils/response');

/**
 * Middleware: Cek role pengguna
 * @param {...string} roles - Role yang diizinkan
 * 
 * Penggunaan:
 * router.delete('/users/:id', authMiddleware, roleMiddleware('admin'), handler)
 * router.patch('/status', authMiddleware, roleMiddleware('admin', 'petugas'), handler)
 */
const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Akses ditolak');
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Akses ditolak. Hanya ${roles.join(' atau ')} yang diizinkan`);
    }

    next();
  };
};

module.exports = roleMiddleware;
