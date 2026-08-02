-- =============================================
-- Portal Desa — Database Schema
-- Versi: 1.0 | MySQL 8.0+
-- =============================================

CREATE DATABASE IF NOT EXISTS portal_desa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE portal_desa;

-- =============================================
-- Tabel: users
-- Hanya admin & petugas yang punya akun
-- =============================================
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  role        ENUM('admin','petugas') NOT NULL DEFAULT 'petugas',
  phone       VARCHAR(20),
  avatar      VARCHAR(255),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Tabel: reports
-- Laporan dari warga (tanpa login)
-- =============================================
CREATE TABLE reports (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  report_number   VARCHAR(20) NOT NULL UNIQUE COMMENT 'Format: RPT-YYYYMMDD-XXXX',
  reporter_name   VARCHAR(100) COMMENT 'Nama pelapor (opsional)',
  reporter_phone  VARCHAR(20)  COMMENT 'HP pelapor (opsional)',
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  address         VARCHAR(255) NOT NULL,
  lat             DECIMAL(10,8) COMMENT 'Latitude (opsional)',
  lng             DECIMAL(11,8) COMMENT 'Longitude (opsional)',
  status          ENUM('menunggu','diverifikasi','diproses','selesai','ditolak')
                  NOT NULL DEFAULT 'menunggu',
  notes           TEXT COMMENT 'Catatan dari admin/petugas',
  verified_by     INT COMMENT 'FK ke users.id yang memverifikasi',
  verified_at     TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_report_number (report_number),
  INDEX idx_created_at (created_at),
  FULLTEXT idx_address_search (address, title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Tabel: report_images
-- Foto laporan (before dari warga, after dari admin)
-- =============================================
CREATE TABLE report_images (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  report_id     INT NOT NULL,
  image_path    VARCHAR(255) NOT NULL,
  type          ENUM('before','after') NOT NULL,
  uploaded_by   INT COMMENT 'NULL jika warga upload before',
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_report_id (report_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Tabel: announcements
-- Pengumuman desa
-- =============================================
CREATE TABLE announcements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  content       TEXT NOT NULL,
  type          ENUM('umum','kegiatan','gotong_royong','posyandu')
                NOT NULL DEFAULT 'umum',
  image         VARCHAR(255) COMMENT 'Gambar opsional',
  is_pinned     TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Muncul paling atas',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_by    INT,
  published_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_is_active (is_active),
  INDEX idx_is_pinned (is_pinned),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
