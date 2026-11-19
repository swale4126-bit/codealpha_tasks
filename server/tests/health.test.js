import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

describe('API Health & Fallback Routes', () => {

  it('GET /api/health returns 200 with live PostgreSQL database status', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.service, 'koramarket-api');
    assert.equal(res.body.data.database, 'koramarket');
  });

  it('GET /api/does-not-exist returns 404 JSON error', async () => {
    const res = await request(app).get('/api/does-not-exist');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Route not found/i);
  });
});
