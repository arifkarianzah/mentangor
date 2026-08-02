-- =============================================
-- Portal Desa — Seed Data
-- Jalankan setelah portal_desa.sql
-- =============================================

USE portal_desa;

-- =============================================
-- Users (Admin & Petugas default)
-- Password di-generate dari bcrypt, lihat catatan
-- =============================================
-- CATATAN: Password plaintext ada di .env.example
-- Ganti password setelah sistem pertama kali jalan!
INSERT INTO users (name, email, password, role, phone) VALUES
(
  'Administrator',
  'admin@portaldesa.id',
  -- Password: Admin@2026 (ganti segera!)
  '$2b$10$YQlHKxnREv0QgF4zHb.aHeXr5gZKPUGqFGH9t/jHkBcqQD5RK3sCa',
  'admin',
  '08100000001'
),
(
  'Petugas Lapangan',
  'petugas@portaldesa.id',
  -- Password: Petugas@2026 (ganti segera!)
  '$2b$10$8T3pILk.JZOjf9EJg1DUxOQrWX2N/yHr5PbBfNfq3kE2mVrDpA8lu',
  'petugas',
  '08100000002'
);

-- =============================================
-- Announcements (Contoh pengumuman)
-- =============================================
INSERT INTO announcements (title, content, type, is_pinned, is_active, created_by) VALUES
(
  'Selamat Datang di Portal Desa',
  'Portal Desa ini hadir untuk memudahkan warga dalam mengakses informasi dan melaporkan masalah di lingkungan sekitar, khususnya vandalisme coretan liar. Mari bersama kita jaga kebersihan dan keindahan desa kita!',
  'umum',
  1,
  1,
  1
),
(
  'Gotong Royong Pembersihan Coretan RW 03',
  'Akan diadakan gotong royong pembersihan coretan liar di wilayah RW 03 pada hari Minggu, pukul 07.00 WIB. Mohon partisipasi seluruh warga. Alat kebersihan disediakan oleh pengurus RW.',
  'gotong_royong',
  0,
  1,
  1
),
(
  'Cara Melaporkan Coretan Liar',
  'Warga dapat melaporkan coretan liar (graffiti) di lingkungan sekitar melalui menu "Lapor Coretan Liar". Tidak perlu mendaftar atau login. Cukup isi data lokasi, upload foto, dan kirim. Tim petugas kami akan menindaklanjuti dalam 1x24 jam.',
  'umum',
  0,
  1,
  1
);

-- =============================================
-- Sample Reports (Contoh laporan)
-- =============================================
INSERT INTO reports
  (report_number, reporter_name, reporter_phone, title, description, address, status, notes, verified_by, verified_at)
VALUES
(
  'RPT-20260720-0001',
  'Budi Santoso',
  '081234567890',
  'Coretan di Tembok Balai RW',
  'Ada coretan tulisan dengan cat semprot warna merah di tembok balai RW 05. Sudah ada sejak seminggu lalu.',
  'Jl. Merdeka No. 12, RW 05',
  'selesai',
  'Laporan valid. Sudah dibersihkan oleh tim petugas.',
  2,
  '2026-07-21 09:00:00'
),
(
  'RPT-20260722-0002',
  'Siti Rahayu',
  NULL,
  'Coretan di Tiang Listrik Dekat Pasar',
  'Tiang listrik depan pasar desa dicoret-coret dengan marker hitam. Tulisannya tidak jelas.',
  'Depan Pasar Desa, Jl. Pasar Lama',
  'selesai',
  'Dibersihkan dengan cat penutup.',
  2,
  '2026-07-23 10:30:00'
),
(
  'RPT-20260725-0003',
  NULL,
  NULL,
  'Vandalisme di Tembok Gang Melati',
  'Tembok gang melati RT 03 dipenuhi coretan tidak senonoh. Perlu segera dibersihkan.',
  'Gang Melati RT 03 RW 02',
  'diproses',
  'Sudah diverifikasi. Tim petugas dijadwalkan pembersihan Sabtu ini.',
  1,
  '2026-07-26 08:00:00'
),
(
  'RPT-20260727-0004',
  'Ahmad Fauzi',
  '087654321098',
  'Coretan di Pagar Taman RW 07',
  'Pagar taman RW 07 dicoret dengan cat hitam dan merah. Mengganggu pemandangan.',
  'Taman RW 07, Jl. Flamboyan',
  'diverifikasi',
  'Laporan valid. Menunggu jadwal pembersihan.',
  1,
  '2026-07-27 14:00:00'
),
(
  'RPT-20260728-0005',
  'Dewi Lestari',
  '089876543210',
  'Tembok Pos Ronda RT 08 Dicoret',
  'Pos ronda RT 08 bagian kanan dicoret dengan cat semprot. Baru terjadi tadi malam.',
  'Pos Ronda RT 08 RW 04, Jl. Anggrek',
  'menunggu',
  NULL,
  NULL,
  NULL
);

-- =============================================
-- Report Images (Foto contoh - path placeholder)
-- =============================================
INSERT INTO report_images (report_id, image_path, type, uploaded_by) VALUES
(1, 'reports/before/sample-before-1.jpg', 'before', NULL),
(1, 'reports/after/sample-after-1.jpg', 'after', 2),
(2, 'reports/before/sample-before-2.jpg', 'before', NULL),
(2, 'reports/after/sample-after-2.jpg', 'after', 2),
(3, 'reports/before/sample-before-3.jpg', 'before', NULL),
(4, 'reports/before/sample-before-4.jpg', 'before', NULL),
(5, 'reports/before/sample-before-5.jpg', 'before', NULL);
