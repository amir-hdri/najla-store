/* ============================================
   NAJLA — Full-Stack E-Commerce Server
   Professional auth, addresses, and order lifecycle
   Express + SQLite (node:sqlite)
   ============================================ */

const express = require('express');
const path = require('path');
const { existsSync } = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const { getDb } = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
// Never ship a hard-coded JWT secret. If the env var is missing we generate an
// ephemeral secret in development (tokens die on restart) and refuse to boot in
// production rather than silently signing tokens with a publicly known key.
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (IS_PROD) {
    console.error('[FATAL] JWT_SECRET is not set. Refusing to start in production with a generated secret.');
    process.exit(1);
  }
  console.warn('[SECURITY] JWT_SECRET is not set — generated an ephemeral secret for this run. Tokens expire on restart.');
  return crypto.randomBytes(32).toString('hex');
})();

/* فروشگاه تخصصی خرما — مبالغ به تومان */
const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_COST = 49000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const RESET_TOKEN_MINUTES = 60;
const MAX_QTY_PER_ITEM = 99;
const ROOT_DIR = __dirname;

// Built React client (Vite). Everything else in the project directory —
// datenest.db, server.js, db.js, package.json, node_modules, logs — stays
// private. Only the dist tree is reachable over HTTP (plus optional root
// public files below if they ever appear).
const CLIENT_DIST = path.join(ROOT_DIR, 'client', 'dist');
const CLIENT_INDEX = path.join(CLIENT_DIST, 'index.html');
const PUBLIC_FILES = new Set(['favicon.ico', 'robots.txt', 'manifest.webmanifest']);
const PUBLIC_DIRS = new Set([]); // root assets/ no longer served — fonts live in client/public

function resolvePublicPath(urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return null; }
  if (!rel || rel.includes('\0') || rel.includes('\\')) return null;
  const parts = rel.split('/').filter(Boolean);
  if (!parts.length || parts.some(p => p === '.' || p === '..')) return null;
  if (parts.length === 1) {
    if (!PUBLIC_FILES.has(parts[0])) return null;
  } else if (!PUBLIC_DIRS.has(parts[0])) {
    return null;
  }
  const abs = path.resolve(ROOT_DIR, ...parts);
  return abs.startsWith(ROOT_DIR + path.sep) ? abs : null;
}

// ====== MIDDLEWARE ======
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Gzip text assets — the JS/CSS bundles ship ~3x smaller over the wire.
// Images (jpg/png/webp) are already compressed and skip the filter.
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    const ct = String(res.getHeader('Content-Type') || '');
    if (/text\/|json|javascript|svg|xml|wasm/.test(ct)) return true;
    return compression.filter(req, res);
  },
}));

