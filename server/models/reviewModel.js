import { query } from '../config/db.js';

function mapReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    reviewerName: row.reviewer_name,
    rating: Number(row.rating),
    title: row.title,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findReviewsByProductId(productId, { page = 1, limit = 10 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const summaryRes = await query(
    `SELECT COUNT(*)::int AS total_reviews,
            COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating,
            COUNT(*) FILTER (WHERE rating = 5)::int AS stars_5,
            COUNT(*) FILTER (WHERE rating = 4)::int AS stars_4,
            COUNT(*) FILTER (WHERE rating = 3)::int AS stars_3,
            COUNT(*) FILTER (WHERE rating = 2)::int AS stars_2,
            COUNT(*) FILTER (WHERE rating = 1)::int AS stars_1
     FROM reviews
     WHERE product_id = $1`,
    [productId]
  );

  const s = summaryRes.rows[0];
  const total = s.total_reviews;

  const rowsRes = await query(
    `SELECT r.id, r.product_id, r.user_id, u.full_name AS reviewer_name,
            r.rating, r.title, r.comment, r.created_at, r.updated_at
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT $2 OFFSET $3`,
    [productId, safeLimit, offset]
  );

  return {
    reviews: rowsRes.rows.map(mapReview),
    summary: {
      totalReviews: total,
      averageRating: Number(s.average_rating),
      distribution: {
        5: s.stars_5,
        4: s.stars_4,
        3: s.stars_3,
        2: s.stars_2,
        1: s.stars_1,
      },
    },
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

export async function findReviewById(reviewId) {
  const res = await query(
    `SELECT r.id, r.product_id, r.user_id, u.full_name AS reviewer_name,
            r.rating, r.title, r.comment, r.created_at, r.updated_at
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = $1`,
    [reviewId]
  );
  return mapReview(res.rows[0]);
}

export async function findUserReviewForProduct(userId, productId) {
  const res = await query(
    `SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return res.rows[0] || null;
}

export async function createReview({ userId, productId, rating, title = null, comment }) {
  const res = await query(
    `INSERT INTO reviews (user_id, product_id, rating, title, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, productId, rating, title ? title.trim() : null, comment.trim()]
  );
  return findReviewById(res.rows[0].id);
}

export async function deleteReviewById(reviewId) {
  const res = await query(`DELETE FROM reviews WHERE id = $1 RETURNING id`, [reviewId]);
  return res.rowCount > 0;
}
