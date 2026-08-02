/**
 * Global error handler middleware
 * Harus didaftarkan paling akhir di app.js
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Multer error
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }

  // MySQL error
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan database' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan server';
  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
