import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password || undefined,
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL idle client error:', err.message);
});

/**
 * Execute a parameterized SQL query using the shared connection pool.
 */
export function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Run multiple SQL statements inside a single atomic PostgreSQL transaction.
 * Automatically commits on success and rolls back if any error is thrown.
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify live database connectivity.
 */
export async function checkDbConnection() {
  const result = await pool.query('SELECT current_database() AS database, NOW() AS server_time');
  return result.rows[0];
}

export default pool;
