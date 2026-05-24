const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      whatsapp_number TEXT UNIQUE NOT NULL,
      google_access_token TEXT,
      google_refresh_token TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function upsertTokens(whatsappNumber, accessToken, refreshToken) {
  await pool.query(
    `INSERT INTO users (whatsapp_number, google_access_token, google_refresh_token, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (whatsapp_number)
     DO UPDATE SET
       google_access_token = EXCLUDED.google_access_token,
       google_refresh_token = COALESCE(EXCLUDED.google_refresh_token, users.google_refresh_token),
       updated_at = NOW()`,
    [whatsappNumber, accessToken, refreshToken]
  );
}

async function findUser(whatsappNumber) {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE whatsapp_number = $1",
    [whatsappNumber]
  );
  return rows[0] || null;
}

module.exports = { pool, ensureTable, upsertTokens, findUser };
