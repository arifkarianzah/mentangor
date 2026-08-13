const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'portal_desa_store.json');

// Pastikan direktori data tersedia
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const nowIso = new Date().toISOString();

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
      created_at: nowIso
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
      created_at: nowIso
    }
  ],
  announcements: [
    {
      id: 1,
      title: 'Selamat Datang di Portal Desa Mentangor',
      content: 'Portal Desa ini hadir untuk memudahkan warga dalam mengakses informasi pengumuman dan melaporkan keluhan lingkungan sekitar secara online 24 jam.',
      type: 'umum',
      image: null,
      is_pinned: 1,
      is_active: 1,
      created_by: 1,
      author_name: 'Administrator',
      published_at: nowIso,
      created_at: nowIso
    },
    {
      id: 2,
      title: 'Jadwal Posyandu Balita & Lansia RW 02',
      content: 'Kegiatan posyandu rutin akan diadakan pada hari Sabtu pekan depan di Balai RW 02 mulai pukul 08.30 WIB. Mohon kehadiran ibu dan balita.',
      type: 'posyandu',
      image: null,
      is_pinned: 1,
      is_active: 1,
      created_by: 1,
      author_name: 'Administrator',
      published_at: nowIso,
      created_at: nowIso
    }
  ],
  reports: [
    {
      id: 1,
      report_number: 'RPT-20260804-0001',
      ticket_num: 'RPT-20260804-0001',
      title: 'Lampu Penerangan Jalan Padam di RT 03',
      description: 'Lampu jalan utama di depan pos ronda RT 03 sudah 3 hari padam menyebabkan jalanan gelap.',
      category: 'fasilitas_umum',
      status: 'menunggu',
      priority: 'sedang',
      address: 'Jl. Mentangor Raya RT 03 RW 02',
      reporter_name: 'Warga Mentangor',
      reporter_phone: '08123456789',
      reporter_email: 'warga@gmail.com',
      notes: '',
      assigned_to: null,
      created_at: nowIso
    }
  ],
  report_images: [
    {
      id: 1,
      report_id: 1,
      image_path: 'announcements/lampu-jalan.jpg',
      type: 'before',
      uploaded_by: null,
      uploaded_at: nowIso
    }
  ],
  report_logs: []
};

function normalizeReport(r, imagesList = null) {
  if (!r) return r;
  const num = r.report_number || r.ticket_num || `RPT-20260804-${String(r.id).padStart(4, '0')}`;
  const allImages = (Array.isArray(imagesList) ? imagesList : null) || ((typeof store !== 'undefined' && store && Array.isArray(store.report_images)) ? store.report_images : []);
  const images = allImages.filter(img => img && img.report_id === r.id);
  const beforeImg = images.find(img => img && img.type === 'before');
  const afterImg = images.find(img => img && img.type === 'after');
  return {
    ...r,
    report_number: num,
    ticket_num: num,
    photo_before: beforeImg ? beforeImg.image_path : (r.photo_before || null),
    photo_after: afterImg ? afterImg.image_path : (r.photo_after || null),
    images: images.length > 0 ? images : (r.images || []),
    reporter_name: r.reporter_name || 'Warga Mentangor',
    address: r.address || 'RW 02 Mentangor',
    title: r.title || 'Laporan Warga',
    status: r.status || 'menunggu',
    notes: r.notes || '',
    created_at: r.created_at || new Date().toISOString()
  };
}

let store = null;

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed.announcements) {
        parsed.announcements.forEach(a => {
          if (!a.published_at) a.published_at = a.created_at || new Date().toISOString();
        });
      }
      if (!parsed.report_images) {
        parsed.report_images = [];
      }
      if (!parsed.galleries) {
        parsed.galleries = [];
      }
      if (!parsed.news) {
        parsed.news = [];
      }
      if (parsed.reports) {
        parsed.reports = parsed.reports.map(r => normalizeReport(r, parsed.report_images));
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error loading mock database store:', err);
  }
  return defaultData;
}