// Static caching: hashed build assets are immutable; media gets a day;
// the HTML shell must revalidate so deploys land immediately.
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    if (req.path.startsWith('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else if (/\.(?:png|jpe?g|webp|svg|ico|woff2?)$/i.test(req.path)) res.setHeader('Cache-Control', 'public, max-age=604800');
    else if (req.path === '/' || req.path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
  if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Same-origin by default. Opt specific origins in with CORS_ORIGINS=a,b.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ====== RATE LIMITING (in-memory, per client IP + scope) ======
const rateBuckets = new Map();
function rateLimit(scope, max, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${scope}:${ip}`;
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'درخواست‌ها زیاد است. لحظه‌ای صبر کن و دوباره تلاش کن.' });
    }
    next();
  };
}
const rateSweep = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) if (bucket.resetAt <= now) rateBuckets.delete(key);
}, 60000);
if (rateSweep.unref) rateSweep.unref();

// ====== STATIC FILES (built SPA from client/dist, plus legacy public assets) ======
function resolveDistPath(urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return null; }
  if (!rel || rel.includes('\0') || rel.includes('\\')) return null;
  const parts = rel.split('/').filter(Boolean);
  if (!parts.length || parts.some(p => p === '.' || p === '..')) return null;
  const abs = path.resolve(CLIENT_DIST, ...parts);
  return abs.startsWith(CLIENT_DIST + path.sep) ? abs : null;
}

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  const distAbs = resolveDistPath(req.path === '/' ? '/index.html' : req.path);
  if (distAbs && existsSync(distAbs)) {
    return res.sendFile(distAbs, (err) => {
      if (err && (err.code === 'ENOENT' || err.status === 404)) return serveFallback(req, res, next);
      if (err) return next(err);
    });
  }

  const legacyAbs = resolvePublicPath(req.path);
  if (legacyAbs) {
    return res.sendFile(legacyAbs, (err) => {
      if (err && (err.code === 'ENOENT' || err.status === 404)) return serveFallback(req, res, next);
      if (err) return next(err);
    });
  }

  return serveFallback(req, res, next);
});

/** SPA fallback: extensionless GETs return dist/index.html; anything else 404s. */
function serveFallback(req, res, next) {
  if (path.extname(req.path)) return res.status(404).type('text/plain').send('Not found');
  if (!existsSync(CLIENT_INDEX)) {
    return res.status(503).type('text/plain')
      .send('Client build missing — run `npm run build` (or `npm run build:client`) and retry.');
  }
  res.sendFile(CLIENT_INDEX);
}

// ====== VALIDATION HELPERS ======
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PAYMENT_METHODS = new Set(['card', 'paypal', 'cod']);

/** Whole-number quantity in [1, MAX_QTY_PER_ITEM], or null when invalid. */
function parseQuantity(value) {
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_QTY_PER_ITEM) return null;
  return n;
}

/** Trimmed string capped at `max` chars; non-strings become ''. */
function str(value, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validateRegistration(body) {
  const errors = [];
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();
  const password = body.password || '';
  const confirm = body.confirm_password || '';

  if (!name || name.length < 2 || name.length > 80) errors.push('نام باید بین ۲ تا ۸۰ نویسه باشد.');
  if (!EMAIL_RE.test(email)) errors.push('یک ایمیل معتبر لازم است.');
  if (!PHONE_RE.test(phone)) errors.push('یک شماره تماس معتبر لازم است (مثل ‎+989123456789).');
  if (!PASSWORD_RE.test(password)) errors.push('گذرواژه باید حداقل ۸ نویسه با حداقل یک حرف و یک عدد باشد.');
  if (password !== confirm) errors.push('گذرواژه‌ها یکسان نیستند.');

  return { errors, name, email, phone, password };
}

// ====== AUTH HELPERS ======
function getSessionId(req) {
  const sid = req.headers['x-session-id'];
  // Only accept a well-formed client session id; anything else starts a new one.
  if (typeof sid === 'string' && /^[A-Za-z0-9._-]{6,64}$/.test(sid)) return sid;
  return crypto.randomUUID();
}

function getAuthUser(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try { return jwt.verify(auth.slice(7), JWT_SECRET); } catch { return null; }
}

function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'ابتدا وارد حساب شو.' });
  req.authUser = user;
  next();
}

// An order belongs to exactly one owner: the signed-in user, or — for guest
// checkout — the session that placed it. Anyone else gets a 404 so order ids
// stay unguessable. (Previously any anonymous caller could read, cancel or
// re-order any order by iterating sequential ids.)
function canAccessOrder(req, order) {
  if (order.user_id) {
    const authUser = getAuthUser(req);
    return !!authUser && authUser.id === order.user_id;
  }
  const sid = req.headers['x-session-id'];
  return !!sid && !!order.session_id && sid === order.session_id;
}

function getOrCreateCart(db, userId, sessionId) {
  if (userId) {
    let cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);
    if (!cart) {
      const r = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
      cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(r.lastInsertRowid);
    }
    return cart;
  }
  let cart = db.prepare('SELECT * FROM carts WHERE session_id = ?').get(sessionId);
  if (!cart) {
    const r = db.prepare('INSERT INTO carts (session_id) VALUES (?)').run(sessionId);
    cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(r.lastInsertRowid);
  }
  return cart;
}

function cartItemsWithProducts(db, cartId) {
  return db.prepare(`
    SELECT ci.id as item_id, ci.quantity,
           p.id as product_id, p.name, p.emoji, p.price, p.old_price,
           p.category, p.weight, p.stock
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ? ORDER BY ci.id DESC
  `).all(cartId);
}

function cartSummary(items) {
  return {
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  };
}

function logOrderStatus(db, orderId, status, note) {
  db.prepare('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)').run(orderId, status, note || null);
}

// ============================================
// AUTH
// ============================================
app.post('/api/auth/register', rateLimit('register', 20, 15 * 60000), (req, res) => {
  const db = getDb();
  const { errors, name, email, phone, password } = validateRegistration(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'با این ایمیل حسابی وجود دارد.' });

  const hash = bcrypt.hashSync(password, 10);
  const verificationToken = crypto.randomBytes(24).toString('hex');
  const r = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, verification_token)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, email, phone, hash, verificationToken);

  const user = db.prepare('SELECT id, name, email, phone, email_verified, is_admin FROM users WHERE id = ?').get(r.lastInsertRowid);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user, message: 'Account created successfully.' });
});

app.post('/api/auth/login', rateLimit('login', 40, 15 * 60000), (req, res) => {
  const db = getDb();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'ایمیل و گذرواژه لازم است.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!user) return res.status(401).json({ error: 'ایمیل یا گذرواژه نادرست است.' });

  // Lockout check
  if (user.locked_until && new Date(user.locked_until.replace(' ', 'T') + 'Z') > new Date()) {
    return res.status(423).json({ error: 'حساب موقتاً قفل است. بعداً تلاش کن.' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    const failed = (user.failed_attempts || 0) + 1;
    if (failed >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString().replace('T', ' ').slice(0, 19);
      db.prepare('UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?').run(lockUntil, user.id);
      return res.status(423).json({ error: `تلاش‌های ناموفق زیاد شد. حساب ${LOCK_MINUTES} دقیقه قفل شد.` });
    }
    db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(failed, user.id);
    return res.status(401).json({ error: `ایمیل یا گذرواژه نادرست است. ${MAX_LOGIN_ATTEMPTS - failed} تلاش مانده.` });
  }

  // Success — reset attempts
  db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, email_verified: user.email_verified, is_admin: user.is_admin } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, phone, email_verified, is_admin, created_at FROM users WHERE id = ?').get(req.authUser.id);
  if (!user) return res.status(404).json({ error: 'کاربر پیدا نشد.' });
  res.json({ user });
});

// Update profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const db = getDb();
  const { name, phone } = req.body || {};
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'نام باید حداقل ۲ نویسه باشد.' });
  if (phone && !PHONE_RE.test(String(phone).trim())) return res.status(400).json({ error: 'شماره تماس معتبر نیست.' });
  db.prepare("UPDATE users SET name = ?, phone = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name.trim(), phone ? phone.trim() : null, req.authUser.id);
  const user = db.prepare('SELECT id, name, email, phone, email_verified, is_admin FROM users WHERE id = ?').get(req.authUser.id);
  res.json({ user });
});

// Change password
app.put('/api/auth/password', requireAuth, (req, res) => {
  const db = getDb();
  const { current_password, new_password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.authUser.id);
  if (!current_password || !bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(400).json({ error: 'گذرواژه فعلی نادرست است.' });
  }
  if (!PASSWORD_RE.test(new_password || '')) {
    return res.status(400).json({ error: 'گذرواژه جدید باید حداقل ۸ نویسه با حداقل یک حرف و یک عدد باشد.' });
  }
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(bcrypt.hashSync(new_password, 10), user.id);
  res.json({ message: 'Password updated successfully.' });
});

// Forgot password
app.post('/api/auth/forgot-password', rateLimit('forgot', 10, 15 * 60000), (req, res) => {
  const db = getDb();
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'ایمیل لازم است.' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  // Always respond the same to avoid user enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + RESET_TOKEN_MINUTES * 60000).toISOString().replace('T', ' ').slice(0, 19);
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(resetToken, expires, user.id);
  // Production emails the token; it is never returned over the API there.
  // Locally it is echoed back so the reset flow stays testable without a mailer.
  if (IS_PROD) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }
  console.warn('[DEV] Password reset token issued for', user.email);
  res.json({ message: 'Reset token generated.', reset_token: resetToken, expires_in_minutes: RESET_TOKEN_MINUTES });
});

// Reset password
app.post('/api/auth/reset-password', rateLimit('reset', 20, 15 * 60000), (req, res) => {
  const db = getDb();
  const { token, new_password } = req.body || {};
  if (!token || !new_password) return res.status(400).json({ error: 'توکن و گذرواژه جدید لازم است.' });
  if (!PASSWORD_RE.test(new_password)) return res.status(400).json({ error: 'گذرواژه باید حداقل ۸ نویسه با حداقل یک حرف و یک عدد باشد.' });

  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
  if (!user) return res.status(400).json({ error: 'توکن بازنشانی معتبر نیست یا منقضی شده.' });
  if (user.reset_token_expires && new Date(user.reset_token_expires.replace(' ', 'T') + 'Z') < new Date()) {
    return res.status(400).json({ error: 'توکن بازنشانی منقضی شده.' });
  }
  db.prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, failed_attempts = 0, locked_until = NULL, updated_at = datetime('now') WHERE id = ?")
    .run(bcrypt.hashSync(new_password, 10), user.id);
  res.json({ message: 'Password reset successfully. You can now sign in.' });
});

// ============================================
// ADDRESSES
// ============================================
app.get('/api/addresses', requireAuth, (req, res) => {
  const db = getDb();
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.authUser.id);
  res.json({ addresses });
});

app.post('/api/addresses', requireAuth, (req, res) => {
  const db = getDb();
  const b = req.body || {};
  const label = (b.label || 'Home').trim();
  const full_name = (b.full_name || '').trim();
  const phone = (b.phone || '').trim();
  const line1 = (b.line1 || '').trim();
  const city = (b.city || '').trim();
  const country = (b.country || '').trim();

  if (!full_name || !phone || !line1 || !city || !country) {
    return res.status(400).json({ error: 'نام، تماس، نشانی، شهر و کشور لازم است.' });
  }
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'شماره تماس معتبر نیست.' });

  const count = db.prepare('SELECT COUNT(*) as c FROM addresses WHERE user_id = ?').get(req.authUser.id).c;
  const isDefault = count === 0 ? 1 : (b.is_default ? 1 : 0);

  db.exec('BEGIN');
  try {
    if (isDefault) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.authUser.id);
    const r = db.prepare(`
      INSERT INTO addresses (user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.authUser.id, label, full_name, phone, line1, (b.line2 || '').trim() || null, city, (b.state || '').trim() || null, (b.postal_code || '').trim() || null, country, isDefault);
    db.exec('COMMIT');
    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json({ address });
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
});

app.put('/api/addresses/:id', requireAuth, (req, res) => {
  const db = getDb();
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.authUser.id);
  if (!address) return res.status(404).json({ error: 'نشانی پیدا نشد.' });

  const b = req.body || {};
  const full_name = (b.full_name || address.full_name).trim();
  const phone = (b.phone || address.phone).trim();
  const line1 = (b.line1 || address.line1).trim();
  const city = (b.city || address.city).trim();
  const country = (b.country || address.country).trim();
  if (!full_name || !phone || !line1 || !city || !country) return res.status(400).json({ error: 'فیلدهای لازم نشانی جا افتاده.' });
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'شماره تماس معتبر نیست.' });

  db.prepare(`
    UPDATE addresses SET label = ?, full_name = ?, phone = ?, line1 = ?, line2 = ?, city = ?, state = ?, postal_code = ?, country = ?
    WHERE id = ?
  `).run(
    (b.label || address.label).trim(), full_name, phone, line1, (b.line2 || address.line2 || '').trim() || null,
    city, (b.state || address.state || '').trim() || null, (b.postal_code || address.postal_code || '').trim() || null, country, address.id
  );
  res.json({ address: db.prepare('SELECT * FROM addresses WHERE id = ?').get(address.id) });
});

