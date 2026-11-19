import pool, { withTransaction } from '../config/db.js';

/**
 * High-level KPI metrics for Admin Dashboard
 */
export async function fetchDashboardMetrics() {
  const [revenueRes, ordersCountRes, customersCountRes, lowStockCountRes, statusBreakdownRes, recentOrdersRes, lowStockItemsRes] =
    await Promise.all([
      // Gross settled revenue (orders not cancelled with paid payments)
      pool.query(`
        SELECT COALESCE(SUM(o.total_amount), 0)::numeric(12, 2) AS gross_revenue
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.status != 'cancelled' AND (p.payment_status = 'simulated_paid' OR o.status = 'delivered');
      `),
      // Total orders
      pool.query(`
        SELECT COUNT(*)::int AS total_orders FROM orders;
      `),
      // Total active customers
      pool.query(`
        SELECT COUNT(*)::int AS total_customers FROM users WHERE role = 'customer' AND is_active = true;
      `),
      // Low stock count
      pool.query(`
        SELECT COUNT(*)::int AS low_stock_count FROM products WHERE is_active = true AND stock_quantity <= low_stock_threshold;
      `),
      // Orders count by status
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM orders
        GROUP BY status;
      `),
      // Recent 5 orders with customer & payment info
      pool.query(`
        SELECT 
          o.id,
          o.order_number,
          o.total_amount,
          o.status,
          COALESCE(p.payment_status, 'pending') AS payment_status,
          COALESCE(p.payment_method, 'cash_on_delivery') AS payment_method,
          o.created_at,
          u.id AS customer_id,
          u.full_name AS customer_name,
          u.email AS customer_email,
          (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS item_count
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN payments p ON p.order_id = o.id
        ORDER BY o.created_at DESC
        LIMIT 5;
      `),
      // Top 5 low-stock products
      pool.query(`
        SELECT
          p.id,
          p.name,
          p.slug,
          p.sku,
          p.stock_quantity,
          p.low_stock_threshold,
          c.name AS category_name,
          (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = true AND p.stock_quantity <= p.low_stock_threshold
        ORDER BY p.stock_quantity ASC
        LIMIT 5;
      `),
    ]);

  const statusMap = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  statusBreakdownRes.rows.forEach((row) => {
    statusMap[row.status] = row.count;
  });

  return {
    kpis: {
      grossRevenue: parseFloat(revenueRes.rows[0].gross_revenue),
      totalOrders: ordersCountRes.rows[0].total_orders,
      activeCustomers: customersCountRes.rows[0].total_customers,
      lowStockProducts: lowStockCountRes.rows[0].low_stock_count,
    },
    ordersByStatus: statusMap,
    recentOrders: recentOrdersRes.rows.map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      customer: {
        id: row.customer_id,
        fullName: row.customer_name,
        email: row.customer_email,
      },
      itemCount: row.item_count,
    })),
    lowStockItems: lowStockItemsRes.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      stockQuantity: row.stock_quantity,
      lowStockThreshold: row.low_stock_threshold,
      categoryName: row.category_name,
      primaryImage: row.primary_image,
    })),
  };
}

/**
 * Sales timeline and category distribution for the last N days
 */
export async function fetchSalesSummary(days = 30) {
  const [dailyTimelineRes, topProductsRes, categoryRevRes] = await Promise.all([
    // Daily sales aggregates
    pool.query(
      `
      SELECT
        TO_CHAR(DATE(o.created_at), 'YYYY-MM-DD') AS sale_date,
        COUNT(o.id)::int AS orders_count,
        COALESCE(SUM(o.total_amount), 0)::numeric(12, 2) AS revenue
      FROM orders o
      WHERE o.status != 'cancelled'
        AND o.created_at >= NOW() - ($1 || ' days')::interval
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date ASC;
    `,
      [days]
    ),
    // Top 5 selling products
    pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.slug,
        c.name AS category_name,
        SUM(oi.quantity)::int AS units_sold,
        SUM(oi.line_total)::numeric(12, 2) AS total_revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE o.status != 'cancelled'
        AND o.created_at >= NOW() - ($1 || ' days')::interval
      GROUP BY p.id, p.name, p.slug, c.name
      ORDER BY units_sold DESC
      LIMIT 5;
    `,
      [days]
    ),
    // Revenue by category
    pool.query(
      `
      SELECT
        c.id,
        c.name AS category_name,
        COUNT(DISTINCT o.id)::int AS orders_count,
        COALESCE(SUM(oi.line_total), 0)::numeric(12, 2) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE o.status != 'cancelled'
        AND o.created_at >= NOW() - ($1 || ' days')::interval
      GROUP BY c.id, c.name
      ORDER BY revenue DESC;
    `,
      [days]
    ),
  ]);

  return {
    days,
    dailyTimeline: dailyTimelineRes.rows.map((r) => ({
      date: r.sale_date,
      ordersCount: r.orders_count,
      revenue: parseFloat(r.revenue),
    })),
    topProducts: topProductsRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      categoryName: r.category_name,
      unitsSold: r.units_sold,
      totalRevenue: parseFloat(r.total_revenue),
    })),
    categoryRevenue: categoryRevRes.rows.map((r) => ({
      id: r.id,
      name: r.category_name,
      ordersCount: r.orders_count,
      revenue: parseFloat(r.revenue),
    })),
  };
}

/**
 * Filterable, paginated orders list for admin
 */
