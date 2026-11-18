import { query, withTransaction } from '../config/db.js';

const SORT_MAP = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
  rating_desc: 'average_rating DESC, review_count DESC, p.created_at DESC',
};

function mapProductSummary(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    shortDescription: row.short_description,
    description: row.description,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price !== null ? Number(row.compare_at_price) : null,
    stockQuantity: row.stock_quantity,
    lowStockThreshold: row.low_stock_threshold,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    deletedAt: row.deleted_at,
    primaryImage: row.primary_image || null,
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
    },
    averageRating: Number(row.average_rating || 0),
    reviewCount: Number(row.review_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProductImage(row) {
  return {
    id: row.id,
    imageUrl: row.image_url,
    altText: row.alt_text,
    isPrimary: row.is_primary,
    sortOrder: row.sort_order,
  };
}

export async function findProducts({
  search,
  category,
  minPrice,
  maxPrice,
  minRating,
  inStock,
  featured,
  includeInactive = false,
  status,
  lowStock,
  sort = 'newest',
  page = 1,
  limit = 12,
} = {}) {
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push('p.is_active = TRUE AND p.deleted_at IS NULL');
  } else if (status === 'active') {
    conditions.push('p.is_active = TRUE AND p.deleted_at IS NULL');
  } else if (status === 'archived') {
    conditions.push('(p.is_active = FALSE OR p.deleted_at IS NOT NULL)');
  }

  if (search) {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    conditions.push(
      `(p.name ILIKE $${idx} OR p.short_description ILIKE $${idx} OR p.description ILIKE $${idx} OR p.sku ILIKE $${idx})`
    );
  }

  if (category) {
    if (/^\d+$/.test(String(category))) {
      params.push(Number(category));
      conditions.push(`p.category_id = $${params.length}`);
    } else {
      params.push(String(category).trim().toLowerCase());
      conditions.push(`c.slug = $${params.length}`);
    }
  }

  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    params.push(Number(minPrice));
    conditions.push(`p.price >= $${params.length}`);
  }

  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    params.push(Number(maxPrice));
    conditions.push(`p.price <= $${params.length}`);
  }

  if (inStock === true || inStock === 'true') {
    conditions.push('p.stock_quantity > 0');
  }

  if (featured === true || featured === 'true') {
    conditions.push('p.is_featured = TRUE');
  }

  if (lowStock === true || lowStock === 'true') {
    conditions.push('p.stock_quantity <= p.low_stock_threshold');
  }

  if (minRating !== undefined && minRating !== null && minRating !== '') {
    params.push(Number(minRating));
    conditions.push(`COALESCE(rv.average_rating, 0) >= $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = SORT_MAP[sort] || SORT_MAP.newest;
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const baseFrom = `
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
      LIMIT 1
    ) img ON TRUE
    LEFT JOIN (
      SELECT product_id,
             ROUND(AVG(rating)::numeric, 2) AS average_rating,
             COUNT(*)::int AS review_count
      FROM reviews
      GROUP BY product_id
    ) rv ON rv.product_id = p.id
  `;

  const countRes = await query(`SELECT COUNT(*)::int AS total ${baseFrom} ${whereClause}`, params);
  const total = countRes.rows[0].total;

  params.push(safeLimit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const rowsRes = await query(
    `SELECT p.*,
            c.name AS category_name,
            c.slug AS category_slug,
            img.image_url AS primary_image,
            COALESCE(rv.average_rating, 0) AS average_rating,
            COALESCE(rv.review_count, 0) AS review_count
     ${baseFrom}
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return {
    products: rowsRes.rows.map(mapProductSummary),
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function findProductByIdOrSlug(idOrSlug, { includeInactive = false } = {}) {
  const isNumericId = /^\d+$/.test(String(idOrSlug));
  const lookupCondition = isNumericId ? 'p.id = $1' : 'p.slug = $1';
  const activeCondition = includeInactive ? '' : 'AND p.is_active = TRUE AND p.deleted_at IS NULL';
  const lookupParam = isNumericId ? Number(idOrSlug) : String(idOrSlug).trim().toLowerCase();

  const productRes = await query(
    `SELECT p.*,
            c.name AS category_name,
            c.slug AS category_slug,
            COALESCE(rv.average_rating, 0) AS average_rating,
            COALESCE(rv.review_count, 0) AS review_count
     FROM products p
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN (
       SELECT product_id,
              ROUND(AVG(rating)::numeric, 2) AS average_rating,
              COUNT(*)::int AS review_count
       FROM reviews
       GROUP BY product_id
     ) rv ON rv.product_id = p.id
     WHERE ${lookupCondition} ${activeCondition}`,
    [lookupParam]
  );

  const row = productRes.rows[0];
  if (!row) return null;

  const imagesRes = await query(
    `SELECT id, image_url, alt_text, is_primary, sort_order
     FROM product_images
     WHERE product_id = $1
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [row.id]
  );

  const images = imagesRes.rows.map(mapProductImage);
  const product = mapProductSummary({
    ...row,
    primary_image: images[0]?.imageUrl || null,
  });
  product.images = images;

  return product;
}

export async function findRelatedProducts(categoryId, excludeProductId, limit = 4) {
  const res = await query(
    `SELECT p.*,
            c.name AS category_name,
            c.slug AS category_slug,
            img.image_url AS primary_image,
            COALESCE(rv.average_rating, 0) AS average_rating,
            COALESCE(rv.review_count, 0) AS review_count
     FROM products p
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN LATERAL (
       SELECT image_url
       FROM product_images pi
       WHERE pi.product_id = p.id
       ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
       LIMIT 1
     ) img ON TRUE
     LEFT JOIN (
       SELECT product_id,
              ROUND(AVG(rating)::numeric, 2) AS average_rating,
              COUNT(*)::int AS review_count
       FROM reviews
       GROUP BY product_id
     ) rv ON rv.product_id = p.id
     WHERE p.category_id = $1
       AND p.id <> $2
       AND p.is_active = TRUE
       AND p.deleted_at IS NULL
     ORDER BY p.is_featured DESC, p.created_at DESC
     LIMIT $3`,
    [categoryId, excludeProductId, limit]
  );

  return res.rows.map(mapProductSummary);
}

async function replaceProductImages(client, productId, images, fallbackAlt) {
  await client.query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  if (!images || images.length === 0) return;

  // Guarantee at most one primary image (defaulting to the first image if none marked primary)
  const explicitPrimaryIdx = images.findIndex((img) => Boolean(img.isPrimary));
  const primaryIdx = explicitPrimaryIdx >= 0 ? explicitPrimaryIdx : 0;

  for (let i = 0; i < images.length; i += 1) {
    const img = images[i];
    await client.query(
      `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        productId,
        img.imageUrl.trim(),
        img.altText?.trim() || fallbackAlt,
        i === primaryIdx,
        i,
      ]
    );
  }
}

