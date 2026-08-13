const db = require('../config/db');
const { uploadToSupabase, deleteFromSupabase } = require('../config/supabase');
const { success, error, validationError } = require('../utils/response');

/**
 * GET /api/galleries
 * Mendapatkan daftar galeri dengan pagination (maksimal 6 per halaman)
 */
exports.getAllGalleries = async (req, res) => {
  try {
    let { page, limit, is_published } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 6;
    if (limit > 6) limit = 6; // Maksimal 6 sesuai permintaan user
    
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM galleries';
    let countQuery = 'SELECT COUNT(*) as total FROM galleries';
    const queryParams = [];

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
    console.error('Error in getAllGalleries:', err);
    return error(res, 'Gagal mengambil data galeri', 500);
  }
};

/**
 * GET /api/galleries/:id
 * Mendapatkan detail galeri (biasanya untuk admin edit form)
 */
exports.getGalleryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM galleries WHERE id = $1', [id]);

    if (rows.length === 0) {
      return error(res, 'Galeri tidak ditemukan', 404);
    }

    return success(res, rows[0]);
  } catch (err) {
    console.error('Error in getGalleryById:', err);
    return error(res, 'Gagal mengambil detail galeri', 500);
  }
};

/**
 * POST /api/galleries
 * Tambah foto galeri baru
 */
exports.createGallery = async (req, res) => {
  try {
    const { title, description, is_published } = req.body;
    
    if (!title || !req.file) {
      return validationError(res, [{ msg: 'Judul dan foto wajib diisi' }]);
    }

    // Upload gambar
    const imageUrl = await uploadToSupabase(req.file, 'galleries');
    if (!imageUrl) {
      return error(res, 'Gagal mengupload gambar', 500);
    }

    const published = is_published === 'true' || is_published === true;

    const [rows] = await db.query(
      `INSERT INTO galleries (title, description, image_url, is_published) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, description || '', imageUrl, published]
    );

    return success(res, rows[0], 'Foto galeri berhasil ditambahkan', 201);
  } catch (err) {
    console.error('Error in createGallery:', err);
    return error(res, 'Gagal membuat galeri', 500);
  }
};

/**
 * PUT /api/galleries/:id
 * Edit info galeri
 */
exports.updateGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_published } = req.body;

    const [existing] = await db.query('SELECT * FROM galleries WHERE id = $1', [id]);
    if (existing.length === 0) {
      return error(res, 'Galeri tidak ditemukan', 404);
    }
    const oldGallery = existing[0];

    let imageUrl = oldGallery.image_url;

    if (req.file) {
      if (oldGallery.image_url) {
        await deleteFromSupabase(oldGallery.image_url, 'galleries');
      }
      imageUrl = await uploadToSupabase(req.file, 'galleries');
    }

    const updatedTitle = title || oldGallery.title;
    const updatedDesc = description !== undefined ? description : oldGallery.description;
    const updatedPublished = is_published !== undefined ? (is_published === 'true' || is_published === true) : oldGallery.is_published;

    const [rows] = await db.query(
      `UPDATE galleries 
       SET title = $1, description = $2, image_url = $3, is_published = $4 
       WHERE id = $5 RETURNING *`,
      [updatedTitle, updatedDesc, imageUrl, updatedPublished, id]
    );

    return success(res, rows[0], 'Galeri berhasil diupdate');
  } catch (err) {
    console.error('Error in updateGallery:', err);
    return error(res, 'Gagal mengupdate galeri', 500);
  }
};

/**
 * DELETE /api/galleries/:id
 * Hapus foto galeri
 */
exports.deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM galleries WHERE id = $1', [id]);
    if (existing.length === 0) {
      return error(res, 'Galeri tidak ditemukan', 404);
    }

    if (existing[0].image_url) {
      await deleteFromSupabase(existing[0].image_url, 'galleries');
    }

    await db.query('DELETE FROM galleries WHERE id = $1', [id]);

    return success(res, null, 'Foto galeri berhasil dihapus');
  } catch (err) {
    console.error('Error in deleteGallery:', err);
    return error(res, 'Gagal menghapus galeri', 500);
  }
};
