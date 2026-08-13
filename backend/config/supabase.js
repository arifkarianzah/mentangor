const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const useSupabase = supabaseUrl && supabaseKey && !supabaseUrl.includes('dummy');

let supabase = null;

if (useSupabase) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.log('ℹ️  Supabase tidak dikonfigurasi — menggunakan penyimpanan file lokal (/uploads/)');
}

// Pastikan folder uploads ada
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/**
 * Upload file ke Supabase Storage, atau simpan lokal jika Supabase tidak terkonfigurasi
 */
const uploadToSupabase = async (file, bucket) => {
  // --- PENYIMPANAN LOKAL (fallback) ---
  if (!useSupabase) {
    try {
      const bucketDir = path.join(UPLOADS_DIR, bucket);
      if (!fs.existsSync(bucketDir)) fs.mkdirSync(bucketDir, { recursive: true });

      const ext = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;
      const filePath = path.join(bucketDir, fileName);

      fs.writeFileSync(filePath, file.buffer);

      // Return URL relatif yang bisa diakses via Live Server atau Express /uploads route
      return `uploads/${bucket}/${fileName}`;
    } catch (err) {
      console.error('Local upload error:', err);
      return null;
    }
  }

  // --- SUPABASE STORAGE ---
  try {
    const ext = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicData.publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return null;
  }
};

/**
 * Hapus file dari Supabase Storage atau lokal
 */
const deleteFromSupabase = async (publicUrl, bucket) => {
  if (!publicUrl) return;

  // Hapus file lokal
  if (!useSupabase || publicUrl.startsWith('uploads/')) {
    try {
      const filePath = path.join(__dirname, '..', '..', publicUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Local delete error:', err);
    }
    return;
  }

  // Hapus dari Supabase
  try {
    const urlParts = publicUrl.split(`/public/${bucket}/`);
    if (urlParts.length === 2) {
      const fileName = urlParts[1];
      await supabase.storage.from(bucket).remove([fileName]);
    }
  } catch (error) {
    console.error('Failed to delete image from Supabase:', error);
  }
};

module.exports = {
  supabase,
  uploadToSupabase,
  deleteFromSupabase
};