store = loadStore();

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving mock database store:', err);
  }
}

function queryFilterReports(upperSql, params = []) {
  let list = store.reports.map(r => normalizeReport(r));
  const validStatuses = ['menunggu', 'diverifikasi', 'diproses', 'selesai', 'ditolak'];

  // Handle WHERE ticket/number/id
  if (upperSql.includes('WHERE REPORT_NUMBER = ?') || upperSql.includes('WHERE TICKET_NUM = ?') || upperSql.includes('REPORT_NUMBER = ?')) {
    const ticket = params[0];
    return list.filter(r => r.report_number === ticket || r.ticket_num === ticket);
  }
  if (upperSql.includes('WHERE ID = ?') || upperSql.includes('R.ID = ?') || upperSql.includes('WHERE R.ID = ?')) {
    const id = parseInt(params[0]);
    return list.filter(r => r.id === id);
  }

  // Handle status != and status =
  const hasNotEqual = upperSql.includes('STATUS != ?') || upperSql.includes('STATUS!= ?') || upperSql.includes('STATUS !=?');
  const hasEqual = upperSql.includes('STATUS = ?') || upperSql.includes('STATUS= ?') || upperSql.includes('STATUS =?');

  if (hasNotEqual && hasEqual) {
    const notStatus = params[0];
    const eqStatus = params.slice(1).find(p => validStatuses.includes(String(p).toLowerCase()));
    if (notStatus) list = list.filter(r => r.status !== String(notStatus).toLowerCase());
    if (eqStatus) list = list.filter(r => r.status === String(eqStatus).toLowerCase());
  } else if (hasNotEqual) {
    const notStatus = params.find(p => validStatuses.includes(String(p).toLowerCase()));
    if (notStatus) list = list.filter(r => r.status !== String(notStatus).toLowerCase());
  } else if (hasEqual) {
    const eqStatus = params.find(p => validStatuses.includes(String(p).toLowerCase()));
    if (eqStatus) list = list.filter(r => r.status === String(eqStatus).toLowerCase());
  }

  // Handle search LIKE
  if (upperSql.includes('LIKE ?')) {
    const searchParams = params.filter(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
    if (searchParams.length > 0) {
      const term = searchParams[0].replace(/%/g, '').toLowerCase();
      if (term) {
        list = list.filter(r => 
          (r.title && r.title.toLowerCase().includes(term)) ||
          (r.address && r.address.toLowerCase().includes(term)) ||
          (r.report_number && r.report_number.toLowerCase().includes(term)) ||
          (r.description && r.description.toLowerCase().includes(term))
        );
      }
    }
  }

  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
}

// SQL Query Parser & Execution Engine for persistent data store
async function mockQuery(sql, params = []) {
  // Normalisasi placeholder PostgreSQL ($1, $2) menjadi ? agar query handler bisa mencocokkan
  let cleanSql = sql.trim().replace(/\s+/g, ' ').replace(/\$\d+/g, '?');
  const upper = cleanSql.toUpperCase();

  // 1. SELECT COUNT
  if (upper.includes('SELECT COUNT(*)')) {
    if (upper.includes('FROM USERS')) {
      return [[{ total: store.users.length }]];
    }
    if (upper.includes('FROM ANNOUNCEMENTS')) {
      const activeAnn = store.announcements.filter(a => a.is_active === 1 || !upper.includes('IS_ACTIVE = 1'));
      return [[{ total: activeAnn.length }]];
    }
    if (upper.includes('FROM REPORTS')) {
      const filtered = queryFilterReports(upper, params);
      return [[{ total: filtered.length }]];
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

  // 4. ANNOUNCEMENTS - TOGGLES & DELETE
  if (upper.includes('UPDATE ANNOUNCEMENTS SET IS_PINNED = NOT IS_PINNED')) {
    const id = parseInt(params[0]);
    const item = store.announcements.find(a => a.id === id);
    if (item) {
      item.is_pinned = item.is_pinned ? 0 : 1;
      saveStore();
    }
    return [{ affectedRows: 1 }];
  }

  if (upper.includes('UPDATE ANNOUNCEMENTS SET IS_ACTIVE = NOT IS_ACTIVE')) {
    const id = parseInt(params[0]);
    const item = store.announcements.find(a => a.id === id);
    if (item) {
      item.is_active = item.is_active ? 0 : 1;
      saveStore();
    }
    return [{ affectedRows: 1 }];
  }

  if (upper.startsWith('DELETE FROM ANNOUNCEMENTS')) {
    const id = parseInt(params[0]);
    store.announcements = store.announcements.filter(a => a.id !== id);
    saveStore();
    return [{ affectedRows: 1 }];
  }

  // ANNOUNCEMENTS - UPDATE
  if (upper.startsWith('UPDATE ANNOUNCEMENTS')) {
    const title = params[0];
    const content = params[1];
    const type = params[2];
    const is_pinned = (params[3] === true || params[3] === '1' || params[3] === 1) ? 1 : 0;
    const published_at = params[4] ? new Date(params[4]).toISOString() : new Date().toISOString();
    const image = params[5];
    const id = parseInt(params[6]);

    const item = store.announcements.find(a => a.id === id);
    if (item) {
      item.title = title;
      item.content = content;
      item.type = type;
      item.is_pinned = is_pinned;
      item.published_at = published_at;
      if (image) item.image = image;
      saveStore();
    }
    return [{ affectedRows: 1 }];
  }

  // ANNOUNCEMENTS - SELECT SINGLE
  if (upper.startsWith('SELECT') && upper.includes('FROM ANNOUNCEMENTS WHERE ID = ?')) {
    const id = parseInt(params[0]);
    const found = store.announcements.filter(a => a.id === id);
    return [found];
  }

  // ANNOUNCEMENTS - SELECT LIST
  if (upper.startsWith('SELECT') && upper.includes('FROM ANNOUNCEMENTS')) {
    let list = [...store.announcements];
    if (upper.includes('IS_ACTIVE = 1')) {
      list = list.filter(a => a.is_active === 1);
    }
    list.sort((a, b) => {
      if (b.is_pinned !== a.is_pinned) return b.is_pinned - a.is_pinned;
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
    });
    return [list];
  }

  // ANNOUNCEMENTS - INSERT
  if (upper.startsWith('INSERT INTO ANNOUNCEMENTS')) {
    const newId = (store.announcements.length ? Math.max(...store.announcements.map(a => a.id)) : 0) + 1;
    const title = params[0];
    const content = params[1];
    const type = params[2] || 'umum';
    const image = params[3] || null;
    const is_pinned = (params[4] === true || params[4] === '1' || params[4] === 1) ? 1 : 0;
    const created_by = params[5] || 1;
    const published_at = params[6] ? new Date(params[6]).toISOString() : new Date().toISOString();

    const newAnn = {
      id: newId,
      title,
      content,
      type,
      image,
      is_pinned,
      is_active: 1,
      created_by,
      author_name: 'Administrator',
      published_at,
      created_at: new Date().toISOString()
    };
    store.announcements.unshift(newAnn);
    saveStore();
    return [{ insertId: newId, affectedRows: 1 }];
  }

  // 5. REPORTS - DELETE
  if (upper.startsWith('DELETE FROM REPORTS')) {
    const id = parseInt(params[0]);
    store.reports = store.reports.filter(r => r.id !== id);
    if (store.report_images) {
      store.report_images = store.report_images.filter(img => img.report_id !== id);
    }
    saveStore();
    return [{ affectedRows: 1 }];
  }

  // REPORTS - UPDATE STATUS
  if (upper.startsWith('UPDATE REPORTS')) {
    const status = params[0];
    const notes = params[1];
    const id = parseInt(params[params.length - 1]);
    const report = store.reports.find(r => r.id === id);
    if (report) {
      if (status) report.status = status;
      if (notes !== undefined && notes !== null) report.notes = notes;
      saveStore();
    }
    return [{ affectedRows: 1 }];
  }

  // REPORTS - SELECT
  if (upper.startsWith('SELECT') && upper.includes('FROM REPORTS')) {
    let list = queryFilterReports(upper, params);

    // Populate before_image and after_image fields if requested
    if (upper.includes('BEFORE_IMAGE') || upper.includes('AFTER_IMAGE')) {
      list = list.map(r => ({
        ...r,
        before_image: r.photo_before || (r.images && r.images.find(img => img.type === 'before')?.image_path) || null,
        after_image: r.photo_after || (r.images && r.images.find(img => img.type === 'after')?.image_path) || null
      }));
    }

    // Pagination limit / offset
    if (upper.includes('LIMIT ? OFFSET ?')) {
      const limitVal = parseInt(params[params.length - 2]);
      const offsetVal = parseInt(params[params.length - 1]);
      if (!isNaN(limitVal) && !isNaN(offsetVal)) {
        list = list.slice(offsetVal, offsetVal + limitVal);
      }
    } else if (upper.includes('LIMIT ?')) {
      const limitVal = parseInt(params[params.length - 1]);
      if (!isNaN(limitVal)) {
        list = list.slice(0, limitVal);
      }
    }

    return [list];
  }

  // REPORTS - INSERT
  if (upper.startsWith('INSERT INTO REPORTS')) {
    const newId = (store.reports.length ? Math.max(...store.reports.map(r => r.id)) : 0) + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const num = params[0] || `RPT-${dateStr}-${String(newId).padStart(4, '0')}`;
    const newReport = {
      id: newId,
      report_number: num,
      ticket_num: num,
      reporter_name: params[1] || 'Warga Mentangor',
      reporter_phone: params[2] || '',
      reporter_email: '',
      title: params[3] || 'Laporan Warga',
      description: params[4] || '',
      address: params[5] || 'RW 02 Mentangor',
      category: 'fasilitas_umum',
      status: 'menunggu',
      priority: 'sedang',
      notes: '',
      created_at: new Date().toISOString()
    };
    store.reports.unshift(newReport);
    saveStore();
    return [{ insertId: newId, affectedRows: 1 }];
  }

  // REPORT IMAGES - SELECT
  if (upper.startsWith('SELECT') && (upper.includes('FROM REPORT_IMAGES') || upper.includes('REPORT_IMAGES'))) {
    const reportId = parseInt(params[0]);
    let list = (store.report_images || []).filter(img => img.report_id === reportId);
    
    // Attach uploader_name if joined with users
    if (upper.includes('USERS') || upper.includes('UPLOADER_NAME')) {
      list = list.map(img => {
        const user = img.uploaded_by ? (store.users || []).find(u => u.id === img.uploaded_by) : null;
        return {
          ...img,
          uploader_name: user ? user.name : 'Petugas'
        };
      });
    }
    return [list];
  }

  // REPORT IMAGES - INSERT
  if (upper.startsWith('INSERT INTO REPORT_IMAGES')) {
    if (!store.report_images) store.report_images = [];
    const rows = Array.isArray(params[0]) ? params[0] : [params];
    let insertedCount = 0;
    
    rows.forEach(row => {
      if (Array.isArray(row)) {
        store.report_images.push({
          id: (store.report_images.length ? Math.max(...store.report_images.map(img => img.id || 0)) : 0) + 1,
          report_id: parseInt(row[0]),
          image_path: row[1],
          type: row[2] || 'before',
          uploaded_by: row[3] || null,
          uploaded_at: new Date().toISOString()
        });
        insertedCount++;
      } else if (typeof row === 'object' && row !== null) {
        store.report_images.push({
          id: (store.report_images.length ? Math.max(...store.report_images.map(img => img.id || 0)) : 0) + 1,
          report_id: parseInt(row.report_id || params[0]),
          image_path: row.image_path || row.filename || '',
          type: row.type || 'before',
          uploaded_by: row.uploaded_by || null,
          uploaded_at: new Date().toISOString()
        });
        insertedCount++;
      }
    });
    
    saveStore();
    return [{ insertId: 1, affectedRows: insertedCount || 1 }];
  }

  // 6. GALLERIES - SELECT COUNT
  if (upper.includes('SELECT COUNT(*) AS TOTAL FROM GALLERIES')) {
    const list = store.galleries || [];
    const filtered = upper.includes('IS_PUBLISHED = TRUE') || upper.includes('IS_PUBLISHED = 1')
      ? list.filter(g => g.is_published === 1 || g.is_published === true)
      : list;
    return [[{ total: filtered.length }]];
  }

  // GALLERIES - SELECT LIST
  if (upper.startsWith('SELECT') && upper.includes('FROM GALLERIES') && !upper.includes('WHERE ID =')) {
    if (!store.galleries) store.galleries = [];
    let list = [...store.galleries];

    if (upper.includes('IS_PUBLISHED = TRUE') || upper.includes('IS_PUBLISHED = 1')) {
      list = list.filter(g => g.is_published === 1 || g.is_published === true);
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    if (upper.includes('LIMIT')) {
      const limitVal = parseInt(params[params.length - 2]) || parseInt(params[params.length - 1]) || 6;
      const offsetVal = parseInt(params[params.length - 1]) || 0;
      if (params.length >= 2) {
        list = list.slice(offsetVal, offsetVal + limitVal);
      } else {
        list = list.slice(0, limitVal);
      }
    }
    return [list];
  }

  // GALLERIES - SELECT BY ID
  if (upper.startsWith('SELECT') && upper.includes('FROM GALLERIES') && upper.includes('WHERE ID =')) {
    const id = parseInt(params[0]);
    const found = (store.galleries || []).filter(g => g.id === id);
    return [found];
  }

  // GALLERIES - INSERT
  if (upper.startsWith('INSERT INTO GALLERIES')) {
    if (!store.galleries) store.galleries = [];
    const newId = store.galleries.length ? Math.max(...store.galleries.map(g => g.id)) + 1 : 1;
    const newGallery = {
      id: newId,
      title: params[0],
      description: params[1] || '',
      image_url: params[2] || '',
      is_published: params[3] === true || params[3] === 'true' || params[3] === 1 ? 1 : 0,
      created_at: new Date().toISOString()
    };
    store.galleries.unshift(newGallery);
    saveStore();
    return [{ insertId: newId, affectedRows: 1 }];
  }

  // GALLERIES - UPDATE
  if (upper.startsWith('UPDATE GALLERIES')) {
    if (!store.galleries) store.galleries = [];
    const id = parseInt(params[params.length - 1]);
    const gallery = store.galleries.find(g => g.id === id);
    if (gallery) {
      gallery.title = params[0] || gallery.title;
      gallery.description = params[1] !== undefined ? params[1] : gallery.description;
      gallery.image_url = params[2] || gallery.image_url;
      gallery.is_published = params[3] === true || params[3] === 'true' || params[3] === 1 ? 1 : 0;
      saveStore();
    }
    return [{ affectedRows: 1 }];
  }

  // GALLERIES - DELETE
  if (upper.startsWith('DELETE FROM GALLERIES')) {
    if (!store.galleries) store.galleries = [];
    const id = parseInt(params[0]);
    store.galleries = store.galleries.filter(g => g.id !== id);
    saveStore();
    return [{ affectedRows: 1 }];
  }

  // 7. NEWS - SELECT COUNT
  if (upper.includes('SELECT COUNT(*)') && upper.includes('FROM NEWS')) {
    const list = store.news || [];
    const filtered = upper.includes('IS_PUBLISHED = TRUE') || upper.includes('IS_PUBLISHED = 1')
      ? list.filter(n => n.is_published === 1 || n.is_published === true)
      : list;
    return [[{ total: filtered.length }]];
  }

  // NEWS - SELECT BY SLUG
  if (upper.startsWith('SELECT') && upper.includes('FROM NEWS') && upper.includes('WHERE SLUG = ?')) {
    const slug = params[0];
    const found = (store.news || []).filter(n => n.slug === slug);
    return [found];
  }

  // NEWS - SELECT BY ID
  if (upper.startsWith('SELECT') && upper.includes('FROM NEWS') && upper.includes('WHERE ID = ?')) {
    const id = parseInt(params[0]);
    const found = (store.news || []).filter(n => n.id === id);
    return [found];
  }

  // NEWS - SELECT LIST
  if (upper.startsWith('SELECT') && upper.includes('FROM NEWS')) {
    if (!store.news) store.news = [];
    let list = [...store.news];
    if (upper.includes('IS_PUBLISHED = TRUE') || upper.includes('IS_PUBLISHED = 1')) {
      list = list.filter(n => n.is_published === 1 || n.is_published === true);
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (upper.includes('LIMIT')) {
      const limitVal = parseInt(params[params.length - 2]) || parseInt(params[params.length - 1]) || 6;
      const offsetVal = params.length >= 2 ? (parseInt(params[params.length - 1]) || 0) : 0;
      if (params.length >= 2) {
        list = list.slice(offsetVal, offsetVal + limitVal);
      } else {
        list = list.slice(0, limitVal);
      }
    }
    return [list];
  }

  // NEWS - INSERT
  // Controller sends: [title, slug, category, content, imageUrl, published]
  if (upper.startsWith('INSERT INTO NEWS')) {
    if (!store.news) store.news = [];
    const newId = store.news.length ? Math.max(...store.news.map(n => n.id)) + 1 : 1;
    const newItem = {
      id: newId,
      title: params[0],
      slug: params[1] || (params[0] || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: (typeof params[2] === 'string') ? params[2] : 'Umum',
      content: params[3] || '',
      excerpt: '',
      image_url: params[4] || null,
      is_published: params[5] === true || params[5] === 'true' || params[5] === 1 ? 1 : 0,
      views: 0,
      author_id: 1,
      author_name: 'Administrator',
      created_at: new Date().toISOString()
    };
    store.news.unshift(newItem);
    saveStore();
    return [{ insertId: newId, affectedRows: 1 }];
  }

  // NEWS - UPDATE
  if (upper.startsWith('UPDATE NEWS')) {
    if (!store.news) store.news = [];
    const id = parseInt(params[params.length - 1]);
    const item = store.news.find(n => n.id === id);
    if (item) {
      if (params[0] !== undefined) item.title = params[0];
      if (params[1] !== undefined) item.slug = params[1];
      if (params[2] !== undefined) item.content = params[2];
      if (params[3] !== undefined) item.excerpt = params[3];
      if (params[4] !== undefined) item.image_url = params[4] || item.image_url;
      if (params[5] !== undefined) item.category = params[5];
      if (params[6] !== undefined) item.is_published = params[6] === true || params[6] === 'true' || params[6] === 1 ? 1 : 0;
      saveStore();
    }
    return [{ affectedRows: 1 }];
  }

  // NEWS - DELETE
  if (upper.startsWith('DELETE FROM NEWS')) {
    if (!store.news) store.news = [];
    const id = parseInt(params[0]);
    store.news = store.news.filter(n => n.id !== id);
    saveStore();
    return [{ affectedRows: 1 }];
  }

  // Generic fallback
  return [[]];
}

module.exports = { mockQuery, store };
