const { verifyToken } = require('../config/jwt');
const { unauthorized } = require('../utils/response');

/**
 * Middleware: Verifikasi JWT token dari header Authorization
 * Header format: "Authorization: Bearer <token>"
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Token autentikasi tidak ditemukan');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return unauthorized(res, 'Token tidak valid atau sudah kedaluwarsa');
  }

  req.user = decoded; // { id, name, role, iat, exp }
  next();
};

module.exports = authMiddleware;
