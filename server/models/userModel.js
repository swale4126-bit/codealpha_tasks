import { query, withTransaction } from '../config/db.js';

function mapPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserByEmailWithPassword(email) {
  const result = await query(
    `SELECT id, full_name, email, password_hash, phone, role, is_active, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...mapPublicUser(row),
    passwordHash: row.password_hash,
  };
}

export async function findUserById(id) {
  const result = await query(
    `SELECT id, full_name, email, phone, role, is_active, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return mapPublicUser(result.rows[0]);
}

export async function findUserByIdWithPassword(id) {
  const result = await query(
    `SELECT id, full_name, email, password_hash, phone, role, is_active, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...mapPublicUser(row),
    passwordHash: row.password_hash,
  };
}

/**
 * Creates a new customer user and initializes their persistent cart in one atomic transaction.
 */
export async function createUserWithCart({ fullName, email, passwordHash, phone = null }) {
  return withTransaction(async (client) => {
    const userRes = await client.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, full_name, email, phone, role, is_active, created_at, updated_at`,
      [fullName.trim(), email.toLowerCase(), passwordHash, phone ? phone.trim() : null]
    );
    const user = mapPublicUser(userRes.rows[0]);

    await client.query(`INSERT INTO carts (user_id) VALUES ($1)`, [user.id]);

    return user;
  });
}

export async function updateUserProfile(userId, { fullName, phone }) {
  const result = await query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         phone     = COALESCE($2, phone)
     WHERE id = $3
     RETURNING id, full_name, email, phone, role, is_active, created_at, updated_at`,
    [fullName !== undefined ? fullName.trim() : null, phone !== undefined ? phone.trim() : null, userId]
  );
  return mapPublicUser(result.rows[0]);
}

export async function updateUserPassword(userId, passwordHash) {
  await query(
    `UPDATE users
     SET password_hash = $1
     WHERE id = $2`,
    [passwordHash, userId]
  );
}