app.delete('/api/addresses/:id', requireAuth, (req, res) => {
  const db = getDb();
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.authUser.id);
  if (!address) return res.status(404).json({ error: 'نشانی پیدا نشد.' });
  db.prepare('DELETE FROM addresses WHERE id = ?').run(address.id);
  // If it was default, promote another
  if (address.is_default) {
    const next = db.prepare('SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.authUser.id);
    if (next) db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(next.id);
  }
  res.json({ message: 'Address deleted.' });
});

app.put('/api/addresses/:id/default', requireAuth, (req, res) => {
  const db = getDb();
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.authUser.id);
  if (!address) return res.status(404).json({ error: 'نشانی پیدا نشد.' });
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.authUser.id);
    db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(address.id);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  res.json({ message: 'Default address updated.' });
});

// ============================================
// PRODUCTS
// ============================================
app.get('/api/products', (req, res) => {
  const db = getDb();
  const { category, search, sort } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
  if (search) { sql += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)'; const q = `%${search}%`; params.push(q, q, q); }
  if (sort === 'price_asc') sql += ' ORDER BY price ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY price DESC';
  else if (sort === 'name') sql += ' ORDER BY name ASC';
  else sql += ' ORDER BY id ASC';
  res.json({ products: db.prepare(sql).all(...params) });
});

