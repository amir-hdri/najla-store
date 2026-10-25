/**
 * NAJLA — API integration tests.
 *
 * Boots the real server against a throwaway SQLite file and exercises the
 * routes end to end: static-file isolation, auth, cart validation, the order
 * lifecycle, and order ownership.
 *
 *   npm test
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TMP_ROOT = path.resolve(ROOT, '..', '..', '.openclaw', 'tmp', 'datenest-tests');
const DB_DIR = path.join(TMP_ROOT, `run-${process.pid}`);
const PORT = Number(process.env.TEST_PORT) || 3111;
const BASE = `http://127.0.0.1:${PORT}`;
const GUEST_SID = 'sess-test-guest-0001';
const OTHER_SID = 'sess-test-other-0002';

let child;

function api(pathname, { method = 'GET', body, session, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (session) headers['X-Session-Id'] = session;
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(BASE + pathname, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function waitForHealth(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 150));
  }
  throw new Error('server did not become healthy in time');
}

before(async () => {
  mkdirSync(DB_DIR, { recursive: true });
  child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATENEST_DB_PATH: path.join(DB_DIR, 'test.db'),
      JWT_SECRET: 'integration-test-secret',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', d => process.stderr.write(`[server] ${d}`));
  await waitForHealth();
});

after(() => {
  if (child) child.kill('SIGTERM');
  rmSync(DB_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------- health ----

test('health endpoint reports the service and sets hardening headers', async () => {
  const res = await api('/api/health');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'datenest');

  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.match(res.headers.get('content-security-policy') || '', /default-src 'self'/);
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

// ------------------------------------------------- static file isolation ----

test('private project files are not served (database, source, manifest)', async () => {
  for (const p of ['/datenest.db', '/test.db', '/server.js', '/db.js', '/package.json', '/node_modules/express/index.js']) {
    const res = await api(p);
    assert.equal(res.status, 404, `${p} should not be reachable`);
  }
});

test('the built SPA is served from client/dist with SPA fallback', async () => {
  const page = await api('/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type') || '', /text\/html/);
  assert.match(await page.text(), /NAJLA/);

  // Root no longer exposes legacy public assets (fonts live in client/dist).
  const legacyFonts = await api('/assets/fonts/fonts.css');
  assert.equal(legacyFonts.status, 404, 'legacy root fonts are no longer served');

  const spa = await api('/some/deep/link');
  assert.equal(spa.status, 200, 'client-side routes fall back to index.html');
  assert.match(spa.headers.get('content-type') || '', /text\/html/);
  assert.match(await spa.text(), /NAJLA/);
});

test('SPA fallback does not swallow unknown API routes', async () => {
  const res = await api('/api/definitely-missing-route');
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type') || '', /application\/json/);
});

// --------------------------------------------------------------- catalog ----

test('catalog exposes the seeded products and categories', async () => {
  const res = await api('/api/products');
  assert.equal(res.status, 200);
  const { products } = await res.json();
  assert.equal(products.length, 15);

  const search = await api('/api/products?search=' + encodeURIComponent('مدجول'));
  const found = (await search.json()).products;
  assert.ok(found.length >= 1, 'medjool search returns at least the Medjool product');
  assert.ok(found.some(p => p.slug === 'medjool'), 'medjool slug is among the results');
});

// ------------------------------------------------------------------ auth ----

test('registration rejects invalid input and accepts a valid customer', async () => {
  const bad = await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'A', email: 'nope', phone: '12', password: 'short', confirm_password: 'x' },
  });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /ایمیل/);

  const ok = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Buyer',
      email: 'Buyer@Example.com',
      phone: '+971500000001',
      password: 'Passw0rd123',
      confirm_password: 'Passw0rd123',
    },
  });
  assert.equal(ok.status, 201);
  const data = await ok.json();
  assert.ok(data.token);
  assert.equal(data.user.email, 'buyer@example.com', 'email is normalised to lowercase');
  assert.equal(data.user.password_hash, undefined, 'hash never leaves the server');

  const dupe = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Buyer',
      email: 'buyer@example.com',
      phone: '+971500000001',
      password: 'Passw0rd123',
      confirm_password: 'Passw0rd123',
    },
  });
  assert.equal(dupe.status, 409);
});

test('failed logins count down and lock the account', async () => {
  const email = 'lockme@example.com';
  await api('/api/auth/register', {
    method: 'POST',
    body: { name: 'Lock Me', email, phone: '+971500000002', password: 'Passw0rd123', confirm_password: 'Passw0rd123' },
  });

  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await api('/api/auth/login', { method: 'POST', body: { email, password: 'wrong-password' } });
    assert.equal(res.status, 401);
    assert.match((await res.json()).error, /تلاش/);
  }

  const fifth = await api('/api/auth/login', { method: 'POST', body: { email, password: 'wrong-password' } });
  assert.equal(fifth.status, 423, 'account locks on the fifth failure');

  const correct = await api('/api/auth/login', { method: 'POST', body: { email, password: 'Passw0rd123' } });
  assert.equal(correct.status, 423, 'locked accounts reject even the right password');
});

// ------------------------------------------------------------------ cart ----

test('cart rejects invalid quantities instead of corrupting totals', async () => {
  for (const quantity of [-5, 0, 1.5, 'abc', 1000]) {
    const res = await api('/api/cart', { method: 'POST', session: GUEST_SID, body: { product_id: 1, quantity } });
    assert.equal(res.status, 400, `quantity ${quantity} must be rejected`);
  }
  const badProduct = await api('/api/cart', { method: 'POST', session: GUEST_SID, body: { product_id: 'x', quantity: 1 } });
  assert.equal(badProduct.status, 400);
});

test('cart accumulates quantity and respects stock', async () => {
  const first = await api('/api/cart', { method: 'POST', session: GUEST_SID, body: { product_id: 1, quantity: 2 } });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).cart.totalItems, 2);

  const second = await api('/api/cart', { method: 'POST', session: GUEST_SID, body: { product_id: 1, quantity: 3 } });
  assert.equal((await second.json()).cart.totalItems, 5, 'quantity is added to the existing line');

  const overStock = await api('/api/cart', { method: 'POST', session: GUEST_SID, body: { product_id: 11, quantity: 99 } });
  assert.equal(overStock.status, 400);
  assert.match((await overStock.json()).error, /موجودی/);
});

test('cart quantity updates are validated, and 0 removes the line', async () => {
  const cart = await (await api('/api/cart', { session: GUEST_SID })).json();
  const itemId = cart.cart.items[0].item_id;

  const bad = await api(`/api/cart/${itemId}`, { method: 'PUT', session: GUEST_SID, body: { quantity: -3 } });
  assert.equal(bad.status, 400);

  const bad2 = await api(`/api/cart/${itemId}`, { method: 'PUT', session: GUEST_SID, body: { quantity: 'many' } });
  assert.equal(bad2.status, 400);

  const ok = await api(`/api/cart/${itemId}`, { method: 'PUT', session: GUEST_SID, body: { quantity: 4 } });
  assert.equal((await ok.json()).cart.totalItems, 4);

  const removed = await api(`/api/cart/${itemId}`, { method: 'PUT', session: GUEST_SID, body: { quantity: 0 } });
  assert.equal((await removed.json()).cart.items.length, 0);
});

// --------------------------------------------------------------- promo ------

test('promo codes validate against the server-side subtotal', async () => {
  const res = await api('/api/promo/validate', { method: 'POST', body: { code: 'welcome10', subtotal: 100 } });
  assert.equal(res.status, 200);
  const { promo } = await res.json();
  assert.equal(promo.code, 'WELCOME10');
  assert.equal(promo.discount, 10);

  const invalid = await api('/api/promo/validate', { method: 'POST', body: { code: 'WELCOME10', subtotal: 'free' } });
  assert.equal(invalid.status, 400);

  const unknown = await api('/api/promo/validate', { method: 'POST', body: { code: 'NOPE', subtotal: 10 } });
  assert.equal(unknown.status, 404);
});

// --------------------------------------------------------------- orders -----

let guestOrderId;

test('a guest can place an order and it decrements stock', async () => {
  const before = await (await api('/api/products/2')).json();
  await api('/api/cart', { method: 'POST', session: GUEST_SID, body: { product_id: 2, quantity: 3 } });

  const res = await api('/api/orders', {
    method: 'POST',
    session: GUEST_SID,
    body: {
      customer_name: 'Guest Buyer',
      customer_email: 'guest@example.com',
      customer_phone: '+971500000003',
      customer_address: '1 Palm Street',
      customer_city: 'Dubai',
      customer_country: 'UAE',
      payment_method: 'card',
      promo_code: 'WELCOME10',
    },
  });
  assert.equal(res.status, 201);
  const { order } = await res.json();
  guestOrderId = order.id;
  assert.match(order.order_number, /^DN-/);
  assert.equal(order.status, 'confirmed');
  assert.equal(order.payment_status, 'paid');
  assert.ok(order.history.length >= 1, 'status history is recorded');
  assert.ok(order.discount > 0, 'promo applied');

  const after = await (await api('/api/products/2')).json();
  assert.equal(after.product.stock, before.product.stock - 3, 'stock is decremented on checkout');
});

test('order payloads are validated', async () => {
  await api('/api/cart', { method: 'POST', session: GUEST_SID, body: { product_id: 3, quantity: 1 } });
  const missing = await api('/api/orders', { method: 'POST', session: GUEST_SID, body: { customer_name: 'X' } });
  assert.equal(missing.status, 400);

  const badEmail = await api('/api/orders', {
    method: 'POST',
    session: GUEST_SID,
    body: { customer_name: 'X', customer_email: 'not-an-email', customer_address: 'a', customer_city: 'b', customer_country: 'c' },
  });
  assert.equal(badEmail.status, 400);
});

test('an order is only readable by its owner', async () => {
  const anonymous = await api(`/api/orders/${guestOrderId}`);
  assert.equal(anonymous.status, 404, 'no session at all is not enough');

  const stranger = await api(`/api/orders/${guestOrderId}`, { session: OTHER_SID });
  assert.equal(stranger.status, 404, 'a different session is not the owner');

  const owner = await api(`/api/orders/${guestOrderId}`, { session: GUEST_SID });
  assert.equal(owner.status, 200);
  const { order } = await owner.json();
  assert.equal(order.id, guestOrderId);
  assert.equal(order.customer_email, 'guest@example.com');
});

test('an order can only be cancelled by its owner, and cancelling restores stock', async () => {
  const before = await (await api('/api/products/2')).json();

  const stranger = await api(`/api/orders/${guestOrderId}/cancel`, {
    method: 'POST',
    session: OTHER_SID,
    body: { reason: 'not mine' },
  });
  assert.equal(stranger.status, 404);

  const owner = await api(`/api/orders/${guestOrderId}/cancel`, {
    method: 'POST',
    session: GUEST_SID,
    body: { reason: 'changed my mind' },
  });
  assert.equal(owner.status, 200);
  const { order } = await owner.json();
  assert.equal(order.status, 'cancelled');
  assert.equal(order.payment_status, 'refunded');
  assert.ok(order.history.some(h => h.status === 'cancelled'));

  const after = await (await api('/api/products/2')).json();
  assert.equal(after.product.stock, before.product.stock + 3, 'stock returns on cancellation');

  const twice = await api(`/api/orders/${guestOrderId}/cancel`, { method: 'POST', session: GUEST_SID, body: {} });
  assert.equal(twice.status, 400, 'a cancelled order cannot be cancelled again');
});

test('order listings are scoped to the caller', async () => {
  const ownerList = await (await api('/api/orders', { session: GUEST_SID })).json();
  assert.equal(ownerList.orders.length, 1);

  const strangerList = await (await api('/api/orders', { session: OTHER_SID })).json();
  assert.equal(strangerList.orders.length, 0);
});

// --------------------------------------------------------------- misc -------

test('unknown API endpoints return a JSON 404', async () => {
  const res = await api('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.match(res.headers.get('content-type') || '', /application\/json/);
});

test('malformed JSON bodies are a 400, not a 500', async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not json',
  });
  assert.equal(res.status, 400);
});
