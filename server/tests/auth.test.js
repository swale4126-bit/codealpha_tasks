import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import pool, { query } from '../config/db.js';

describe('Phase 4 — Authentication, Profile & Shipping Addresses API', () => {
  const testEmail = `phase4.test.${Date.now()}@koramarket.test`;
  const initialPassword = 'TestUser@2026';
  const updatedPassword = 'NewPassword@2026';
  let userToken = '';
  let createdUserId = null;
  let firstAddressId = null;
  let secondAddressId = null;

  after(async () => {
    if (createdUserId) {
      await query('DELETE FROM users WHERE id = $1', [createdUserId]);
    }
    await pool.end();
  });

  it('POST /api/auth/register rejects weak password and invalid email with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'A',
      email: 'not-an-email',
      password: 'weak',
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length >= 2);
  });

  it('POST /api/auth/register creates customer, hashes password, returns JWT, and creates persistent cart', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Phase Four Tester',
      email: testEmail,
      password: initialPassword,
      phone: '+1-555-9999',
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testEmail);
    assert.equal(res.body.data.user.role, 'customer');
    assert.equal(res.body.data.user.passwordHash, undefined);
    assert.ok(typeof res.body.data.token === 'string' && res.body.data.token.length > 20);

    userToken = res.body.data.token;
    createdUserId = res.body.data.user.id;

    // Verify persistent cart was created atomically
    const cartCheck = await query('SELECT id FROM carts WHERE user_id = $1', [createdUserId]);
    assert.equal(cartCheck.rows.length, 1);
  });

  it('POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Duplicate User',
      email: testEmail,
      password: initialPassword,
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  it('POST /api/auth/login rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPassword@1',
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('POST /api/auth/login authenticates seeded admin account', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@koramarket.com',
      password: 'Admin@Kora2026!',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.role, 'admin');
    assert.ok(res.body.data.token);
  });

  it('GET /api/auth/me rejects missing JWT and accepts valid JWT', async () => {
    const unauth = await request(app).get('/api/auth/me');
    assert.equal(unauth.status, 401);

    const auth = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(auth.status, 200);
    assert.equal(auth.body.data.user.id, createdUserId);
  });

  it('PATCH /api/auth/profile updates fullName and phone', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ fullName: 'Updated Tester Name', phone: '+1-555-7777' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.fullName, 'Updated Tester Name');
    assert.equal(res.body.data.user.phone, '+1-555-7777');
  });

  it('PATCH /api/auth/password updates password and allows login with new password', async () => {
    const changeRes = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ currentPassword: initialPassword, newPassword: updatedPassword });

    assert.equal(changeRes.status, 200);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: updatedPassword,
    });
    assert.equal(loginRes.status, 200);
  });

  it('Shipping Addresses CRUD enforces default uniqueness and user ownership isolation', async () => {
    // 1. First address becomes default automatically
    const addr1Res = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        label: 'Home',
        recipientName: 'Updated Tester Name',
        phone: '+1-555-7777',
        streetLine1: '100 Main St',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'United States',
      });

    assert.equal(addr1Res.status, 201);
    assert.equal(addr1Res.body.data.address.isDefault, true);
    firstAddressId = addr1Res.body.data.address.id;

    // 2. Second address marked isDefault: true atomically switches default
    const addr2Res = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        label: 'Work',
        recipientName: 'Updated Tester Name',
        phone: '+1-555-7777',
        streetLine1: '500 Pine St',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        isDefault: true,
      });

    assert.equal(addr2Res.status, 201);
    assert.equal(addr2Res.body.data.address.isDefault, true);
    secondAddressId = addr2Res.body.data.address.id;

    const listRes = await request(app)
      .get('/api/addresses')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.data.addresses.length, 2);
    const defaults = listRes.body.data.addresses.filter((a) => a.isDefault);
    assert.equal(defaults.length, 1);
    assert.equal(defaults[0].id, secondAddressId);

    // 3. Ownership isolation: cannot delete seeded customer Amina's address (id = 1)
    const crossUserDelete = await request(app)
      .delete('/api/addresses/1')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(crossUserDelete.status, 404);

    // 4. Deleting default address automatically promotes remaining address to default
    const delRes = await request(app)
      .delete(`/api/addresses/${secondAddressId}`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(delRes.status, 200);

    const afterDeleteList = await request(app)
      .get('/api/addresses')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(afterDeleteList.body.data.addresses.length, 1);
    assert.equal(afterDeleteList.body.data.addresses[0].id, firstAddressId);
    assert.equal(afterDeleteList.body.data.addresses[0].isDefault, true);
  });
});