app.get('/api/products/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'محصول پیدا نشد.' });
  res.json({ product });
});

app.get('/api/categories', (req, res) => {
  const db = getDb();
  res.json({ categories: db.prepare('SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category').all() });
});

// ============================================
// CART
// ============================================
app.get('/api/cart', (req, res) => {
  const db = getDb();
  const authUser = getAuthUser(req);
  const cart = getOrCreateCart(db, authUser ? authUser.id : null, getSessionId(req));
  const items = cartItemsWithProducts(db, cart.id);
  res.json({ cart: { items, ...cartSummary(items) } });
});

app.post('/api/cart', (req, res) => {
  const db = getDb();
  const authUser = getAuthUser(req);
  const productId = Number((req.body || {}).product_id);
  const quantity = parseQuantity((req.body || {}).quantity ?? 1);
  if (!Number.isInteger(productId) || productId < 1) return res.status(400).json({ error: 'شناسه معتبر محصول لازم است.' });
  if (quantity === null) return res.status(400).json({ error: `تعداد باید عدد صحیح بین ۱ تا ${MAX_QTY_PER_ITEM} باشد.` });

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'محصول پیدا نشد.' });

  const cart = getOrCreateCart(db, authUser ? authUser.id : null, getSessionId(req));
  const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cart.id, productId);
  const nextQty = (existing ? existing.quantity : 0) + quantity;
  if (nextQty > product.stock) return res.status(400).json({ error: `از ${product.name} تنها ${product.stock} عدد در موجودی مانده.` });

  if (existing) db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(nextQty, existing.id);
  else db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)').run(cart.id, productId, quantity);
  db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").run(cart.id);

  const items = cartItemsWithProducts(db, cart.id);
  res.json({ cart: { items, ...cartSummary(items) } });
});

