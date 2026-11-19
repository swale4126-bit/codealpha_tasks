import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { query } from '../config/db.js';

describe('Phase 7 — Shopping Cart & Atomic Checkout API', () => {
  let customerToken = '';
  let customerId = null;
  let cartItemId = null;
  let placedOrderId = null;
  const testProductId = 12; // HydroCore Insulated Thermal Flask (stock: 60)
  let initialStock = 0;

  before(async () => {
    // Log in as customer Daniel
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'daniel@koramarket.com',
      password: 'Customer@Kora2026!',
    });
    customerToken = loginRes.body.data.token;
    customerId = loginRes.body.data.user.id;

    // Ensure product 12 has standard stock of 60
    await query('UPDATE products SET stock_quantity = 60 WHERE id = $1', [testProductId]);
    initialStock = 60;

    // Clear Daniel's cart before tests run
    const cartRes = await query('SELECT id FROM carts WHERE user_id = $1', [customerId]);
    if (cartRes.rows[0]) {
      await query('DELETE FROM cart_items WHERE cart_id = $1', [cartRes.rows[0].id]);
    }
  });

  after(async () => {
    // Clean up created test order if present
    if (placedOrderId) {
      await query('DELETE FROM orders WHERE id = $1', [placedOrderId]);
    }
    // Restore product stock to initial
    await query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [initialStock, testProductId]);
  });

  it('Cart endpoints enforce authentication', async () => {
    const unauth = await request(app).get('/api/cart');
    assert.equal(unauth.status, 401);
  });

  it('POST /api/cart/items adds an item and computes line totals and shipping correctly', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: testProductId, quantity: 2 });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.cart.items.length, 1);
    assert.equal(res.body.data.cart.items[0].productId, testProductId);
    assert.equal(res.body.data.cart.items[0].quantity, 2);
    assert.equal(res.body.data.cart.itemCount, 2);

    cartItemId = res.body.data.cart.items[0].itemId;

    // Subtotal = 38.50 * 2 = 77.00 (< 100 threshold, so standard shipping $9.99 applies)
    assert.equal(res.body.data.cart.subtotal, 77.0);
    assert.equal(res.body.data.cart.shippingFee, 9.99);
  });

  it('POST /api/cart/items rejects quantity exceeding live stock with 400', async () => {
    // Cart already has 2 units; adding (initialStock - 1) makes total (initialStock + 1)
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: testProductId, quantity: initialStock - 1 });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /available in stock/i);
  });

  it('PATCH /api/cart/items/:itemId updates item quantity and free shipping threshold', async () => {
    // 38.50 * 3 = 115.50 (>= 100 threshold, so shipping is free!)
    const res = await request(app)
      .patch(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ quantity: 3 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.cart.items[0].quantity, 3);
    assert.equal(res.body.data.cart.subtotal, 115.5);
    assert.equal(res.body.data.cart.shippingFee, 0.0);
  });

  it('POST /api/cart/merge merges guest items into user cart bounded by stock', async () => {
    // Merge product 8 (Artisan Espresso Glasses) with quantity 2
    const res = await request(app)
      .post('/api/cart/merge')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: [{ productId: 8, quantity: 2 }] });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.cart.items.length, 2);
    assert.equal(res.body.data.cart.itemCount, 5); // 3 + 2
  });

  it('DELETE /api/cart/items/:itemId removes a specific line item', async () => {
    // Remove product 8 item, keep product 12
    const cartBefore = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);

    const itemToRemove = cartBefore.body.data.cart.items.find((i) => i.productId === 8);
    assert.ok(itemToRemove);

    const res = await request(app)
      .delete(`/api/cart/items/${itemToRemove.itemId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.cart.items.length, 1);
    assert.equal(res.body.data.cart.items[0].productId, testProductId);
  });

  it('POST /api/orders performs atomic checkout: decrements inventory, creates payment, and clears cart', async () => {
    // Cart currently has 3 units of product 12
    const preStockRes = await query('SELECT stock_quantity FROM products WHERE id = $1', [testProductId]);
    const stockBeforeOrder = preStockRes.rows[0].stock_quantity;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        addressId: 3, // Daniel's saved address
        paymentMethod: 'simulated_card',
        notes: 'Please leave package by garage entrance.',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);

    const order = res.body.data.order;
    placedOrderId = order.id;

    assert.equal(order.status, 'confirmed');
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].productId, testProductId);
    assert.equal(order.items[0].quantity, 3);
    assert.equal(order.items[0].unitPrice, 38.5);
    assert.equal(order.payment.paymentMethod, 'simulated_card');
    assert.equal(order.payment.paymentStatus, 'simulated_paid');
    assert.ok(order.shippingAddress.recipientName);

    // Verify inventory was decremented by exactly 3 in PostgreSQL
    const postStockRes = await query('SELECT stock_quantity FROM products WHERE id = $1', [testProductId]);
    assert.equal(postStockRes.rows[0].stock_quantity, stockBeforeOrder - 3);

    // Verify cart is now completely empty
    const cartCheck = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    assert.equal(cartCheck.body.data.cart.items.length, 0);
    assert.equal(cartCheck.body.data.cart.itemCount, 0);
  });

  it('GET /api/orders/my-orders and GET /api/orders/:id retrieve the placed order', async () => {
    const listRes = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.data.orders.length >= 1);
    const found = listRes.body.data.orders.find((o) => o.id === placedOrderId);
    assert.ok(found);

    const singleRes = await request(app)
      .get(`/api/orders/${placedOrderId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(singleRes.status, 200);
    assert.equal(singleRes.body.data.order.id, placedOrderId);
    assert.equal(singleRes.body.data.order.items.length, 1);
  });

  it('PATCH /api/orders/:id/cancel cancels order and atomically restores inventory', async () => {
    const preStockRes = await query('SELECT stock_quantity FROM products WHERE id = $1', [testProductId]);
    const stockBeforeCancel = preStockRes.rows[0].stock_quantity;

    const cancelRes = await request(app)
      .patch(`/api/orders/${placedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);

    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.data.order.status, 'cancelled');
    assert.equal(cancelRes.body.data.order.payment.paymentStatus, 'refunded');

    // Verify inventory was restored by exactly 3 in PostgreSQL
    const postStockRes = await query('SELECT stock_quantity FROM products WHERE id = $1', [testProductId]);
    assert.equal(postStockRes.rows[0].stock_quantity, stockBeforeCancel + 3);

    // Attempting to cancel an already cancelled order returns 400
    const secondCancel = await request(app)
      .patch(`/api/orders/${placedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    assert.equal(secondCancel.status, 400);
  });
});
