# desa-mentangor

Portal Desa Mentangor — Sistem pelaporan dan informasi warga desa berbasis web.

## Fitur
- **Halaman Publik**: Beranda, Laporan Warga, Pengumuman/Kegiatan Desa
- **Panel Admin**: Dashboard statistik, kelola laporan, kelola pengumuman, manajemen pengguna, profil
- **SPA Router**: Navigasi antar halaman admin tanpa reload penuh
- **Responsif**: Mendukung HP, Tablet, dan Desktop

## Teknologi
- **Frontend**: HTML, CSS (Bootstrap 5), Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL / SQLite

## Cara Menjalankan
```bash
# Install dependencies backend
cd backend
npm install

# Jalankan backend
npm run dev

# Jalankan frontend (di terminal terpisah)
cd ../frontend
npx http-server . -p 5500 --cors
```

Akses di: http://localhost:5500/admin/
