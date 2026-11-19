import { query, withTransaction } from '../config/db.js';
import { calculateTotals, getOrCreateCartId } from './cartModel.js';
import AppError from '../utils/AppError.js';

function mapOrderItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name_snapshot,
    sku: row.product_sku_snapshot,
    primaryImage: row.product_image_snapshot,
    unitPrice: Number(row.unit_price_snapshot),
    quantity: row.quantity,
    lineTotal: Number(row.line_total),
  };
}

function mapPayment(row) {
  if (!row || !row.payment_id) return null;
  return {
    id: row.payment_id,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    amount: Number(row.payment_amount),
    transactionRef: row.transaction_ref,
    paidAt: row.paid_at,
    createdAt: row.payment_created_at,
  };
}

function mapOrder(row, items = [], payment = null) {
  if (!row) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerName: row.customer_name || null,
    customerEmail: row.customer_email || null,
    status: row.status,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    taxAmount: Number(row.tax_amount),
    totalAmount: Number(row.total_amount),
    shippingAddress: row.shipping_address_snapshot,
    notes: row.notes,
    itemsCount: row.items_count !== undefined ? Number(row.items_count) : items.length,
    items,
    payment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `KM-${year}-${rand}`;
}

export async function createOrderFromCart({
  userId,
  shippingAddress,
  paymentMethod,
  notes = null,
}) {
  return withTransaction(async (client) => {
    // 1. Fetch user's cart with row lock on cart items
    const cartId = await getOrCreateCartId(userId, client);
    const cartItemsRes = await client.query(
      `SELECT ci.id, ci.product_id, ci.quantity
       FROM cart_items ci
       WHERE ci.cart_id = $1
       ORDER BY ci.id ASC`,
      [cartId]
    );

    if (cartItemsRes.rows.length === 0) {
      throw new AppError(400, 'Your shopping cart is empty.');
    }

    const orderLines = [];
    let rawSubtotal = 0;

    // 2. Lock products and verify live inventory
    for (const item of cartItemsRes.rows) {
      const prodRes = await client.query(
        `SELECT id, name, sku, price, stock_quantity, is_active, deleted_at
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [item.product_id]
      );

      const product = prodRes.rows[0];
      if (!product || !product.is_active || product.deleted_at !== null) {
        throw new AppError(400, `One or more products in your cart are no longer available.`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for "${product.name}". Only ${product.stock_quantity} available.`
        );
      }

      // Deduct stock quantity atomically
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
        [item.quantity, product.id]
      );

      const imgRes = await client.query(
        `SELECT image_url
         FROM product_images
         WHERE product_id = $1
         ORDER BY is_primary DESC, sort_order ASC, id ASC
         LIMIT 1`,
        [product.id]
      );

      const unitPrice = Number(product.price);
      const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
      rawSubtotal += lineTotal;

      orderLines.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        primaryImage: imgRes.rows[0]?.image_url || null,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    // 3. Compute immutable order totals
    const { subtotal, shippingFee, taxAmount, totalAmount } = calculateTotals(rawSubtotal);
    const orderNumber = generateOrderNumber();

    // 4. Insert order header record
    const orderRes = await client.query(
      `INSERT INTO orders (
         order_number, user_id, status, subtotal, shipping_fee, tax_amount, total_amount,
         shipping_address_snapshot, notes
       )
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8)
       RETURNING id, order_number, user_id, status, subtotal, shipping_fee, tax_amount,
                 total_amount, shipping_address_snapshot, notes, created_at, updated_at`,
      [
        orderNumber,
        userId,
        subtotal,
        shippingFee,
        taxAmount,
        totalAmount,
        JSON.stringify(shippingAddress),
        notes ? notes.trim() : null,
      ]
    );
    const order = orderRes.rows[0];

    // 5. Insert frozen order items
    const insertedItems = [];
    for (const line of orderLines) {
      const itemRes = await client.query(
        `INSERT INTO order_items (
           order_id, product_id, product_name_snapshot, product_sku_snapshot,
           product_image_snapshot, unit_price_snapshot, quantity, line_total
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, product_id, product_name_snapshot, product_sku_snapshot,
                   product_image_snapshot, unit_price_snapshot, quantity, line_total`,
        [
          order.id,
          line.productId,
          line.name,
          line.sku,
          line.primaryImage,
          line.unitPrice,
          line.quantity,
          line.lineTotal,
        ]
      );
      insertedItems.push(mapOrderItem(itemRes.rows[0]));
    }

    // 6. Insert payment record
    const isSimulatedPaid = paymentMethod === 'simulated_card';
    const paymentStatus = isSimulatedPaid ? 'simulated_paid' : 'pending';
    const transactionRef = isSimulatedPaid
      ? `SIM-${orderNumber}`
      : `COD-${orderNumber}`;
    const paidAt = isSimulatedPaid ? new Date() : null;

    const paymentRes = await client.query(
      `INSERT INTO payments (
         order_id, payment_method, payment_status, amount, transaction_ref, paid_at
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id AS payment_id, payment_method, payment_status, amount AS payment_amount,
                 transaction_ref, paid_at, created_at AS payment_created_at`,
      [order.id, paymentMethod, paymentStatus, totalAmount, transactionRef, paidAt]
    );
    const payment = mapPayment(paymentRes.rows[0]);

    // If payment was simulated as paid right away, advance order status from 'pending' to 'confirmed'
    if (isSimulatedPaid) {
      await client.query(`UPDATE orders SET status = 'confirmed' WHERE id = $1`, [order.id]);
      order.status = 'confirmed';
    }

    // 7. Clear user's cart items
    await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);

    return mapOrder(order, insertedItems, payment);
  });
}

