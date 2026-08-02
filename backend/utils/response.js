/**
 * Format standar response JSON untuk semua endpoint
 */

/**
 * Response sukses
 */
const success = (res, data = null, message = 'Berhasil', statusCode = 200) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Response sukses dengan paginasi
 */
const paginated = (res, data, pagination, message = 'Berhasil') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * Response error
 */
const error = (res, message = 'Terjadi kesalahan', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Response 404 Not Found
 */
const notFound = (res, message = 'Data tidak ditemukan') => {
  return error(res, message, 404);
};

/**
 * Response 401 Unauthorized
 */
const unauthorized = (res, message = 'Tidak terautentikasi') => {
  return error(res, message, 401);
};

/**
 * Response 403 Forbidden
 */
const forbidden = (res, message = 'Tidak memiliki akses') => {
  return error(res, message, 403);
};

/**
 * Response 400 Bad Request (validasi)
 */
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Data tidak valid',
    errors,
  });
};

module.exports = { success, paginated, error, notFound, unauthorized, forbidden, validationError };