export async function createProductWithImages(payload) {
  const createdId = await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO products (
         category_id, name, slug, sku, short_description, description,
         price, compare_at_price, stock_quantity, low_stock_threshold, is_featured, is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        payload.categoryId,
        payload.name.trim(),
        payload.slug,
        payload.sku.trim().toUpperCase(),
        payload.shortDescription ? payload.shortDescription.trim() : null,
        payload.description.trim(),
        payload.price,
        payload.compareAtPrice ?? null,
        payload.stockQuantity,
        payload.lowStockThreshold ?? 5,
        Boolean(payload.isFeatured),
        payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      ]
    );
    const productId = res.rows[0].id;

    if (Array.isArray(payload.images) && payload.images.length > 0) {
      await replaceProductImages(client, productId, payload.images, payload.name.trim());
    }

    return productId;
  });

  return findProductByIdOrSlug(createdId, { includeInactive: true });
}

export async function updateProductWithImages(productId, payload) {
  const exists = await withTransaction(async (client) => {
    const currentRes = await client.query(`SELECT * FROM products WHERE id = $1`, [productId]);
    const current = currentRes.rows[0];
    if (!current) return false;

    const nextIsActive =
      payload.isActive !== undefined ? Boolean(payload.isActive) : current.is_active;
    const nextDeletedAt = nextIsActive ? null : current.deleted_at || new Date();

    await client.query(
      `UPDATE products
       SET category_id         = $1,
           name                = $2,
           slug                = $3,
           sku                 = $4,
           short_description   = $5,
           description         = $6,
           price               = $7,
           compare_at_price    = $8,
           stock_quantity      = $9,
           low_stock_threshold = $10,
           is_featured         = $11,
           is_active           = $12,
           deleted_at          = $13
       WHERE id = $14`,
      [
        payload.categoryId ?? current.category_id,
        payload.name !== undefined ? payload.name.trim() : current.name,
        payload.slug ?? current.slug,
        payload.sku !== undefined ? payload.sku.trim().toUpperCase() : current.sku,
        payload.shortDescription !== undefined
          ? payload.shortDescription
            ? payload.shortDescription.trim()
            : null
          : current.short_description,
        payload.description !== undefined ? payload.description.trim() : current.description,
        payload.price !== undefined ? payload.price : current.price,
        payload.compareAtPrice !== undefined ? payload.compareAtPrice : current.compare_at_price,
        payload.stockQuantity !== undefined ? payload.stockQuantity : current.stock_quantity,
        payload.lowStockThreshold !== undefined
          ? payload.lowStockThreshold
          : current.low_stock_threshold,
        payload.isFeatured !== undefined ? Boolean(payload.isFeatured) : current.is_featured,
        nextIsActive,
        nextDeletedAt,
        productId,
      ]
    );

    if (Array.isArray(payload.images)) {
      const nextName = payload.name !== undefined ? payload.name.trim() : current.name;
      await replaceProductImages(client, productId, payload.images, nextName);
    }

    return true;
  });

  if (!exists) return null;
  return findProductByIdOrSlug(productId, { includeInactive: true });
}

