const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const UPLOAD_PATH = process.env.UPLOAD_PATH 
  ? path.resolve(process.env.UPLOAD_PATH) 
  : path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB

// Pastikan folder upload ada
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage untuk foto laporan (before)
const reportBeforeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_PATH, 'reports', 'before');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `before-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// Storage untuk foto laporan (after)
const reportAfterStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_PATH, 'reports', 'after');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `after-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// Storage untuk avatar profile
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_PATH, 'profile');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `avatar-${req.user.id}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// Storage untuk foto pengumuman
const announcementStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_PATH, 'announcements');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `announcement-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// File filter - hanya jpg dan png
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'), false);
  }
};

module.exports = {
  uploadReportBefore: multer({
    storage: reportBeforeStorage,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  }),

  uploadReportAfter: multer({
    storage: reportAfterStorage,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  }),

  uploadAvatar: multer({
    storage: profileStorage,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  }),

  uploadAnnouncement: multer({
    storage: announcementStorage,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  }),
};
