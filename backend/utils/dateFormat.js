/**
 * Helper format tanggal ke format Indonesia
 */

/**
 * Format tanggal ke "28 Juli 2026"
 */
const formatTanggal = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

/**
 * Format tanggal + waktu ke "28 Juli 2026, 14:30 WIB"
 */
const formatTanggalWaktu = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const tanggal = d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const waktu = d.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });
  return `${tanggal}, ${waktu} WIB`;
};

/**
 * Format relatif "2 jam lalu", "3 hari lalu"
 */
const formatRelative = (date) => {
  if (!date) return '-';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  if (diffMins < 1)   return 'Baru saja';
  if (diffMins < 60)  return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 30)  return `${diffDays} hari lalu`;
  return formatTanggal(date);
};

module.exports = { formatTanggal, formatTanggalWaktu, formatRelative };
