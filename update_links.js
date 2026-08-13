const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = [
    'index.html',
    'galeri.html',
    'kontak.html',
    'laporan.html',
    'pengumuman.html',
    'berita.html',
    'berita-detail.html',
    'riwayat.html'
];

files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace Sejarah Desa
        content = content.replace(/href="[^"]*">\s*Sejarah Desa\s*<\/a>/g, 'href="profil.html#sejarah">Sejarah Desa</a>');
        
        // Replace Visi & Misi
        content = content.replace(/href="[^"]*">\s*Visi & Misi\s*<\/a>/g, 'href="profil.html#visi-misi">Visi & Misi</a>');
        
        // Ensure "Beranda" is not "active" in other pages if we need to? Nah, just do the links
        
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    }
});