export async function findAdminOrders({ status, search, page = 1, limit = 15 }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (status && status !== 'all') {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const searchIdx = params.length;
    conditions.push(`(
      o.order_number ILIKE $${searchIdx}
      OR u.full_name ILIKE $${searchIdx}
      OR u.email ILIKE $${searchIdx}
    )`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ${whereClause};
  `;
  const countRes = await pool.query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;

  const dataParams = [...params, limit, offset];
  const dataQuery = `
    SELECT
      o.id,
      o.order_number,
      o.subtotal,
      o.shipping_fee,
      o.tax_amount,
      o.total_amount,
      o.status,
      COALESCE(p.payment_status, 'pending') AS payment_status,
      COALESCE(p.payment_method, 'cash_on_delivery') AS payment_method,
      o.shipping_address_snapshot,
      o.notes,
      o.created_at,
      o.updated_at,
      u.id AS customer_id,
      u.full_name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS item_count
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN payments p ON p.order_id = o.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
  `;

  const dataRes = await pool.query(dataQuery, dataParams);

  return {
    orders: dataRes.rows.map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      subtotal: parseFloat(row.subtotal),
      shippingFee: parseFloat(row.shipping_fee),
      taxAmount: parseFloat(row.tax_amount),
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      shippingAddressSnapshot: row.shipping_address_snapshot,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      customer: {
        id: row.customer_id,
        fullName: row.customer_name,
        email: row.customer_email,
        phone: row.customer_phone,
      },
      itemCount: row.item_count,
    })),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Admin updates order status.
 * If status changed to 'cancelled', restores product inventory atomically.
 * If status changed to 'delivered' and payment was COD, marks payment 'simulated_paid'.
 */
export async function updateOrderStatusModel(orderId, nextStatus) {
  return await withTransaction(async (client) => {
    // 1. Fetch current order with row lock on orders table
    const currentOrderRes = await client.query(
      `SELECT o.id, o.order_number, o.status, p.payment_status, p.payment_method
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1 FOR UPDATE OF o;`,
      [orderId]
    );

    if (currentOrderRes.rows.length === 0) {
      return null;
    }

    const currentOrder = currentOrderRes.rows[0];

    // Cannot change status if already cancelled
    if (currentOrder.status === 'cancelled') {
      const err = new Error('Cannot change status of an already cancelled order.');
      err.statusCode = 400;
      throw err;
    }

    // If cancelling, restore inventory and update payment
    if (nextStatus === 'cancelled') {
      const itemsRes = await client.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1;`,
        [orderId]
      );

      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE products 
           SET stock_quantity = stock_quantity + $1, updated_at = NOW() 
           WHERE id = $2;`,
          [item.quantity, item.product_id]
        );
      }

      if (currentOrder.payment_status) {
        const nextPaymentStatus =
          currentOrder.payment_status === 'simulated_paid' ? 'refunded' : 'failed';
        await client.query(
          `UPDATE payments SET payment_status = $1, updated_at = NOW() WHERE order_id = $2;`,
          [nextPaymentStatus, orderId]
        );
      }

      const updateRes = await client.query(
        `
        UPDATE orders
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1
        RETURNING id, order_number, status, updated_at;
      `,
        [orderId]
      );

      return {
        ...updateRes.rows[0],
        paymentStatus:
          currentOrder.payment_status === 'simulated_paid' ? 'refunded' : 'failed',
      };
    }

    // If delivering a COD order, mark payment as completed (simulated_paid)
    let newPaymentStatus = currentOrder.payment_status;
    if (nextStatus === 'delivered' && currentOrder.payment_method === 'cash_on_delivery') {
      newPaymentStatus = 'simulated_paid';
      await client.query(
        `UPDATE payments SET payment_status = 'simulated_paid', paid_at = NOW(), updated_at = NOW() WHERE order_id = $1;`,
        [orderId]
      );
    }

    const updateRes = await client.query(
      `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, order_number, status, updated_at;
    `,
      [nextStatus, orderId]
    );

    return {
      ...updateRes.rows[0],
      paymentStatus: newPaymentStatus,
    };
  });
}

/**
 * Paginated list of registered customers with lifetime metrics
 */
export async function findAdminCustomers({ search, page = 1, limit = 15 }) {
  const offset = (page - 1) * limit;
  const conditions = ["u.role = 'customer'"];
  const params = [];

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.phone ILIKE $${idx})`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM users u ${whereClause};`,
    params
  );
  const total = countRes.rows[0]?.total || 0;

  const dataParams = [...params, limit, offset];
  const query = `
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.is_active,
      u.created_at,
      COUNT(DISTINCT o.id)::int AS total_orders,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0)::numeric(12, 2) AS lifetime_spend
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    ${whereClause}
    GROUP BY u.id, u.full_name, u.email, u.phone, u.is_active, u.created_at
    ORDER BY u.created_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
  `;

  const dataRes = await pool.query(query, dataParams);

  return {
    customers: dataRes.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      isActive: row.is_active,
      createdAt: row.created_at,
      totalOrders: row.total_orders,
      lifetimeSpend: parseFloat(row.lifetime_spend),
    })),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Toggle customer account active status (Admin only)
 */
export async function setCustomerActiveStatus(customerId, isActive) {
  const res = await pool.query(
    `
    UPDATE users
    SET is_active = $1, updated_at = NOW()
    WHERE id = $2 AND role = 'customer'
    RETURNING id, full_name, email, role, is_active, updated_at;
  `,
    [isActive, customerId]
  );

  return res.rows[0] || null;
}

/**
 * Quick inline inventory & threshold update
 */
export async function setProductInventory(productId, stockQuantity, lowStockThreshold) {
  const query =
    lowStockThreshold !== undefined
      ? `UPDATE products SET stock_quantity = $1, low_stock_threshold = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, sku, stock_quantity, low_stock_threshold;`
      : `UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, sku, stock_quantity, low_stock_threshold;`;

  const params =
    lowStockThreshold !== undefined
      ? [stockQuantity, lowStockThreshold, productId]
      : [stockQuantity, productId];

  const res = await pool.query(query, params);
  return res.rows[0] || null;
}
