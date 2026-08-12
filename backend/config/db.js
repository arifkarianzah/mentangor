const { Pool } = require('pg');
const { mockQuery } = require('./mockDb');
require('dotenv').config();

// Konfigurasi PostgreSQL (Supabase)
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase') 
       ? { rejectUnauthorized: false } 
       : undefined
};

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool(dbConfig);
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

// Wrapper transparan untuk migrasi MySQL ke PostgreSQL
const db = {
  query: async (sql, params = []) => {
    if (pool) {
      try {
        // Konversi sintaks ? (MySQL) menjadi $1, $2 (PostgreSQL)
        let pgSql = sql;
        let index = 1;
        pgSql = pgSql.replace(/\?/g, () => `$${index++}`);

        // Jika INSERT dan belum ada RETURNING, tambahkan otomatis (untuk mensimulasikan insertId)
        const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
        if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
          pgSql += ' RETURNING id';
        }

        const res = await pool.query(pgSql, params);

        // Jika query memodifikasi data (INSERT/UPDATE/DELETE), kembalikan format object seperti MySQL (ResultSetHeader)
        if (res.command === 'INSERT' || res.command === 'UPDATE' || res.command === 'DELETE') {
          return [{
            insertId: res.rows && res.rows.length > 0 ? res.rows[0].id : null,
            affectedRows: res.rowCount
          }];
        }

        // Jika SELECT, kembalikan array rows
        return [res.rows];
      } catch (err) {
        console.error('PostgreSQL query error, fallback ke in-memory mock:', err.message);
        console.error('Failed Query:', sql);
        return await mockQuery(sql, params);
      }
    }
    return await mockQuery(sql, params);
  },
  execute: async (sql, params = []) => {
    return db.query(sql, params);
  },
  getConnection: async () => {
    if (pool) {
      const client = await pool.connect();
      return {
        query: async (sql, params) => {
          let pgSql = sql;
          let index = 1;
          pgSql = pgSql.replace(/\?/g, () => `$${index++}`);
          
          const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
          if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
            pgSql += ' RETURNING id';
          }
          
          const res = await client.query(pgSql, params);
          if (res.command === 'INSERT' || res.command === 'UPDATE' || res.command === 'DELETE') {
            return [{ insertId: res.rows[0]?.id, affectedRows: res.rowCount }];
          }
          return [res.rows];
        },
        release: () => client.release(),
        beginTransaction: async () => await client.query('BEGIN'),
        commit: async () => await client.query('COMMIT'),
        rollback: async () => await client.query('ROLLBACK')
      };
    }
    return {
      query: db.query,
      release: () => {},
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {}
    };
  }
};

module.exports = db;