export async function findOrdersByUserId(userId, { page = 1, limit = 10, status } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const conditions = ['o.user_id = $1'];
  const params = [userId];

  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countRes = await query(
    `SELECT COUNT(*)::int AS total FROM orders o ${whereClause}`,
    params
  );
  const total = countRes.rows[0].total;

  params.push(safeLimit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const ordersRes = await query(
    `SELECT o.*,
            p.id AS payment_id,
            p.payment_method,
            p.payment_status,
            p.amount AS payment_amount,
            p.transaction_ref,
            p.paid_at,
            p.created_at AS payment_created_at,
            COUNT(oi.id)::int AS items_count
     FROM orders o
     LEFT JOIN payments p ON p.order_id = o.id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${whereClause}
     GROUP BY o.id, p.id
     ORDER BY o.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  const orders = ordersRes.rows.map((row) => mapOrder(row, [], mapPayment(row)));

  return {
    orders,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function findOrderById(orderId, userId = null) {
  const conditions = ['o.id = $1'];
  const params = [orderId];

  if (userId !== null) {
    params.push(userId);
    conditions.push(`o.user_id = $2`);
  }

  const orderRes = await query(
    `SELECT o.*,
            u.full_name AS customer_name,
            u.email AS customer_email,
            p.id AS payment_id,
            p.payment_method,
            p.payment_status,
            p.amount AS payment_amount,
            p.transaction_ref,
            p.paid_at,
            p.created_at AS payment_created_at
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE ${conditions.join(' AND ')}`,
    params
  );

  const orderRow = orderRes.rows[0];
  if (!orderRow) return null;

  const itemsRes = await query(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
    [orderRow.id]
  );
  const items = itemsRes.rows.map(mapOrderItem);
  const payment = mapPayment(orderRow);

  return mapOrder(orderRow, items, payment);
}

export async function cancelOrderForUser(orderId, userId) {
  await withTransaction(async (client) => {
    // 1. Lock order row
    const orderRes = await client.query(
      `SELECT o.id, o.status, o.user_id
       FROM orders o
       WHERE o.id = $1 AND o.user_id = $2
       FOR UPDATE`,
      [orderId, userId]
    );

    const order = orderRes.rows[0];
    if (!order) {
      throw new AppError(404, 'Order not found.');
    }

    if (order.status !== 'pending' && order.status !== 'confirmed') {
      throw new AppError(
        400,
        `Cannot cancel an order in "${order.status}" status. Only pending or confirmed orders may be cancelled.`
      );
    }

    // 2. Restore inventory for all items in order
    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 3. Mark order as cancelled
    await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [orderId]
    );

    // 4. Update payment status if needed (refunded if simulated_paid)
    await client.query(
      `UPDATE payments
       SET payment_status = CASE WHEN payment_status = 'simulated_paid' THEN 'refunded' ELSE 'failed' END,
           updated_at = NOW()
       WHERE order_id = $1`,
      [orderId]
    );
  });

  return findOrderById(orderId, userId);
}
