const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'portal_desa_store.json');

// Pastikan direktori data tersedia
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inisialisasi data awal (Seed)
const defaultData = {
  users: [
    {
      id: 1,
      name: 'Administrator',
      email: 'admin@portaldesa.id',
      password: bcrypt.hashSync('Admin@2026', 10),
      role: 'admin',
      phone: '08100000001',
      avatar: null,
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Petugas Lapangan',
      email: 'petugas@portaldesa.id',
      password: bcrypt.hashSync('Petugas@2026', 10),
      role: 'petugas',
      phone: '08100000002',
      avatar: null,
      is_active: 1,
      created_at: new Date().toISOString()
    }
  ],
  announcements: [
    {
      id: 1,
      title: 'Selamat Datang di Portal Desa Mentangor',
      content: 'Portal Desa ini hadir untuk memudahkan warga dalam mengakses informasi pengumuman dan melaporkan keluhan lingkungan sekitar secara online 24 jam.',
      type: 'umum',
      is_pinned: 1,
      is_active: 1,
      created_by: 1,
      author_name: 'Administrator',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Jadwal Posyandu Balita & Lansia RW 02',
      content: 'Kegiatan posyandu rutin akan diadakan pada hari Sabtu pekan depan di Balai RW 02 mulai pukul 08.30 WIB. Mohon kehadiran ibu dan balita.',
      type: 'kesehatan',
      is_pinned: 1,
      is_active: 1,
      created_by: 1,
      author_name: 'Administrator',
      created_at: new Date().toISOString()
    }
  ],
  reports: [
    {
      id: 1,
      ticket_num: 'LAP-20260804-001',
      title: 'Lampu Penerangan Jalan Padam di RT 03',
      description: 'Lampu jalan utama di depan pos ronda RT 03 sudah 3 hari padam menyebabkan jalanan gelap.',
      category: 'fasilitas_umum',
      status: 'menunggu',
      priority: 'sedang',
      address: 'Jl. Mentangor Raya RT 03 RW 02',
      reporter_name: 'Warga Mentangor',
      reporter_phone: '08123456789',
      reporter_email: 'warga@gmail.com',
      assigned_to: null,
      created_at: new Date().toISOString()
    }
  ],
  report_images: [],
  report_logs: []
};

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading mock database store:', err);
  }
  return defaultData;
}

let store = loadStore();

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving mock database store:', err);
  }
}