app.put('/api/cart/:itemId', (req, res) => {
  const db = getDb();
  const authUser = getAuthUser(req);
  const rawQuantity = (req.body || {}).quantity;
  const cart = getOrCreateCart(db, authUser ? authUser.id : null, getSessionId(req));
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?').get(req.params.itemId, cart.id);
  if (!item) return res.status(404).json({ error: 'قلم سبد پیدا نشد.' });

  // 0 / empty / absent removes the line; anything else must be a sane integer.
  if (rawQuantity === undefined || rawQuantity === null || Number(rawQuantity) === 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  } else {
    const quantity = parseQuantity(rawQuantity);
    if (quantity === null) return res.status(400).json({ error: `تعداد باید عدد صحیح بین ۱ تا ${MAX_QTY_PER_ITEM} باشد.` });
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product_id);
    if (product && quantity > product.stock) return res.status(400).json({ error: `تنها ${product.stock} عدد در موجودی مانده.` });
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, item.id);
  }
  const items = cartItemsWithProducts(db, cart.id);
  res.json({ cart: { items, ...cartSummary(items) } });
});

app.delete('/api/cart/:itemId', (req, res) => {
  const db = getDb();
  const authUser = getAuthUser(req);
  const cart = getOrCreateCart(db, authUser ? authUser.id : null, getSessionId(req));
  db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(req.params.itemId, cart.id);
  const items = cartItemsWithProducts(db, cart.id);
  res.json({ cart: { items, ...cartSummary(items) } });
});

app.delete('/api/cart', (req, res) => {
  const db = getDb();
  const authUser = getAuthUser(req);
  const cart = getOrCreateCart(db, authUser ? authUser.id : null, getSessionId(req));
  db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
  res.json({ cart: { items: [], totalItems: 0, subtotal: 0 } });
});

app.post('/api/cart/merge', requireAuth, (req, res) => {
  const db = getDb();
  const { session_id } = req.body || {};
  const guestCart = session_id ? db.prepare('SELECT * FROM carts WHERE session_id = ?').get(session_id) : null;
  const userCart = getOrCreateCart(db, req.authUser.id, session_id);
  if (guestCart && guestCart.id !== userCart.id) {
    const guestItems = db.prepare('SELECT * FROM cart_items WHERE cart_id = ?').all(guestCart.id);
    db.exec('BEGIN');
    try {
      guestItems.forEach(gi => {
        const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?').get(userCart.id, gi.product_id);
        if (existing) db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(gi.quantity, existing.id);
        else db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)').run(userCart.id, gi.product_id, gi.quantity);
      });
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(guestCart.id);
      db.prepare('DELETE FROM carts WHERE id = ?').run(guestCart.id);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  }
  const items = cartItemsWithProducts(db, userCart.id);
  res.json({ cart: { items, ...cartSummary(items) } });
});

