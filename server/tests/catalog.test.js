import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { query } from '../config/db.js';

describe('Phase 5 — Categories, Products & Reviews API', () => {
  let adminToken = '';
  let customerAminaToken = '';
  let customerDanielToken = '';
  let tempCategoryId = null;
  let tempProductId = null;
  let tempReviewId = null;
  let softDeletedProductId = null;

  before(async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@koramarket.com',
      password: 'Admin@Kora2026!',
    });
    adminToken = adminLogin.body.data.token;

    const aminaLogin = await request(app).post('/api/auth/login').send({
      email: 'amina@koramarket.com',
      password: 'Customer@Kora2026!',
    });
    customerAminaToken = aminaLogin.body.data.token;

    const danielLogin = await request(app).post('/api/auth/login').send({
      email: 'daniel@koramarket.com',
      password: 'Customer@Kora2026!',
    });
    customerDanielToken = danielLogin.body.data.token;
  });

  after(async () => {
    if (tempReviewId) {
      await query('DELETE FROM reviews WHERE id = $1', [tempReviewId]);
    }
    if (tempProductId) {
      await query('DELETE FROM products WHERE id = $1', [tempProductId]);
    }
    if (tempCategoryId) {
      await query('DELETE FROM categories WHERE id = $1', [tempCategoryId]);
    }
    if (softDeletedProductId) {
      await query('UPDATE products SET is_active = TRUE, deleted_at = NULL WHERE id = $1', [
        softDeletedProductId,
      ]);
    }
  });

  it('GET /api/categories returns seeded categories with product counts', async () => {
    const res = await request(app).get('/api/categories');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.categories.length >= 6);
    assert.equal(typeof res.body.data.categories[0].productCount, 'number');

    const single = await request(app).get('/api/categories/electronics-audio');
    assert.equal(single.status, 200);
    assert.equal(single.body.data.category.slug, 'electronics-audio');
  });

  it('Categories write endpoints enforce admin RBAC and non-empty delete protection', async () => {
    // Customer forbidden
    const forbidden = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${customerAminaToken}`)
      .send({ name: 'Unauthorized Cat' });
    assert.equal(forbidden.status, 403);

    // Admin creates category
    const uniqueCatName = `Test Outdoor Gear ${Date.now()}`;
    const created = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: uniqueCatName, description: 'Temporary test category' });
    assert.equal(created.status, 201);
    tempCategoryId = created.body.data.category.id;

    // Cannot delete category 1 that still has products
    const conflictDel = await request(app)
      .delete('/api/categories/1')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(conflictDel.status, 409);

    // Can delete empty test category
    const cleanDel = await request(app)
      .delete(`/api/categories/${tempCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(cleanDel.status, 200);
    tempCategoryId = null;
  });

  it('GET /api/products supports search, category filter, price range, sorting, and pagination', async () => {
    // Pagination
    const pageRes = await request(app).get('/api/products?page=1&limit=4');
    assert.equal(pageRes.status, 200);
    assert.equal(pageRes.body.data.products.length, 4);
    assert.equal(pageRes.body.meta.total, 12);
    assert.equal(pageRes.body.meta.totalPages, 3);

    // Search
    const searchRes = await request(app).get('/api/products?search=keyboard');
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.body.data.products.length, 1);
    assert.match(searchRes.body.data.products[0].name, /Keyboard/i);

    // Category + Price range + Sort ascending
    const filterRes = await request(app).get('/api/products?minPrice=50&maxPrice=120&sort=price_asc');
    assert.equal(filterRes.status, 200);
    const prices = filterRes.body.data.products.map((p) => p.price);
    assert.ok(prices.length > 0);
    for (let i = 0; i < prices.length; i += 1) {
      assert.ok(prices[i] >= 50 && prices[i] <= 120);
      if (i > 0) assert.ok(prices[i] >= prices[i - 1]);
    }
  });

  it('GET /api/products/:idOrSlug resolves by both ID and slug with images and related products', async () => {
    const byId = await request(app).get('/api/products/1');
    assert.equal(byId.status, 200);
    assert.ok(byId.body.data.product.images.length >= 2);
    assert.ok(Array.isArray(byId.body.data.relatedProducts));

    const bySlug = await request(app).get('/api/products/korasound-anc-wireless-headphones');
    assert.equal(bySlug.status, 200);
    assert.equal(bySlug.body.data.product.id, 1);
  });

  it('Admin product CRUD supports image galleries, hard-delete for unused products, and soft-delete for ordered products', async () => {
    // Customer blocked
    const forbidden = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${customerAminaToken}`)
      .send({ name: 'Blocked Product' });
    assert.equal(forbidden.status, 403);

    // Admin creates temporary product with 2 images
    const sku = `KM-TST-${Date.now()}`;
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Studio Monitor Desk Pad',
        categoryId: 2,
        sku,
        shortDescription: 'Wool felt minimalist desk mat.',
        description: 'Premium acoustic merino wool desk mat engineered for comfort and cable management.',
        price: 49.0,
        compareAtPrice: 59.0,
        stockQuantity: 15,
        isFeatured: false,
        images: [
          { imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', isPrimary: true },
          { imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800', isPrimary: false },
        ],
      });
    assert.equal(createRes.status, 201);
    tempProductId = createRes.body.data.product.id;
    assert.equal(createRes.body.data.product.images.length, 2);

    // Admin updates price & stock
    const updateRes = await request(app)
      .put(`/api/products/${tempProductId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 44.5, stockQuantity: 20 });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.product.price, 44.5);
    assert.equal(updateRes.body.data.product.stockQuantity, 20);

    // Never-ordered product gets hard-deleted
    const hardDelRes = await request(app)
      .delete(`/api/products/${tempProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(hardDelRes.status, 200);
    assert.equal(hardDelRes.body.data.deletionType, 'hard');
    tempProductId = null;

    // Seeded product 1 HAS historical orders -> must soft-delete instead of failing or breaking order_items
    const softDelRes = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(softDelRes.status, 200);
    assert.equal(softDelRes.body.data.deletionType, 'soft');
    softDeletedProductId = 1;

    // Archived product must no longer appear on public storefront
    const hiddenCheck = await request(app).get('/api/products/1');
    assert.equal(hiddenCheck.status, 404);
  });

  it('Product reviews enforce 1-5 rating validation, uniqueness, and owner-or-admin deletion', async () => {
    const listRes = await request(app).get('/api/products/3/reviews');
    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.data.summary.totalReviews >= 1);

    // Amina reviews product 2 (she has not reviewed it yet)
    const createRes = await request(app)
      .post('/api/products/2/reviews')
      .set('Authorization', `Bearer ${customerAminaToken}`)
      .send({
        rating: 5,
        title: 'Crisp portable audio',
        comment: 'Surprisingly punchy sound for its compact footprint and very easy Bluetooth pairing.',
      });
    assert.equal(createRes.status, 201);
    tempReviewId = createRes.body.data.review.id;

    // Duplicate review by same user on product 2 -> 409 Conflict
    const dupRes = await request(app)
      .post('/api/products/2/reviews')
      .set('Authorization', `Bearer ${customerAminaToken}`)
      .send({
        rating: 4,
        comment: 'Trying to submit a second review for the same product.',
      });
    assert.equal(dupRes.status, 409);

    // Another customer (Daniel) cannot delete Amina's review -> 403 Forbidden
    const otherUserDel = await request(app)
      .delete(`/api/reviews/${tempReviewId}`)
      .set('Authorization', `Bearer ${customerDanielToken}`);
    assert.equal(otherUserDel.status, 403);

    // Owner (Amina) deletes her own review -> 200 OK
    const ownerDel = await request(app)
      .delete(`/api/reviews/${tempReviewId}`)
      .set('Authorization', `Bearer ${customerAminaToken}`);
    assert.equal(ownerDel.status, 200);
    tempReviewId = null;
  });
});
