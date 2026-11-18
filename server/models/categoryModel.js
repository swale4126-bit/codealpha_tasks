import { query } from '../config/db.js';

function mapCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    productCount: row.product_count !== undefined ? Number(row.product_count) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAllCategories() {
  const result = await query(
    `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.created_at, c.updated_at,
            COUNT(p.id) FILTER (WHERE p.is_active = TRUE AND p.deleted_at IS NULL)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC`
  );
  return result.rows.map(mapCategory);
}

export async function findCategoryBySlug(slug) {
  const result = await query(
    `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.created_at, c.updated_at,
            COUNT(p.id) FILTER (WHERE p.is_active = TRUE AND p.deleted_at IS NULL)::int AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     WHERE c.slug = $1
     GROUP BY c.id`,
    [slug]
  );
  return mapCategory(result.rows[0]);
}

export async function findCategoryById(id) {
  const result = await query(
    `SELECT id, name, slug, description, image_url, created_at, updated_at
     FROM categories
     WHERE id = $1`,
    [id]
  );
  return mapCategory(result.rows[0]);
}

export async function createCategory({ name, slug, description = null, imageUrl = null }) {
  const result = await query(
    `INSERT INTO categories (name, slug, description, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, slug, description, image_url, created_at, updated_at`,
    [name.trim(), slug, description ? description.trim() : null, imageUrl ? imageUrl.trim() : null]
  );
  return mapCategory(result.rows[0]);
}

export async function updateCategory(id, { name, slug, description, imageUrl }) {
  const result = await query(
    `UPDATE categories
     SET name        = COALESCE($1, name),
         slug        = COALESCE($2, slug),
         description = COALESCE($3, description),
         image_url   = COALESCE($4, image_url)
     WHERE id = $5
     RETURNING id, name, slug, description, image_url, created_at, updated_at`,
    [
      name !== undefined ? name.trim() : null,
      slug !== undefined ? slug : null,
      description !== undefined ? (description ? description.trim() : null) : null,
      imageUrl !== undefined ? (imageUrl ? imageUrl.trim() : null) : null,
      id,
    ]
  );
  return mapCategory(result.rows[0]);
}

export async function countProductsInCategory(categoryId) {
  const result = await query(
    `SELECT COUNT(*)::int AS total FROM products WHERE category_id = $1`,
    [categoryId]
  );
  return result.rows[0].total;
}

export async function deleteCategoryById(id) {
  const result = await query(`DELETE FROM categories WHERE id = $1 RETURNING id`, [id]);
  return result.rowCount > 0;
}