// ============================================
// PROMO
// ============================================
app.post('/api/promo/validate', (req, res) => {
  const db = getDb();
  const { code } = req.body || {};
  const subtotal = Number((req.body || {}).subtotal);
  if (!code) return res.status(400).json({ error: 'کد لازم است.' });
  if (!Number.isFinite(subtotal) || subtotal < 0) return res.status(400).json({ error: 'جمع معتبر لازم است.' });
  const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND active = 1').get(String(code).toUpperCase().trim());
  if (!promo) return res.status(404).json({ error: 'کد تخفیف معتبر نیست.' });
  if (subtotal < promo.min_subtotal) {
    return res.status(400).json({ error: `حداقل مبلغ سفارش ${new Intl.NumberFormat('fa-IR').format(promo.min_subtotal)} تومان لازم است.` });
  }
  let discount = 0, freeShip = false;
  if (promo.type === 'percent') discount = (subtotal || 0) * (promo.value / 100);
  else if (promo.type === 'freeship') freeShip = true;
  res.json({ promo: { code: promo.code, type: promo.type, value: promo.value, discount, freeShip } });
});

// ============================================
// ORDERS — full lifecycle
// ============================================
app.post('/api/orders', (req, res) => {
  const db = getDb();
  const authUser = getAuthUser(req);
  const body = req.body || {};
  const customer_name = str(body.customer_name, 120);
  const customer_email = str(body.customer_email, 160).toLowerCase();
  const customer_phone = str(body.customer_phone, 32);
  const customer_address = str(body.customer_address, 240);
  const customer_city = str(body.customer_city, 80);
  const customer_state = str(body.customer_state, 80);
  const customer_postal = str(body.customer_postal, 32);
  const customer_country = str(body.customer_country, 80);
  const promo_code = str(body.promo_code, 32);
  const payment_method = PAYMENT_METHODS.has(body.payment_method) ? body.payment_method : 'card';

  const missing = [];
  if (!customer_name) missing.push('name');
  if (!customer_email) missing.push('email');
  if (!customer_address) missing.push('address');
  if (!customer_city) missing.push('city');
  if (!customer_country) missing.push('country');
  if (missing.length) return res.status(400).json({ error: 'فیلدهای لازم سفارش جا افتاده است.' });
  if (!EMAIL_RE.test(String(customer_email))) return res.status(400).json({ error: 'ایمیل معتبر نیست.' });
  if (customer_phone && !PHONE_RE.test(String(customer_phone))) return res.status(400).json({ error: 'شماره تماس معتبر نیست.' });

  const cart = getOrCreateCart(db, authUser ? authUser.id : null, getSessionId(req));
  const items = cartItemsWithProducts(db, cart.id);
  if (!items.length) return res.status(400).json({ error: 'سبد خالی است.' });
  for (const item of items) {
    if (item.quantity > item.stock) return res.status(400).json({ error: `موجودی ${item.name} کافی نیست.` });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  let discount = 0, freeShip = false, promoValid = null;
  if (promo_code) {
    const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND active = 1').get(String(promo_code).toUpperCase().trim());
    if (promo && subtotal >= promo.min_subtotal) {
      if (promo.type === 'percent') discount = subtotal * (promo.value / 100);
      else if (promo.type === 'freeship') freeShip = true;
      promoValid = promo.code;
    }
  }

  const shipping = freeShip || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = Math.max(0, subtotal - discount) + shipping;
  const orderNumber = 'DN-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

  // Payment status: COD → pending/pending; otherwise paid/confirmed
  const isCOD = payment_method === 'cod';
  const status = isCOD ? 'pending' : 'confirmed';
  const payment_status = isCOD ? 'pending' : 'paid';

  db.exec('BEGIN');
  let orderId;
  try {
    const r = db.prepare(`
      INSERT INTO orders (user_id, session_id, order_number, status, payment_status, payment_method,
                          subtotal, discount, shipping, total,
                          customer_name, customer_email, customer_phone, customer_address, customer_city,
                          customer_state, customer_postal, customer_country, promo_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      authUser ? authUser.id : null, getSessionId(req), orderNumber, status, payment_status, payment_method,
      subtotal, discount, shipping, total,
      customer_name, customer_email, customer_phone || null, customer_address, customer_city,
      customer_state || null, customer_postal || null, customer_country, promoValid
    );
    orderId = r.lastInsertRowid;

    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, name, emoji, price, quantity) VALUES (?, ?, ?, ?, ?, ?)');
    items.forEach(i => insertItem.run(orderId, i.product_id, i.name, i.emoji, i.price, i.quantity));

    const decStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    items.forEach(i => decStock.run(i.quantity, i.product_id));

    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
    logOrderStatus(db, orderId, status, isCOD ? 'سفارش ثبت شد. پرداخت هنگام تحویل.' : 'پرداخت دریافت شد. سفارش تأیید شد.');
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC').all(orderId);
  res.status(201).json({ order: { ...order, items: orderItems, history } });
});

app.get('/api/orders', (req, res) => {
  const db = getDb();
  const authUser = getAuthUser(req);
  const { status } = req.query;
  let sql, params;
  if (authUser) {
    sql = status ? 'SELECT * FROM orders WHERE user_id = ? AND status = ? ORDER BY id DESC' : 'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC';
    params = status ? [authUser.id, status] : [authUser.id];
  } else {
    const sid = getSessionId(req);
    sql = status ? 'SELECT * FROM orders WHERE session_id = ? AND status = ? ORDER BY id DESC' : 'SELECT * FROM orders WHERE session_id = ? ORDER BY id DESC';
    params = status ? [sid, status] : [sid];
  }
  res.json({ orders: db.prepare(sql).all(...params) });
});

app.get('/api/orders/:id', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order || !canAccessOrder(req, order)) return res.status(404).json({ error: 'سفارش پیدا نشد.' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC').all(order.id);
  res.json({ order: { ...order, items, history } });
});

// Cancel order (restores stock)
app.post('/api/orders/:id/cancel', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order || !canAccessOrder(req, order)) return res.status(404).json({ error: 'سفارش پیدا نشد.' });
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ error: 'این سفارش دیگر قابل لغو نیست.' });
  }

  const { reason } = req.body || {};
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

  db.exec('BEGIN');
  try {
    // Restore stock
    const incStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    items.forEach(i => { if (i.product_id) incStock.run(i.quantity, i.product_id); });

    db.prepare("UPDATE orders SET status = 'cancelled', payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE 'cancelled' END, cancelled_at = datetime('now'), cancel_reason = ?, updated_at = datetime('now') WHERE id = ?")
      .run((reason || '').trim() || null, order.id);
    logOrderStatus(db, order.id, 'cancelled', reason || 'لغو توسط مشتری.');
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC').all(order.id);
  res.json({ order: { ...updated, history } });
});

// Reorder — add all items back to cart
app.post('/api/orders/:id/reorder', (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order || !canAccessOrder(req, order)) return res.status(404).json({ error: 'سفارش پیدا نشد.' });

  const authUser = getAuthUser(req);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const cart = getOrCreateCart(db, authUser ? authUser.id : null, getSessionId(req));

  db.exec('BEGIN');
  try {
    items.forEach(i => {
      if (!i.product_id) return;
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(i.product_id);
      if (!product) return;
      const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cart.id, i.product_id);
      if (existing) db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(i.quantity, existing.id);
      else db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)').run(cart.id, i.product_id, i.quantity);
    });
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }

  const cartItems = cartItemsWithProducts(db, cart.id);
  res.json({ cart: { items: cartItems, ...cartSummary(cartItems) }, message: 'Items added to your cart.' });
});

// ============================================
// HEALTH
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'datenest', time: new Date().toISOString() });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'مسیر پیدا نشد.' }));

app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ error: 'بدنه JSON نامعتبر است.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'حجم درخواست زیاد است.' });
  }
  console.error('[ERROR]', err && err.message);
  res.status(500).json({ error: 'خطای داخلی سرور.' });
});

app.listen(PORT, () => {
  const db = getDb();
  const pc = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  console.log('==============================================');
  console.log('  NAJLA E-Commerce Server');
  console.log('  http://localhost:' + PORT);
  console.log('  Products in DB: ' + pc);
  console.log('==============================================');
});
