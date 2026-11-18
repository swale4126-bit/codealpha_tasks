import { query, withTransaction } from '../config/db.js';

function mapAddress(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    streetLine1: row.street_line1,
    streetLine2: row.street_line2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAddressesByUserId(userId) {
  const result = await query(
    `SELECT id, user_id, label, recipient_name, phone, street_line1, street_line2,
            city, state, postal_code, country, is_default, created_at, updated_at
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return result.rows.map(mapAddress);
}

export async function findAddressByIdForUser(addressId, userId) {
  const result = await query(
    `SELECT id, user_id, label, recipient_name, phone, street_line1, street_line2,
            city, state, postal_code, country, is_default, created_at, updated_at
     FROM addresses
     WHERE id = $1 AND user_id = $2`,
    [addressId, userId]
  );
  return mapAddress(result.rows[0]);
}

export async function createAddressForUser(userId, payload) {
  return withTransaction(async (client) => {
    const countRes = await client.query(
      `SELECT COUNT(*)::int AS total FROM addresses WHERE user_id = $1`,
      [userId]
    );
    const shouldBeDefault = countRes.rows[0].total === 0 ? true : Boolean(payload.isDefault);

    if (shouldBeDefault) {
      await client.query(
        `UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE`,
        [userId]
      );
    }

    const insertRes = await client.query(
      `INSERT INTO addresses (
         user_id, label, recipient_name, phone, street_line1, street_line2,
         city, state, postal_code, country, is_default
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, user_id, label, recipient_name, phone, street_line1, street_line2,
                 city, state, postal_code, country, is_default, created_at, updated_at`,
      [
        userId,
        payload.label?.trim() || 'Home',
        payload.recipientName.trim(),
        payload.phone.trim(),
        payload.streetLine1.trim(),
        payload.streetLine2 ? payload.streetLine2.trim() : null,
        payload.city.trim(),
        payload.state.trim(),
        payload.postalCode.trim(),
        payload.country?.trim() || 'United States',
        shouldBeDefault,
      ]
    );

    return mapAddress(insertRes.rows[0]);
  });
}

export async function updateAddressForUser(addressId, userId, payload) {
  return withTransaction(async (client) => {
    const existingRes = await client.query(
      `SELECT id, is_default FROM addresses WHERE id = $1 AND user_id = $2`,
      [addressId, userId]
    );
    if (!existingRes.rows[0]) {
      return null;
    }

    const nextIsDefault =
      payload.isDefault !== undefined ? Boolean(payload.isDefault) : existingRes.rows[0].is_default;

    if (nextIsDefault) {
      await client.query(
        `UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE AND id <> $2`,
        [userId, addressId]
      );
    }

    const updateRes = await client.query(
      `UPDATE addresses
       SET label          = $1,
           recipient_name = $2,
           phone          = $3,
           street_line1   = $4,
           street_line2   = $5,
           city           = $6,
           state          = $7,
           postal_code    = $8,
           country        = $9,
           is_default     = $10
       WHERE id = $11 AND user_id = $12
       RETURNING id, user_id, label, recipient_name, phone, street_line1, street_line2,
                 city, state, postal_code, country, is_default, created_at, updated_at`,
      [
        payload.label?.trim() || 'Home',
        payload.recipientName.trim(),
        payload.phone.trim(),
        payload.streetLine1.trim(),
        payload.streetLine2 ? payload.streetLine2.trim() : null,
        payload.city.trim(),
        payload.state.trim(),
        payload.postalCode.trim(),
        payload.country?.trim() || 'United States',
        nextIsDefault,
        addressId,
        userId,
      ]
    );

    return mapAddress(updateRes.rows[0]);
  });
}

export async function setDefaultAddressForUser(addressId, userId) {
  return withTransaction(async (client) => {
    const check = await client.query(
      `SELECT id FROM addresses WHERE id = $1 AND user_id = $2`,
      [addressId, userId]
    );
    if (!check.rows[0]) {
      return null;
    }

    await client.query(
      `UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE`,
      [userId]
    );

    const updated = await client.query(
      `UPDATE addresses
       SET is_default = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, label, recipient_name, phone, street_line1, street_line2,
                 city, state, postal_code, country, is_default, created_at, updated_at`,
      [addressId, userId]
    );
    return mapAddress(updated.rows[0]);
  });
}

export async function deleteAddressForUser(addressId, userId) {
  return withTransaction(async (client) => {
    const deletedRes = await client.query(
      `DELETE FROM addresses
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_default`,
      [addressId, userId]
    );
    const deleted = deletedRes.rows[0];
    if (!deleted) {
      return false;
    }

    // If the deleted address was default, promote the newest remaining address
    if (deleted.is_default) {
      await client.query(
        `UPDATE addresses
         SET is_default = TRUE
         WHERE id = (
           SELECT id FROM addresses
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 1
         )`,
        [userId]
      );
    }

    return true;
  });
}
