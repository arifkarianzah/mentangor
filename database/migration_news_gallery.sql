-- =============================================
-- Migration: Fitur Berita dan Galeri
-- =============================================

-- 1. Tabel Berita (News)
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    is_published BOOLEAN DEFAULT true,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger untuk update_at otomatis (menggunakan fungsi update_modified_column yang sudah ada)
DROP TRIGGER IF EXISTS update_news_modtime ON news;
CREATE TRIGGER update_news_modtime
    BEFORE UPDATE ON news
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- 2. Tabel Galeri (Galleries)
CREATE TABLE IF NOT EXISTS galleries (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger untuk update_at otomatis pada galleries
DROP TRIGGER IF EXISTS update_galleries_modtime ON galleries;
CREATE TRIGGER update_galleries_modtime
    BEFORE UPDATE ON galleries
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- =============================================
-- Dummy Data
-- =============================================
INSERT INTO news (title, slug, category, content, image_url, is_published, views) VALUES
('Pembangunan Jalan Desa Selesai', 'pembangunan-jalan-desa-selesai', 'Pembangunan', 'Pembangunan jalan aspal utama di RW 02 telah selesai dilaksanakan dengan baik.', 'https://via.placeholder.com/800x400?text=Jalan+Desa', true, 12),
('Kerja Bakti Warga RW 02', 'kerja-bakti-warga-rw-02', 'Kegiatan Desa', 'Kegiatan kerja bakti rutin bulan ini berjalan lancar dengan antusiasme warga.', 'https://via.placeholder.com/800x400?text=Kerja+Bakti', true, 30),
('Penyuluhan Kesehatan Lansia', 'penyuluhan-kesehatan-lansia', 'Kesehatan', 'Puskesmas setempat memberikan penyuluhan kesehatan bagi lansia di Balai RW.', 'https://via.placeholder.com/800x400?text=Kesehatan', true, 15);

INSERT INTO galleries (title, description, image_url, is_published) VALUES
('Gotong Royong', 'Warga membersihkan parit.', 'https://via.placeholder.com/600x400?text=Gotong+Royong', true),
('Lomba 17 Agustus', 'Keseruan lomba tarik tambang.', 'https://via.placeholder.com/600x400?text=Lomba+17an', true),
('Rapat Desa', 'Pertemuan rutin ketua RT.', 'https://via.placeholder.com/600x400?text=Rapat+Desa', true);
