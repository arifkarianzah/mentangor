const { uploadReportBefore, uploadReportAfter, uploadAvatar } = require('../config/multer');
const { error } = require('../utils/response');

/**
 * Wrapper multer untuk handle error upload
 */
const handleUpload = (multerMiddleware, fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const upload = maxCount > 1
      ? multerMiddleware.array(fieldName, maxCount)
      : multerMiddleware.single(fieldName);

    upload(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, 'Ukuran file terlalu besar. Maksimal 5MB.', 400);
        }
        return error(res, err.message || 'Gagal upload file', 400);
      }
      next();
    });
  };
};

// Upload foto before dari warga (maks 5 foto)
const uploadBefore = handleUpload(uploadReportBefore, 'images', 5);

// Upload foto after dari admin/petugas (maks 5 foto)
const uploadAfter = handleUpload(uploadReportAfter, 'images', 5);

// Upload avatar profil (1 foto)
const uploadProfileAvatar = handleUpload(uploadAvatar, 'avatar', 1);

module.exports = { uploadBefore, uploadAfter, uploadProfileAvatar };
