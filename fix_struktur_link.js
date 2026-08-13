const fs = require('fs');
const files = ['index.html','galeri.html','kontak.html','laporan.html','pengumuman.html','berita.html','berita-detail.html','riwayat.html','profil.html'];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/href="#">\s*Struktur Organisasi/g, 'href="struktur.html">Struktur Organisasi');
  fs.writeFileSync(f, c);
  console.log('Updated: ' + f);
});
