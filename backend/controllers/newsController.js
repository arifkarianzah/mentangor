const db = require('../config/db');
const { uploadToSupabase, deleteFromSupabase } = require('../config/supabase');
const { success, error, validationError } = require('../utils/response');

// Helper to generate slug from title
const generateSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

/**
 * GET /api/news
 * Mendapatkan daftar berita dengan pagination (maksimal 6 per halaman)
 */
exports.getAllNews = async (req, res) => {
  try {
    let { page, limit, is_published } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 6;
    if (limit > 6) limit = 6; // Maksimal 6 sesuai permintaan
    
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM news';
    let countQuery = 'SELECT COUNT(*) as total FROM news';
    const queryParams = [];

    // Jika dipanggil dari public frontend, filter yg is_published=true
    if (is_published === 'true') {
      query += ' WHERE is_published = true';
      countQuery += ' WHERE is_published = true';
    }

    query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    queryParams.push(limit, offset);

    const [data] = await db.query(query, queryParams);
    const [countRows] = await db.query(countQuery);
    
    const total = parseInt(countRows[0].total);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error in getAllNews:', err);
    return error(res, 'Gagal mengambil data berita', 500);
  }
};

/**
 * GET /api/news/:id
 * Mendapatkan detail berita berdasarkan ID atau Slug
 */
exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    let query, param;

    if (isNaN(id)) {
      query = 'SELECT * FROM news WHERE slug = $1';
      param = id;
    } else {
      query = 'SELECT * FROM news WHERE id = $1';
      param = parseInt(id);
    }

    const [rows] = await db.query(query, [param]);

    if (rows.length === 0) {
      return error(res, 'Berita tidak ditemukan', 404);
    }

    const news = rows[0];

    // Tambah view count
    await db.query('UPDATE news SET views = views + 1 WHERE id = $1', [news.id]);

    return success(res, news);
  } catch (err) {
    console.error('Error in getNewsById:', err);
    return error(res, 'Gagal mengambil detail berita', 500);
  }
};

/**
 * POST /api/news
 * Membuat berita baru
 */
exports.createNews = async (req, res) => {
  try {
    const { title, category, content, is_published } = req.body;
    
    if (!title || !category || !content) {
      return validationError(res, [{ msg: 'Judul, kategori, dan konten wajib diisi' }]);
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToSupabase(req.file, 'news');
    }

    let slug = generateSlug(title);
    
    // Pastikan slug unik (tambah random jika duplikat)
    const [existing] = await db.query('SELECT id FROM news WHERE slug = $1', [slug]);
    if (existing.length > 0) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const published = is_published === 'true' || is_published === true;

    const [rows] = await db.query(
      `INSERT INTO news (title, slug, category, content, image_url, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, slug, category, content, imageUrl, published]
    );

    return success(res, rows[0], 'Berita berhasil ditambahkan', 201);
  } catch (err) {
    console.error('Error in createNews:', err);
    return error(res, 'Gagal membuat berita', 500);
  }
};

/**
 * PUT /api/news/:id
 * Mengupdate berita
 */
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content, is_published } = req.body;

    // Cek berita ada atau tidak
    const [existing] = await db.query('SELECT * FROM news WHERE id = $1', [id]);
    if (existing.length === 0) {
      return error(res, 'Berita tidak ditemukan', 404);
    }
    const oldNews = existing[0];

    let imageUrl = oldNews.image_url;
    let newSlug = oldNews.slug;

    // Jika ada upload gambar baru
    if (req.file) {
      // Hapus gambar lama dari storage
      if (oldNews.image_url) {
        await deleteFromSupabase(oldNews.image_url, 'news');
      }
      // Upload gambar baru
      imageUrl = await uploadToSupabase(req.file, 'news');
    }

    // Jika judul berubah, ubah slug
    if (title && title !== oldNews.title) {
      newSlug = generateSlug(title);
      const [checkSlug] = await db.query('SELECT id FROM news WHERE slug = $1 AND id != $2', [newSlug, id]);
      if (checkSlug.length > 0) {
        newSlug = `${newSlug}-${Math.floor(Math.random() * 1000)}`;
      }
    }

    const updatedTitle = title || oldNews.title;
    const updatedCategory = category || oldNews.category;
    const updatedContent = content || oldNews.content;
    const updatedPublished = is_published !== undefined ? (is_published === 'true' || is_published === true) : oldNews.is_published;

    const [rows] = await db.query(
      `UPDATE news 
       SET title = $1, slug = $2, category = $3, content = $4, image_url = $5, is_published = $6 
       WHERE id = $7 RETURNING *`,
      [updatedTitle, newSlug, updatedCategory, updatedContent, imageUrl, updatedPublished, id]
    );

    return success(res, rows[0], 'Berita berhasil diupdate');
  } catch (err) {
    console.error('Error in updateNews:', err);
    return error(res, 'Gagal mengupdate berita', 500);
  }
};

/**
 * DELETE /api/news/:id
 * Menghapus berita
 */
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM news WHERE id = $1', [id]);
    if (existing.length === 0) {
      return error(res, 'Berita tidak ditemukan', 404);
    }

    // Hapus gambar dari Supabase Storage
    if (existing[0].image_url) {
      await deleteFromSupabase(existing[0].image_url, 'news');
    }

    await db.query('DELETE FROM news WHERE id = $1', [id]);

    return success(res, null, 'Berita berhasil dihapus');
  } catch (err) {
    console.error('Error in deleteNews:', err);
    return error(res, 'Gagal menghapus berita', 500);
  }
};
