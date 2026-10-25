/* ============================================
   DateNest — Database Layer (SQLite via node:sqlite)
   Professional schema: users, addresses, products,
   carts, orders, order_status_history, promos
   ============================================ */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = process.env.DATENEST_DB_PATH || path.join(__dirname, 'datenest.db');

function createDatabase() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      name               TEXT NOT NULL,
      email              TEXT NOT NULL UNIQUE,
      phone              TEXT,
      password_hash      TEXT NOT NULL,
      email_verified     INTEGER DEFAULT 0,
      verification_token TEXT,
      reset_token        TEXT,
      reset_token_expires TEXT,
      failed_attempts    INTEGER DEFAULT 0,
      locked_until       TEXT,
      is_admin           INTEGER DEFAULT 0,
      created_at         TEXT DEFAULT (datetime('now')),
      updated_at         TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label       TEXT NOT NULL DEFAULT 'Home',
      full_name   TEXT NOT NULL,
      phone       TEXT NOT NULL,
      line1       TEXT NOT NULL,
      line2       TEXT,
      city        TEXT NOT NULL,
      state       TEXT,
      postal_code TEXT,
      country     TEXT NOT NULL,
      is_default  INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL,
      price       REAL NOT NULL,
      old_price   REAL,
      emoji       TEXT NOT NULL,
      description TEXT NOT NULL,
      weight      TEXT NOT NULL,
      badge       TEXT,
      badge_text  TEXT,
      stock       INTEGER DEFAULT 100,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS carts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id    INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity   INTEGER NOT NULL DEFAULT 1,
      UNIQUE(cart_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
      session_id       TEXT,
      order_number     TEXT NOT NULL UNIQUE,
      status           TEXT NOT NULL DEFAULT 'pending',
      payment_status   TEXT NOT NULL DEFAULT 'pending',
      payment_method   TEXT NOT NULL DEFAULT 'card',
      subtotal         REAL NOT NULL,
      discount         REAL NOT NULL DEFAULT 0,
      shipping         REAL NOT NULL DEFAULT 0,
      total            REAL NOT NULL,
      -- Address snapshot
      customer_name    TEXT NOT NULL,
      customer_email   TEXT NOT NULL,
      customer_phone   TEXT,
      customer_address TEXT NOT NULL,
      customer_city    TEXT NOT NULL,
      customer_state   TEXT,
      customer_postal  TEXT,
      customer_country TEXT NOT NULL,
      promo_code       TEXT,
      tracking_number  TEXT,
      cancelled_at     TEXT,
      cancel_reason    TEXT,
      created_at       TEXT DEFAULT (datetime('now')),
      updated_at       TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      name       TEXT NOT NULL,
      emoji      TEXT NOT NULL,
      price      REAL NOT NULL,
      quantity   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status     TEXT NOT NULL,
      note       TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      code         TEXT PRIMARY KEY,
      type         TEXT NOT NULL DEFAULT 'percent',
      value        REAL NOT NULL,
      min_subtotal REAL DEFAULT 0,
      active       INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_order ON order_status_history(order_id);
  `);

  return db;
}

// ====== SEED DATA — mirrors frontend SEED in script.js (Persian, Toman) ======
// فروشگاه تخصصی خرما: فقط خرما و فرآورده‌های آن. ۱۵ محصول در ۴ دسته.
// Frontend source of truth: script.js SEED. Backend must match it exactly.
const SEED_PRODUCTS = [
  { slug: 'medjool', name: 'خرمای مدجول سلطنتی', category: 'premium', price: 849000, old_price: null, emoji: '🌴', description: 'درشت و دست‌چین؛ نرم و عسلی با طعم کارامل.', weight: '۵۰۰ گرم', badge: 'best', badge_text: 'پرفروش‌ترین', stock: 120 },
  { slug: 'ajwa', name: 'خرمای عجوه مدینه', category: 'premium', price: 1290000, old_price: null, emoji: '🖤', description: 'خرمای تیره و اصیل مدینه؛ بافت نرم و طعم عمیق.', weight: '۴۰۰ گرم', badge: 'best', badge_text: 'ممتاز', stock: 60 },
  { slug: 'sukkari', name: 'خرمای شکری', category: 'premium', price: 769000, old_price: null, emoji: '💛', description: 'طلایی و ترد با شیرینی ملایم؛ یار همیشگی چای.', weight: '۵۰۰ گرم', badge: null, badge_text: null, stock: 80 },
  { slug: 'mabroom', name: 'خرمای مبروم', category: 'premium', price: 990000, old_price: 1190000, emoji: '❤️', description: 'کشیده و کم‌پوست با طعم غلیظ شیره‌ای.', weight: '۵۰۰ گرم', badge: 'sale', badge_text: '٪۱۷ تخفیف', stock: 70 },
  { slug: 'deglet', name: 'خرمای دگلت نور', category: 'classic', price: 549000, old_price: 649000, emoji: '🪔', description: 'نیم‌خشک طلایی با طعم عسلی؛ عالی برای پخت.', weight: '۵۰۰ گرم', badge: 'sale', badge_text: '٪۱۵ تخفیف', stock: 90 },
  { slug: 'sayer', name: 'خرمای سایر', category: 'classic', price: 389000, old_price: null, emoji: '🍊', description: 'تیره و پرملات با بافت جویدنی و طعم تافی.', weight: '۵۰۰ گرم', badge: 'new', badge_text: 'جدید', stock: 80 },
  { slug: 'pitted', name: 'خرمای بدون هسته', category: 'classic', price: 429000, old_price: null, emoji: '🌰', description: 'آماده خوردن با عطر پوست پرتقال.', weight: '۴۰۰ گرم', badge: null, badge_text: null, stock: 150 },
  { slug: 'zahedi', name: 'خرمای زاهدی', category: 'classic', price: 329000, old_price: null, emoji: '💛', description: 'خشک و کم‌شیرین؛ انتخاب روزمره و اقتصادی.', weight: '۷۰۰ گرم', badge: null, badge_text: null, stock: 200 },
  { slug: 'khalas', name: 'خرمای خلاص', category: 'classic', price: 459000, old_price: null, emoji: '🤎', description: 'کاراملی و لطیف؛ پرفروش نخلستان‌های جنوب.', weight: '۵۰۰ گرم', badge: null, badge_text: null, stock: 110 },
  { slug: 'mazafati', name: 'خرمای مضافتی بم', category: 'classic', price: 519000, old_price: null, emoji: '🖤', description: 'تازه و آبدار بم با رنگ مشکی براق.', weight: '۵۰۰ گرم', badge: 'new', badge_text: 'تازه رسید', stock: 95 },
  { slug: 'date-syrup', name: 'شیره خرما', category: 'craft', price: 289000, old_price: null, emoji: '🍯', description: 'شیره غلیظ و طبیعی؛ بدون شکر افزوده.', weight: '۶۵۰ گرم', badge: null, badge_text: null, stock: 60 },
  { slug: 'stuffed-dates', name: 'خرمای شکم‌پر', category: 'craft', price: 689000, old_price: null, emoji: '🌰', description: 'مدجول شکم‌پر با گردو و دارچین.', weight: '۴۰۰ گرم', badge: 'best', badge_text: 'پیشنهاد', stock: 75 },
  { slug: 'choco-dates', name: 'خرمای شکلاتی', category: 'craft', price: 759000, old_price: 849000, emoji: '🍫', description: 'خرما با روکش شکلات تلخ ۷۰٪؛ پذیرایی شیک.', weight: '۳۵۰ گرم', badge: 'sale', badge_text: '٪۱۱ تخفیف', stock: 85 },
  { slug: 'gift-box', name: 'جعبه هدیه ظرافت', category: 'gifts', price: 1890000, old_price: null, emoji: '🎁', description: 'چهار رقم ممتاز در جعبه مخمل یادگاری.', weight: '۱ کیلوگرم', badge: 'new', badge_text: 'جدید', stock: 50 },
  { slug: 'royal-bundle', name: 'کالکشن سلطنتی مدجول', category: 'gifts', price: 2890000, old_price: 3290000, emoji: '🎁', description: 'مدجول جامبو با بادام و شکلات در جعبه چرمی نفیس.', weight: '۱٫۲ کیلوگرم', badge: 'best', badge_text: 'محدود', stock: 500 },
];

const SEED_PROMOS = [
  { code: 'WELCOME10', type: 'percent', value: 10, min_subtotal: 0, active: 1 },
  { code: 'DATES20', type: 'percent', value: 20, min_subtotal: 500000, active: 1 },
  { code: 'FREESHIP', type: 'freeship', value: 0, min_subtotal: 0, active: 1 },
];

function seedDatabase(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (count > 0) {
    console.log(`[DB] Products already seeded (${count} rows). Skipping seed.`);
    return;
  }
  const insertProduct = db.prepare(`
    INSERT INTO products (slug, name, category, price, old_price, emoji, description, weight, badge, badge_text, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPromo = db.prepare('INSERT INTO promo_codes (code, type, value, min_subtotal, active) VALUES (?, ?, ?, ?, ?)');
  db.exec('BEGIN');
  try {
    SEED_PRODUCTS.forEach(p => insertProduct.run(p.slug, p.name, p.category, p.price, p.old_price, p.emoji, p.description, p.weight, p.badge, p.badge_text, p.stock));
    SEED_PROMOS.forEach(p => insertPromo.run(p.code, p.type, p.value, p.min_subtotal, p.active));
    db.exec('COMMIT');
    console.log(`[DB] Seeded ${SEED_PRODUCTS.length} products and ${SEED_PROMOS.length} promo codes.`);
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function getDb() {
  if (!global.__datenest_db) {
    global.__datenest_db = createDatabase();
    seedDatabase(global.__datenest_db);
  }
  return global.__datenest_db;
}

module.exports = { getDb, DB_PATH };

if (require.main === module) {
  const db = getDb();
  console.log('[DB] Database ready at', DB_PATH);
  const pc = db.prepare('SELECT COUNT(*) as c FROM products').get();
  const uc = db.prepare('SELECT COUNT(*) as c FROM users').get();
  console.log(`[DB] Products: ${pc.c}, Users: ${uc.c}`);
  db.close();
  process.exit(0);
}
