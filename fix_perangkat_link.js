const fs = require('fs');
const files = ['index.html','galeri.html','kontak.html','laporan.html','pengumuman.html','berita.html','berita-detail.html','riwayat.html','profil.html','struktur.html'];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/href="#">\s*Perangkat Desa<\/a>/g, 'href="perangkat.html">Perangkat Desa</a>');
  fs.writeFileSync(f, c);
  console.log('Updated: ' + f);
});