// Minimal SQL Query Parser & Execution Engine for fallback
async function mockQuery(sql, params = []) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  const upper = cleanSql.toUpperCase();

  // 1. SELECT COUNT
  if (upper.includes('SELECT COUNT(*)')) {
    if (upper.includes('FROM USERS')) {
      return [[{ total: store.users.length }]];
    }
    if (upper.includes('FROM ANNOUNCEMENTS')) {
      return [[{ total: store.announcements.length }]];
    }
    if (upper.includes('FROM REPORTS')) {
      return [[{ total: store.reports.length }]];
    }
  }

  // 2. Dashboard Stats
  if (upper.includes('GROUP BY STATUS') && upper.includes('FROM REPORTS')) {
    const counts = {};
    store.reports.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    const rows = Object.keys(counts).map(status => ({ status, total: counts[status] }));
    return [rows];
  }

  if (upper.includes('MONTH(CREATED_AT)') && upper.includes('FROM REPORTS')) {
    return [[{ total: store.reports.length }]];
  }

  if (upper.includes('GROUP BY ADDRESS') && upper.includes('FROM REPORTS')) {
    const hotspots = [{ address: 'Jl. Mentangor Raya RW 02', total: store.reports.length }];
    return [hotspots];
  }

  // 3. USERS - Login by Email
  if (upper.startsWith('SELECT') && upper.includes('FROM USERS WHERE EMAIL = ?')) {
    const email = params[0];
    const found = store.users.filter(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    return [found];
  }

  // USERS - Find by ID
  if (upper.startsWith('SELECT') && upper.includes('FROM USERS WHERE ID = ?')) {
    const id = parseInt(params[0]);
    const found = store.users.filter(u => u.id === id);
    return [found];
  }

  // USERS - List all
  if (upper.startsWith('SELECT') && upper.includes('FROM USERS')) {
    return [store.users];
  }

  // USERS - INSERT (Register / Add User)
  if (upper.startsWith('INSERT INTO USERS')) {
    const newId = (store.users.length ? Math.max(...store.users.map(u => u.id)) : 0) + 1;
    let name = params[0], email = params[1], password = params[2], role = params[3] || 'petugas', phone = params[4] || '';
    
    // Hash password if not hashed yet
    if (!password.startsWith('$2')) {
      password = bcrypt.hashSync(password, 10);
    }

    const newUser = {
      id: newId,
      name,
      email,
      password,
      role,
      phone,
      avatar: null,
      is_active: 1,
      created_at: new Date().toISOString()
    };
    store.users.push(newUser);
    saveStore();
    return [{ insertId: newId, affectedRows: 1 }];
  }

  // USERS - UPDATE
  if (upper.startsWith('UPDATE USERS')) {
    if (upper.includes('PASSWORD = ? WHERE ID = ?')) {
      const pass = params[0];
      const id = parseInt(params[1]);
      const user = store.users.find(u => u.id === id);
      if (user) {
        user.password = pass.startsWith('$2') ? pass : bcrypt.hashSync(pass, 10);
        saveStore();
      }
    } else if (upper.includes('IS_ACTIVE = NOT IS_ACTIVE')) {
      const id = parseInt(params[0]);
      const user = store.users.find(u => u.id === id);
      if (user) {
        user.is_active = user.is_active ? 0 : 1;
        saveStore();
      }
    } else if (upper.includes('AVATAR = ?')) {
      const avatar = params[0];
      const id = parseInt(params[1]);
      const user = store.users.find(u => u.id === id);
      if (user) {
        user.avatar = avatar;
        saveStore();
      }
    }
    return [{ affectedRows: 1 }];
  }

  // 4. ANNOUNCEMENTS
  if (upper.startsWith('SELECT') && upper.includes('FROM ANNOUNCEMENTS')) {
    if (upper.includes('WHERE ID = ?')) {
      const id = parseInt(params[0]);
      const found = store.announcements.filter(a => a.id === id);
      return [found];
    }
    return [store.announcements];
  }

  if (upper.startsWith('INSERT INTO ANNOUNCEMENTS')) {
    const newId = (store.announcements.length ? Math.max(...store.announcements.map(a => a.id)) : 0) + 1;
    const newAnn = {
      id: newId,
      title: params[0],
      content: params[1],
      type: params[2] || 'umum',
      is_pinned: params[3] ? 1 : 0,
      is_active: 1,
      created_by: params[4] || 1,
      author_name: 'Administrator',
      created_at: new Date().toISOString()
    };
    store.announcements.unshift(newAnn);
    saveStore();
    return [{ insertId: newId, affectedRows: 1 }];
  }

  // 5. REPORTS
  if (upper.startsWith('SELECT') && upper.includes('FROM REPORTS')) {
    if (upper.includes('WHERE TICKET_NUM = ?') || upper.includes('TICKET_NUM = ?')) {
      const ticket = params[0];
      const found = store.reports.filter(r => r.ticket_num === ticket);
      return [found];
    }
    if (upper.includes('WHERE ID = ?') || upper.includes('R.ID = ?')) {
      const id = parseInt(params[0]);
      const found = store.reports.filter(r => r.id === id);
      return [found];
    }
    return [store.reports];
  }

  if (upper.startsWith('INSERT INTO REPORTS')) {
    const newId = (store.reports.length ? Math.max(...store.reports.map(r => r.id)) : 0) + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ticket_num = params[0] || `LAP-${dateStr}-${String(newId).padStart(3, '0')}`;
    const newReport = {
      id: newId,
      ticket_num,
      title: params[1] || params[0],
      description: params[2] || '',
      category: params[3] || 'fasilitas_umum',
      status: 'menunggu',
      priority: 'sedang',
      address: params[4] || '',
      reporter_name: params[5] || 'Warga',
      reporter_phone: params[6] || '',
      reporter_email: params[7] || '',
      created_at: new Date().toISOString()
    };
    store.reports.unshift(newReport);
    saveStore();
    return [{ insertId: newId, affectedRows: 1 }];
  }

  if (upper.startsWith('INSERT INTO REPORT_IMAGES') || upper.startsWith('INSERT INTO REPORT_LOGS')) {
    return [{ insertId: 1, affectedRows: 1 }];
  }

  // Generic fallback
  return [[]];
}

module.exports = { mockQuery, store };
