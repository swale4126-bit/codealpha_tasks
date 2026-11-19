import { query, withTransaction } from '../config/db.js';

export const FREE_SHIPPING_THRESHOLD = 100;
export const STANDARD_SHIPPING_FEE = 9.99;
export const TAX_RATE = 0.08;

export function calculateTotals(subtotal) {
  const cleanSubtotal = Number(Number(subtotal || 0).toFixed(2));
  const shippingFee =
    cleanSubtotal === 0 || cleanSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const taxAmount = Number((cleanSubtotal * TAX_RATE).toFixed(2));
  const totalAmount = Number((cleanSubtotal + shippingFee + taxAmount).toFixed(2));
  return { subtotal: cleanSubtotal, shippingFee, taxAmount, totalAmount };
}

export async function getOrCreateCartId(userId, dbClient = null) {
  const exec = dbClient ? dbClient.query.bind(dbClient) : query;
  const existing = await exec(`SELECT id FROM carts WHERE user_id = $1`, [userId]);
  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const inserted = await exec(
    `INSERT INTO carts (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [userId]
  );
  return inserted.rows[0].id;
}

export async function getCartByUserId(userId) {
  const cartId = await getOrCreateCartId(userId);
  const res = await query(
    `SELECT ci.id AS item_id,
            ci.quantity,
            p.id AS product_id,
            p.name,
            p.slug,
            p.sku,
            p.price,
            p.compare_at_price,
            p.stock_quantity,
            p.is_active,
            p.deleted_at,
            img.image_url AS primary_image
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN LATERAL (
       SELECT image_url
       FROM product_images pi
       WHERE pi.product_id = p.id
       ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
       LIMIT 1
     ) img ON TRUE
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC, ci.id ASC`,
    [cartId]
  );

  const items = res.rows.map((row) => {
    const price = Number(row.price);
    return {
      itemId: row.item_id,
      productId: row.product_id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      price,
      compareAtPrice: row.compare_at_price !== null ? Number(row.compare_at_price) : null,
      stockQuantity: row.stock_quantity,
      isAvailable: row.is_active && row.deleted_at === null && row.stock_quantity > 0,
      primaryImage: row.primary_image || null,
      quantity: row.quantity,
      lineTotal: Number((price * row.quantity).toFixed(2)),
    };
  });

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totals = calculateTotals(rawSubtotal);

  return {
    cartId,
    items,
    itemCount,
    ...totals,
  };
}

export async function findCartItemByIdForUser(itemId, userId) {
  const res = await query(
    `SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, p.stock_quantity, p.is_active, p.deleted_at, p.name
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN products p ON p.id = ci.product_id
     WHERE ci.id = $1 AND c.user_id = $2`,
    [itemId, userId]
  );
  return res.rows[0] || null;
}

export async function findCartItemByProductForUser(productId, userId) {
  const res = await query(
    `SELECT ci.id, ci.quantity
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     WHERE ci.product_id = $1 AND c.user_id = $2`,
    [productId, userId]
  );
  return res.rows[0] || null;
}

export async function upsertCartItemForUser(userId, productId, quantity) {
  const cartId = await getOrCreateCartId(userId);
  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id)
     DO UPDATE SET quantity = $3`,
    [cartId, productId, quantity]
  );
  return getCartByUserId(userId);
}

export async function updateCartItemQuantityForUser(itemId, userId, quantity) {
  const res = await query(
    `UPDATE cart_items ci
     SET quantity = $1
     FROM carts c
     WHERE ci.id = $2 AND ci.cart_id = c.id AND c.user_id = $3
     RETURNING ci.id`,
    [quantity, itemId, userId]
  );
  if (res.rowCount === 0) return null;
  return getCartByUserId(userId);
}

export async function removeCartItemForUser(itemId, userId) {
  const res = await query(
    `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.id = $1 AND ci.cart_id = c.id AND c.user_id = $2
     RETURNING ci.id`,
    [itemId, userId]
  );
  if (res.rowCount === 0) return null;
  return getCartByUserId(userId);
}

export async function clearCartForUser(userId) {
  const cartId = await getOrCreateCartId(userId);
  await query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
  return getCartByUserId(userId);
}

export async function mergeItemsIntoUserCart(userId, guestItems) {
  await withTransaction(async (client) => {
    const cartId = await getOrCreateCartId(userId, client);

    for (const item of guestItems) {
      const prodRes = await client.query(
        `SELECT id, stock_quantity, is_active, deleted_at
         FROM products
         WHERE id = $1`,
        [item.productId]
      );
      const product = prodRes.rows[0];
      if (!product || !product.is_active || product.deleted_at !== null || product.stock_quantity <= 0) {
        continue;
      }

      const existingRes = await client.query(
        `SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
        [cartId, item.productId]
      );
      const currentQty = existingRes.rows[0]?.quantity || 0;
      const mergedQty = Math.min(currentQty + Number(item.quantity), product.stock_quantity);

      if (mergedQty > 0) {
        await client.query(
          `INSERT INTO cart_items (cart_id, product_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (cart_id, product_id)
           DO UPDATE SET quantity = $3`,
          [cartId, item.productId, mergedQty]
        );
      }
    }
  });

  return getCartByUserId(userId);
}
