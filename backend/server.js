const app = require('./app');
require('dotenv').config();
const db = require('./config/db'); // Pastikan koneksi DB terpanggil saat start

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📝 Dokumentasi API: Baca docs/API.md`);
});
