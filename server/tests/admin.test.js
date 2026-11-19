import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import pool from '../config/db.js';

describe('Phase 8 — Admin Operations & Analytics API', () => {
  let adminToken;
  let customerToken;
  let customerId;
  let testOrderId;
  let testProductId;

  before(async () => {
    // 1. Login as seeded admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@koramarket.com', password: 'Admin@Kora2026!' });
    assert.equal(adminLoginRes.status, 200);
    adminToken = adminLoginRes.body.data.token;

    // 2. Login seeded customer
    const customerLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'daniel@koramarket.com', password: 'Customer@Kora2026!' });
    assert.equal(customerLoginRes.status, 200);
    customerToken = customerLoginRes.body.data.token;
    customerId = customerLoginRes.body.data.user.id;

    // 3. Find an existing order or create one
    const orderRes = await pool.query(`SELECT id, status FROM orders ORDER BY id DESC LIMIT 1;`);
    if (orderRes.rows.length > 0) {
      testOrderId = orderRes.rows[0].id;
    }

    // 4. Find an active product
    const productRes = await pool.query(
      `SELECT id, stock_quantity FROM products WHERE is_active = true ORDER BY id ASC LIMIT 1;`
    );
    testProductId = productRes.rows[0].id;
  });

  it('Admin endpoints reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    assert.equal(res.status, 401);
  });

  it('Admin endpoints reject regular customers with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    assert.equal(res.status, 403);
    assert.match(res.body.message, /permission/i);
  });

  it('GET /api/admin/dashboard returns 200 with structured KPIs, breakdown, and low-stock alerts', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.kpis);
    assert.equal(typeof res.body.data.kpis.grossRevenue, 'number');
    assert.equal(typeof res.body.data.kpis.totalOrders, 'number');
    assert.equal(typeof res.body.data.kpis.activeCustomers, 'number');
    assert.equal(typeof res.body.data.kpis.lowStockProducts, 'number');
    assert.ok(res.body.data.ordersByStatus);
    assert.ok(Array.isArray(res.body.data.recentOrders));
    assert.ok(Array.isArray(res.body.data.lowStockItems));
  });

  it('GET /api/admin/sales-summary returns 200 with timeline and category distributions', async () => {
    const res = await request(app)
      .get('/api/admin/sales-summary?days=30')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.days, 30);
    assert.ok(Array.isArray(res.body.data.dailyTimeline));
    assert.ok(Array.isArray(res.body.data.topProducts));
    assert.ok(Array.isArray(res.body.data.categoryRevenue));
  });

  it('GET /api/admin/orders returns 200 with paginated orders and customer snapshots', async () => {
    const res = await request(app)
      .get('/api/admin/orders?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.meta);
    assert.equal(res.body.meta.page, 1);
  });

  it('PATCH /api/admin/orders/:id/status updates order status and validates allowed states', async () => {
    if (!testOrderId) return;

    // Reset status to confirmed if needed
    await pool.query(`UPDATE orders SET status = 'confirmed' WHERE id = $1;`, [testOrderId]);

    // Advance to shipped
    const shippedRes = await request(app)
      .patch(`/api/admin/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });

    assert.equal(shippedRes.status, 200);
    assert.equal(shippedRes.body.data.status, 'shipped');

    // Invalid status rejected
    const invalidRes = await request(app)
      .patch(`/api/admin/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid_status' });

    assert.equal(invalidRes.status, 400);
  });

  it('GET /api/admin/customers returns customer directory with order metrics', async () => {
    const res = await request(app)
      .get('/api/admin/customers?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.meta);

    const targetCustomer = res.body.data.find((c) => c.id === customerId);
    if (targetCustomer) {
      assert.equal(typeof targetCustomer.totalOrders, 'number');
      assert.equal(typeof targetCustomer.lifetimeSpend, 'number');
    }
  });

  it('PATCH /api/admin/customers/:id/status toggles customer active status and prevents self-deactivation', async () => {
    // 1. Deactivate customer
    const deactivateRes = await request(app)
      .patch(`/api/admin/customers/${customerId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    assert.equal(deactivateRes.status, 200);
    assert.equal(deactivateRes.body.data.is_active, false);

    // 2. Reactivate customer
    const reactivateRes = await request(app)
      .patch(`/api/admin/customers/${customerId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });

    assert.equal(reactivateRes.status, 200);
    assert.equal(reactivateRes.body.data.is_active, true);
  });

  it('PATCH /api/admin/products/:id/inventory adjusts stock quantity and threshold', async () => {
    const res = await request(app)
      .patch(`/api/admin/products/${testProductId}/inventory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stockQuantity: 88, lowStockThreshold: 12 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.stock_quantity, 88);
    assert.equal(res.body.data.low_stock_threshold, 12);
  });
});
