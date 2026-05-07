const bcrypt = require('bcrypt');
const pool = require('../config/db');

const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trackings (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(150) NOT NULL,
      cpf VARCHAR(14) NOT NULL,
      tracking_code VARCHAR(50) NOT NULL UNIQUE,
      origin_state VARCHAR(100) NOT NULL,
      destination_state VARCHAR(100) NOT NULL,
      street VARCHAR(150) NOT NULL,
      address_number VARCHAR(50) NOT NULL,
      cep VARCHAR(9) NOT NULL,
      estimated_delivery_at TIMESTAMP NOT NULL,
      current_status VARCHAR(100) NOT NULL,
      observations TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tracking_history (
      id SERIAL PRIMARY KEY,
      tracking_id INTEGER NOT NULL REFERENCES trackings(id) ON DELETE CASCADE,
      status VARCHAR(100) NOT NULL,
      note TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS set_trackings_updated_at ON trackings;
    CREATE TRIGGER set_trackings_updated_at
    BEFORE UPDATE ON trackings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS trackings
    ALTER COLUMN address_number TYPE VARCHAR(50);

    ALTER TABLE IF EXISTS trackings
    ALTER COLUMN address_number SET NOT NULL;

    ALTER TABLE IF EXISTS trackings
    ALTER COLUMN current_status TYPE VARCHAR(255);

    ALTER TABLE IF EXISTS tracking_history
    ALTER COLUMN status TYPE VARCHAR(255);
  `);

  const existingAdmin = await pool.query(
    'SELECT id FROM admins WHERE username = $1 LIMIT 1',
    [DEFAULT_ADMIN_USERNAME]
  );

  if (existingAdmin.rowCount === 0) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
      [DEFAULT_ADMIN_USERNAME, passwordHash]
    );

    console.log(`Admin inicial criado: ${DEFAULT_ADMIN_USERNAME}`);
  }
}

module.exports = ensureSchema;
