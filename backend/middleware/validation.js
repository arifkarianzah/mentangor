const { validationResult } = require('express-validator');
const { validationError } = require('../utils/response');

/**
 * Middleware untuk menjalankan validasi express-validator
 * Gunakan setelah mendefinisikan validasi rules di route
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return validationError(res, errors.array().map(e => ({
      field: e.path,
      message: e.msg,
    })));
  }
  next();
};

module.exports = { validate };
