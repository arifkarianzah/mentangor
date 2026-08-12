-- =============================================
-- Portal Desa — Database Schema (PostgreSQL Version)
-- Versi: 1.0 | Supabase PostgreSQL
-- =============================================

-- =============================================
-- Tabel: users
-- Hanya admin & petugas yang punya akun
-- =============================================
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL, -- bcrypt hash
  role        VARCHAR(20) NOT NULL DEFAULT 'petugas' CHECK (role IN ('admin', 'petugas')),
  phone       VARCHAR(20),
  avatar      VARCHAR(255),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- Tabel: reports
-- Laporan dari warga (tanpa login)
-- =============================================
CREATE TABLE reports (
  id              SERIAL PRIMARY KEY,
  report_number   VARCHAR(20) NOT NULL UNIQUE, -- Format: RPT-YYYYMMDD-XXXX
  reporter_name   VARCHAR(100), -- Nama pelapor (opsional)
  reporter_phone  VARCHAR(20),  -- HP pelapor (opsional)
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  address         VARCHAR(255) NOT NULL,
  lat             DECIMAL(10,8), -- Latitude (opsional)
  lng             DECIMAL(11,8), -- Longitude (opsional)
  status          VARCHAR(20) NOT NULL DEFAULT 'menunggu' 
                  CHECK (status IN ('menunggu','diverifikasi','diproses','selesai','ditolak')),
  notes           TEXT, -- Catatan dari admin/petugas
  verified_by     INT, -- FK ke users.id yang memverifikasi
  verified_at     TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_report_number ON reports(report_number);
CREATE INDEX idx_reports_created_at ON reports(created_at);
-- Standard index replacing MySQL FULLTEXT
CREATE INDEX idx_reports_address_title ON reports(address, title); 

-- =============================================
-- Tabel: report_images
-- Foto laporan (before dari warga, after dari admin)
-- =============================================
CREATE TABLE report_images (
  id            SERIAL PRIMARY KEY,
  report_id     INT NOT NULL,
  image_path    VARCHAR(255) NOT NULL,
  type          VARCHAR(10) NOT NULL CHECK (type IN ('before','after')),
  uploaded_by   INT, -- NULL jika warga upload before
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_report_images_report_id ON report_images(report_id);
CREATE INDEX idx_report_images_type ON report_images(type);

-- =============================================
-- Tabel: announcements
-- Pengumuman desa
-- =============================================
CREATE TABLE announcements (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  content       TEXT NOT NULL,
  type          VARCHAR(20) NOT NULL DEFAULT 'umum'
                CHECK (type IN ('umum','kegiatan','gotong_royong','posyandu')),
  image         VARCHAR(255), -- Gambar opsional
  is_pinned     BOOLEAN NOT NULL DEFAULT false, -- Muncul paling atas
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    INT,
  published_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX idx_announcements_type ON announcements(type);

-- Fungsi Trigger untuk update `updated_at` otomatis di PostgreSQL
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_reports_modtime BEFORE UPDATE ON reports FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_announcements_modtime BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
