const db = require('./config/db');

async function fixPassword() {
  try {
    const hash = '$2a$10$0tofQfoXiv70vtsZaQSIK.CZFQBtjzpMoQK6VBYWvxx1HdJg8IQYe';
    await db.query("UPDATE users SET password = ? WHERE email = 'admin@portaldesa.id'", [hash]);
    console.log('Password admin berhasil direset ke Admin@2026!');
  } catch (err) {
    console.error('Gagal:', err.message);
  }
  process.exit(0);
}

fixPassword();