export async function updateProductInventory(productId, { stockQuantity, lowStockThreshold }) {
  const res = await query(
    `UPDATE products
     SET stock_quantity      = $1,
         low_stock_threshold = COALESCE($2, low_stock_threshold)
     WHERE id = $3
     RETURNING id`,
    [stockQuantity, lowStockThreshold ?? null, productId]
  );

  if (res.rowCount === 0) return null;
  return findProductByIdOrSlug(productId, { includeInactive: true });
}

/**
 * Safeguarded product deletion:
 * - Soft-deletes (is_active = FALSE, deleted_at = NOW()) if the product appears in any historical order.
 * - Hard-deletes only when never ordered.
 */
export async function deleteProductSafely(productId) {
  return withTransaction(async (client) => {
    const checkRes = await client.query(`SELECT id, name FROM products WHERE id = $1`, [productId]);
    if (!checkRes.rows[0]) return null;

    const orderRefRes = await client.query(
      `SELECT EXISTS(SELECT 1 FROM order_items WHERE product_id = $1) AS has_orders`,
      [productId]
    );

    if (orderRefRes.rows[0].has_orders) {
      await client.query(
        `UPDATE products
         SET is_active = FALSE, deleted_at = NOW()
         WHERE id = $1`,
        [productId]
      );
      await client.query(`DELETE FROM cart_items WHERE product_id = $1`, [productId]);
      return { deletionType: 'soft', productName: checkRes.rows[0].name };
    }

    await client.query(`DELETE FROM products WHERE id = $1`, [productId]);
    return { deletionType: 'hard', productName: checkRes.rows[0].name };
  });
}
