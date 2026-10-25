# NAJLA React Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire vanilla DateNest frontend with a light, animated React SPA branded NAJLA (نجلا), keeping the Express + SQLite API unchanged and ending with no old frontend files on disk.

**Architecture:** New `client/` Vite + React + TS + Tailwind v4 + shadcn/ui SPA talks to the same API (`/api/*`). `server.js` stops serving root static files and serves `client/dist` instead (SPA fallback). Old files (`index.html`, `styles.css`, `script.js`, `art.js`, `vendor/`, `date-3d.*`) are deleted in the final task; product SVG art is ported into the client first.

**Tech Stack:** Vite 7, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui (Radix), framer-motion, lucide-react, react-router-dom v7; server stays Express 4 + `node:sqlite` + bcryptjs + jsonwebtoken (no new server deps except dev-runners).

**Spec:** `docs/superpowers/specs/2026-10-11-najla-react-redesign-design.md`

## Global Constraints

- Node ≥ 22.5 (`engines` already set). npm only.
- Brand/copy: user-facing text Persian, `dir="rtl" lang="fa"`; brand name **NAJLA / نجلا**. Prices via `new Intl.NumberFormat('fa-IR').format(n) + ' تومان'`.
- **API contract frozen** — no route, payload, or header changes. Headers: `Authorization: Bearer <jwt>`, `X-Session-Id: /^[A-Za-z0-9._-]{6,64}$/` (client generates `sess-` + 20 hex chars and persists in `localStorage` key `najla_sid`; JWT in `localStorage` key `najla_token`).
- No external origins anywhere in shipped output (tests assert). No remote fonts (use `assets/fonts/` if fonts.css exists, else system stack `Tahoma, "Segoe UI", system-ui, sans-serif`).
- CSP is frozen in `server.js` (`script-src 'self'`, `style-src 'self' 'unsafe-inline'`) — the built SPA must satisfy it (no inline `<script>`; framer-motion inline styles are covered by `'unsafe-inline'` styles).
- `FREE_SHIPPING_THRESHOLD = 500000`, `SHIPPING_COST = 49000` (server truth; client only displays what server computes — client computes shipping display as `subtotal >= 500000 ? 0 : 49000`, `freeship` promo forces 0, matching existing `script.js` logic).
- `npm test` at repo root must stay green at every task boundary (node:test). No git repo exists — do **not** create commits; tasks verify with commands only.
- Dev proxy: Vite dev server proxies `/api` → `http://127.0.0.1:3000`. `npm run dev` (root) runs API with `node --watch server.js` and Vite together.
- Do not invent products/promos — server `db.js` seed is the source of truth.
- Dark/light toggle via `data-theme="light|dark"` on `<html>`, persisted in `localStorage` key `najla_theme` (same UX as today).

## Review Focus

1. **SPA fallback vs API 404s** — unknown non-API paths must return `client/dist/index.html`, but unknown `/api/*` paths must stay JSON 404. Test: after Task 1, `GET /some/page` → 200 HTML, `GET /api/nope` → 404 JSON (add to `test/static.test.mjs`).
2. **Guest session continuity across login** — after login, client must call `POST /api/cart/merge` with `session_id` (current sid) before refreshing cart, or guest cart is lost. Test: manual checklist step in Task 6 + keep existing merge API test green.
3. **Order payload field names** — server requires flat `customer_name`, `customer_email`, `customer_address`, `customer_city`, `customer_country` (+ optional `customer_phone/state/postal`, `payment_method`, `promo_code`). Wrong nesting silently 400s. Test: Task 7 reuses the exact body shape from `test/api.test.mjs:254-261`.
4. **Stock/quantity guard** — server rejects qty > stock and non-integer qty 1..99 with 400 + Persian message. Client must surface `error` from JSON body, not swallow it. Test: Task 5 asserts UI shows server error on over-stock add (manual + error-path unit of cart context).
5. **RTL regressions under Tailwind** — shadcn defaults are LTR. Every layout task must verify logical-property utilities / `dir=rtl` visually; final a11y/polish task runs a checklist (dialogs, drawer side, form order, badges). Test: Task 8 checklist.

---

### Task 1: Scaffold `client/` + serve the SPA from Express

**Files:**
- Create: `client/` (full Vite scaffold: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, components.json for shadcn)
- Modify: `server.js` (static block at lines 38–57 and 120–135; `PUBLIC_FILES`/`PUBLIC_DIRS`)
- Modify: root `package.json` (`scripts` only: `dev`, `build`, `dev:server`)
- Modify: `test/static.test.mjs` (rewrite — see below)
- Modify: `test/api.test.mjs` only if it fetches old static paths (check; keep API assertions)

**Interfaces:**
- Produces: `npm run build` → `client/dist/index.html` + hashed assets; `npm run dev` → Express on :3000 + Vite on :5173 with `/api` proxy; root `npm test` green.

**Steps:**

- [ ] **Step 1: Scaffold the Vite app**

```bash
cd /Users/amirheidari/GitHub/Najla/projects/dates-fruits-store
npm create -w client vite@latest client -- --template react-ts
```
(If `-w` unsupported, scaffold into `client/` manually by writing the standard react-ts files.) Then inside `client/`: `npm i`, `npm i tailwindcss @tailwindcss/vite`, `npm i framer-motion lucide-react react-router-dom class-variance-authority clsx tailwind-merge`, `npx shadcn@latest init` (base color neutral, CSS variables yes), `npx shadcn@latest add button card dialog sheet input label badge separator select textarea skeleton`.

- [ ] **Step 2: Configure Vite + RTL shell**

`client/vite.config.ts`: `plugins: [react(), tailwindcss()]`, `server.proxy: { '/api': 'http://127.0.0.1:3000' }`, `build.outDir: 'dist'`.
`client/index.html`: `<html lang="fa" dir="rtl">`, `<title>NAJLA | فروشگاه تخصصی خرما</title>`, meta description ≥ 20 chars Persian, viewport. `src/index.css`: Tailwind v4 import, shadcn tokens, `@import` local fonts if `assets/fonts/fonts.css` exists (copy fonts into `client/public/fonts/` from repo `assets/fonts/`), `prefers-reduced-motion` global rule that disables animations.
Placeholder `src/App.tsx` renders `<main dir="rtl">NAJLA</main>`.

- [ ] **Step 3: Point Express at the dist build**

In `server.js`: replace the static block so non-`/api` GETs resolve inside `client/dist` — send `client/dist/index.html` for extensionless paths (SPA fallback), `res.sendFile` for existing dist files (including `/assets/*` hashed files), 404 otherwise. Update `PUBLIC_FILES`/`PUBLIC_DIRS` comments; leave old allowlist intact until Task 8 deletes old files (harmless). Add `const CLIENT_DIST = path.join(ROOT_DIR, 'client', 'dist')`. If `client/dist/index.html` is missing (not built yet), send a plain-text hint to run `npm run build` (503).
Root `package.json` scripts: `"build": "npm run build --prefix client"`, `"dev:server": "node --watch server.js"`, `"dev:client": "npm run dev --prefix client"`, `"dev": "node server.js & npm run dev --prefix client"` (document that `npm run build && npm start` is the production path; `start` unchanged).

- [ ] **Step 4: Rewrite `test/static.test.mjs` for the new contract**

Keep file name. New tests (drop all `index.html`/`styles.css`/`script.js`/`art.js`/demo-mode assertions):
1. `client/dist/index.html` exists and is non-empty; contains `lang="fa"` and `dir="rtl"`.
2. No file under `client/dist` references a remote asset: scan all `.html/.js/.css` for `(src|href)=["'](https?:)?//` and `url(https?:` — zero matches (allow `w3.org` in inlined SVG only).
3. `client/dist/index.html` has no inline `<script>` and no `on*=` handlers.
4. SPA fallback vs API 404: spawn-free check is hard here — instead assert via the existing api.test harness style: add two tests to `test/api.test.mjs` in this task: `GET /about` → 200 + `text/html` (after build), `GET /api/nope` → 404 + `application/json`.
5. Root no longer exposes secrets: `GET /server.js`, `GET /datenest.db` → 404.
Note: tests that need `client/dist` must skip with a clear message if dist is absent, and CI order is `npm run build && npm test`.

- [ ] **Step 5: Build + full test pass**

Run: `npm run build && npm test`
Expected: build succeeds; all tests green (old api tests + new static/dist contract).

### Task 2: API client, types, and app contexts

**Files:**
- Create: `client/src/lib/types.ts`, `client/src/lib/api.ts`, `client/src/lib/format.ts`, `client/src/lib/session.ts`
- Create: `client/src/context/CartContext.tsx`, `client/src/context/AuthContext.tsx`, `client/src/context/ThemeContext.tsx`
- Test: `client/src/lib/format.test.ts` (vitest) — add `vitest` as client devDep

**Interfaces (exact — later tasks consume these):**

```ts
// types.ts
export type CategorySlug = 'premium' | 'classic' | 'craft' | 'gifts';
export interface Product { id: number; slug: string; name: string; category: CategorySlug; price: number; old_price: number | null; emoji: string; description: string; weight: string; badge: string | null; badge_text: string | null; stock: number; }
export interface CategoryRow { category: CategorySlug; count: number; }
export interface CartItem { item_id: number; product_id: number; name: string; emoji: string; price: number; old_price: number | null; category: CategorySlug; weight: string; stock: number; quantity: number; }
export interface Cart { items: CartItem[]; totalItems: number; subtotal: number; }
export interface PromoInfo { code: string; type: 'percent' | 'freeship'; value: number; discount: number; freeShip: boolean; }
export interface User { id: number; name: string; email: string; phone: string | null; }
export interface OrderItemRow { name: string; emoji: string; price: number; quantity: number; product_id: number | null; }
export interface Order { id: number; order_number: string; status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled'; payment_status: 'pending'|'paid'|'refunded'|'failed'; payment_method: 'card'|'paypal'|'cod'; subtotal: number; discount: number; shipping: number; total: number; customer_name: string; customer_email: string; customer_phone: string | null; customer_address: string; customer_city: string; customer_country: string; promo_code: string | null; created_at: string; items: OrderItemRow[]; }
export interface OrderPayload { customer_name: string; customer_email: string; customer_phone?: string; customer_address: string; customer_city: string; customer_state?: string; customer_postal?: string; customer_country: string; payment_method: 'card'|'paypal'|'cod'; promo_code?: string; }
```

```ts
// api.ts — all functions send Content-Type: application/json; X-Session-Id from session.ts; Authorization when token present; throw Error(body.error) on !ok
export function api<T>(path: string, opts?: { method?: string; body?: unknown }): Promise<T>;
export const AuthAPI = {
  register(input: { name: string; email: string; password: string; phone?: string }): Promise<{ token: string; user: User }>;
  login(input: { email: string; password: string }): Promise<{ token: string; user: User }>;
  me(): Promise<{ user: User }>;
  updateProfile(input: { name?: string; phone?: string }): Promise<{ user: User }>;
  changePassword(input: { current_password: string; new_password: string }): Promise<{ ok: boolean }>;
  mergeCart(): Promise<Cart>; // POST /api/cart/merge { session_id: getSid() }
};
export const CatalogAPI = {
  listProducts(params?: { category?: string; search?: string; sort?: string }): Promise<{ products: Product[] }>;
  getProduct(id: number): Promise<{ product: Product }>;
  listCategories(): Promise<{ categories: CategoryRow[] }>;
};
export const CartAPI = {
  get(): Promise<{ cart: Cart }>;
  add(product_id: number, quantity?: number): Promise<{ cart: Cart }>;
  update(item_id: number, quantity: number): Promise<{ cart: Cart }>;
  remove(item_id: number): Promise<{ cart: Cart }>;
  clear(): Promise<{ cart: Cart }>;
};
export const PromoAPI = { validate(code: string, subtotal: number): Promise<{ promo: PromoInfo }> };
export const OrdersAPI = {
  create(payload: OrderPayload): Promise<{ order: Order }>;
  list(): Promise<{ orders: Order[] }>;
  cancel(id: number): Promise<{ order: Order }>;
  reorder(id: number): Promise<{ cart: Cart }>;
};
```

```ts
// format.ts
export function formatToman(n: number): string;       // fa-IR + ' تومان'
export function shippingFor(subtotal: number, freeShip: boolean): number; // freeShip || subtotal >= 500000 ? 0 : 49000
export function cartTotals(subtotal: number, promo: PromoInfo | null): { discount: number; shipping: number; total: number };
```

Contexts:
- `ThemeContext`: `{ theme: 'light'|'dark'; toggle(): void }` — sets `data-theme` on `document.documentElement`, persists `najla_theme`.
- `AuthContext`: `{ user: User | null; token: string | null; login; register; logout; refresh }` — on login/register success call `AuthAPI.mergeCart()` then `CartAPI.get()` to refresh global cart.
- `CartContext`: `{ cart: Cart; open: boolean; setOpen(v: boolean): void; add(productId: number, qty?: number): Promise<void>; update(itemId, qty); remove(itemId); clear(); promo: PromoInfo | null; setPromo(p: PromoInfo | null); refresh(): Promise<void>; lastError: string | null }` — every mutator catches server `{ error }` into `lastError`.

- [ ] **Step 1: Add vitest to client + write failing format tests**

`client/package.json`: devDep `vitest`; script `"test": "vitest run"`.
Write `client/src/lib/format.test.ts`: `formatToman(849000)` → contains `۸۴۹` and `تومان`; `shippingFor(500000, false)` → 0; `shippingFor(499999, false)` → 49000; `shippingFor(0, true)` → 0; `cartTotals(100000, {type:'percent',value:10,…} as any)` → discount 10000, shipping 49000, total 139000.

- [ ] **Step 2: Run vitest — FAIL (module missing)**

Run: `npm test --prefix client` → expected FAIL.

- [ ] **Step 3: Implement `format.ts`, then `types.ts`, `session.ts`, `api.ts`**

`session.ts`: `getSid(): string` (create/persist `najla_sid`), `getToken/setToken/clearToken` around `najla_token`.
`api.ts`: single `api()` helper as above; map non-JSON or network failure to `Error('ارتباط با سرور برقرار نشد.')`.

- [ ] **Step 4: Implement contexts**

CartContext loads `CartAPI.get()` on mount; AuthContext restores token via `AuthAPI.me()` on mount (401 → clear token silently).

- [ ] **Step 5: Run tests + typecheck**

Run: `npm test --prefix client && npx tsc -b client` (or `npm run build --prefix client`) → PASS.

### Task 3: App shell — header, footer, theme, hero

**Files:**
- Create: `client/src/components/layout/Header.tsx`, `Footer.tsx`, `ThemeToggle.tsx`, `CartButton.tsx`
- Create: `client/src/components/home/Hero.tsx`, `TrustStrip.tsx`, `Newsletter.tsx`
- Modify: `client/src/App.tsx` (providers + layout + router)
- Create: `client/src/lib/cartAnim.ts` — shared `useAddToCartFeedback` (toast + badge bump via framer-motion)

**Interfaces:**
- Consumes: contexts from Task 2; `formatToman`.
- Produces: `Header` props: `{ onOpenCart(): void; onOpenAuth(): void }` (auth dialog mounted in Task 6 — render a stub `Dialog` placeholder now that Task 6 fills); `Hero` self-contained CTA scrolls to `#products`.

**Steps:**

- [ ] **Step 1: Build Header/Footer/ThemeToggle**

Header (sticky, blurred bg): NAJLA wordmark (text, `font-black tracking-tight`), nav anchors (فروشگاه، هدیه‌ها، درباره ما), `ThemeToggle`, `CartButton` (lucide `ShoppingBag` + animated count badge via `motion.span` key={totalItems}), account button (lucide `UserRound`). RTL-safe: use logical utilities (`ps-`, `pe-`, `start-`, `end-`).
Footer: brand blurb Persian, category links, newsletter stub from Task 3, copyright `© ۱۴۰۵ نجلا`.
Global CSS: reduced-motion media query kills `* { animation: none !important; transition: none !important }`.

- [ ] **Step 2: Hero + TrustStrip + Newsletter**

Hero: two-column (image side = large emoji/SVG art placeholder for now), headline Persian («خرمای اصیل، از نخلستان تا سفره‌ی شما»), subcopy, CTA button `#products` + secondary «مشاهده هدیه‌ها» filtering to `gifts`. framer-motion `initial={{ opacity:0, y:24 }} whileInView` entrance, staggered children.
TrustStrip: 4 items (ارسال سریع / تازگی تضمینی / پرداخت امن / بسته‌بندی هدیه) with lucide icons.
Newsletter: email input + button; on submit show local success state (no backend endpoint exists — copy must not imply server storage; label «عضویت در خبرنامه (نمایشی)» or wire to nothing but optimistic UI — prefer optimistic local thanks message).

- [ ] **Step 3: Wire App.tsx + verify in browser**

Run: `npm run build --prefix client` and `npm start` (root, after build) → visual check: RTL header, theme toggle flips tokens, hero animates once, reduced-motion respected (toggle OS setting). Fix until clean.

### Task 4: Catalog — grid, filters, quick view, product art

**Files:**
- Create: `client/src/art/productArt.ts` (port from old `art.js` — copy all 15 slug SVGs + 4 category SVGs as exported string map `PRODUCT_ART: Record<string, string>` and `CATEGORY_ART: Record<string, string>`, viewBox `0 0 400 300`)
- Create: `client/src/components/catalog/ProductGrid.tsx`, `ProductCard.tsx`, `FilterBar.tsx`, `QuickViewDialog.tsx`, `ProductArt.tsx` (renders SVG string via `dangerouslySetInnerHTML` — art is build-time constant, not user input)
- Modify: `client/src/App.tsx` (catalog section id=`products`)

**Interfaces:**
- Consumes: `CatalogAPI`, `CartContext.add`.
- Produces: `ProductCard` props `{ product: Product; onQuickView(p: Product): void }`; FilterBar state URL-optional (local state fine): `{ category, search, sort }` — passes to `CatalogAPI.listProducts`.

**Steps:**

- [ ] **Step 1: Port art from `art.js`**

Read old `art.js` (repo root) and transcribe every entry of `DATENEST_ART.slugs` / `.categories` into `productArt.ts` exports. Do not invent new art; strings byte-identical to the source SVGs.

- [ ] **Step 2: FilterBar + ProductGrid against real API**

FilterBar: category chips (همه + 4 categories with counts from `CatalogAPI.listCategories()`), search input (debounce 300ms), sort select (پیش‌فرض / قیمت: کم به زیاد / قیمت: زیاد به کم / نام). Empty state: «محصولی پیدا ندیدیم».
ProductGrid: responsive grid (1/2/3 cols), card = `ProductArt`, name, weight, price (`formatToman`, old_price struck when present), badge chip, add-to-cart button (disabled at `stock <= 0` → «ناموجود»), quick-view on card click.

- [ ] **Step 3: QuickViewDialog + add-to-cart feedback**

shadcn `Dialog`: large art, description, qty stepper (1..min(stock,99)), price, add button → `CartContext.add` + open cart drawer (drawer is Task 5; for now just badge bump + brief toast using a tiny `sonner`-less inline toast — or add `sonner` via shadcn if trivial).
Verify: `npm run build --prefix client && npm start` → filter/search/sort/quick-view/add all work against seeded DB.

### Task 5: Cart drawer + promo

**Files:**
- Create: `client/src/components/cart/CartDrawer.tsx`, `CartItemRow.tsx`, `PromoField.tsx`, `CartSummary.tsx`
- Modify: `client/src/components/layout/CartButton.tsx` (open drawer)

**Interfaces:**
- Consumes: `CartContext` (incl. `promo`, `setPromo`, `lastError`), `PromoAPI.validate`, `shippingFor`/`cartTotals`, `formatToman`.
- Produces: `CartDrawer` props `{ open: boolean; onOpenChange(v: boolean): void; onCheckout(): void }` — checkout wired in Task 7 (render button disabled until then with TODO prop).

**Steps:**

- [ ] **Step 1: Drawer + rows**

`Sheet` side=`end` (RTL-correct). Row: art thumb, name, weight, unit price, qty stepper (`CartContext.update`, optimistic close to server limits — clamp 1..min(99, stock)), remove button (lucide `Trash2`), line total. Footer: subtotal, free-shipping progress bar toward ۵۰۰٬۰۰۰ تومان (hide when already free), total after promo/shipping.
Empty state: «سبد خریدت خالیه» + CTA close.

- [ ] **Step 2: PromoField**

Input + «اعمال» → `PromoAPI.validate(code, cart.subtotal)`; success → `setPromo`, show chip with remove; error → show server message (Persian) inline. `freeship` type zeroes shipping in summary.

- [ ] **Step 3: Error surfacing + verify**

Force an over-stock add (set qty 99 twice on a low-stock product, e.g. stock 50 gift-box) → `lastError` toast visible with server Persian text.
Run: `npm test && npm run build --prefix client` → green.

### Task 6: Auth dialogs, account panel, orders

**Files:**
- Create: `client/src/components/auth/AuthDialog.tsx` (tabs: ورود / ثبت‌نام)
- Create: `client/src/components/account/AccountDialog.tsx` (profile form, change password, saved addresses CRUD, orders list)
- Create: `client/src/components/orders/OrderCard.tsx` (status chips, cancel + reorder buttons)
- Modify: `client/src/components/layout/Header.tsx` (replace stub with real AuthDialog/AccountDialog mount)

**Interfaces:**
- Consumes: `AuthContext`, `OrdersAPI`, `AddressesAPI` (add to `api.ts` in this task: `listAddresses/postAddress/putAddress/deleteAddress/setDefaultAddress` matching server routes `/api/addresses*`), `CartContext.refresh` after reorder.

**Steps:**

- [ ] **Step 1: AuthDialog**

Register fields: نام، ایمیل، گذرواژه (حداقل ۸ کاراکتر client-side), تلفن (optional). Login: ایمیل + گذرواژه. On success: `AuthContext` stores token, mergeCart runs, dialog closes, header shows user name. Errors: render server `error` string.

- [ ] **Step 2: AccountDialog + addresses**

Profile save → `AuthAPI.updateProfile`; password change → `AuthAPI.changePassword` (clear token + require re-login on success). Address list with default star, add/edit `Dialog` form (label, full_name, phone, line1, line2, city, state, postal_code, country default `ایران`), delete with confirm.

- [ ] **Step 3: Orders + cancel/reorder**

`OrdersAPI.list()`; each `OrderCard`: order_number, fa date (`new Intl.DateTimeFormat('fa-IR').format(new Date(o.created_at))`), status label map (pending: در انتظار بررسی، processing: در حال آماده‌سازی، shipped: ارسال شده، delivered: تحویل شده، cancelled: لغو شده), payment_status map, items mini-list, totals. Cancel button only when `status === 'pending'` → confirm → `OrdersAPI.cancel`. Reorder → `OrdersAPI.reorder` → `CartContext.refresh()` + open cart.
Verify end-to-end with real register/login/order flow via `npm start`.

### Task 7: 3-step checkout

**Files:**
- Create: `client/src/components/checkout/CheckoutDialog.tsx`, `CheckoutAddressStep.tsx`, `CheckoutPaymentStep.tsx`, `CheckoutReviewStep.tsx`, `CheckoutSuccess.tsx`
- Modify: `client/src/components/cart/CartDrawer.tsx` (enable onCheckout)

**Interfaces:**
- Consumes: `OrdersAPI.create(OrderPayload)`, `CartContext` (promo, cart), `shippingFor`/`cartTotals`, `AuthContext.user` (prefill).
- Produces: `CheckoutDialog` props `{ open; onOpenChange(v) }`.

**Steps:**

- [ ] **Step 1: Address step (1/3)**

Fields exactly matching `OrderPayload` client mapping (reuse `script.js` field map names: customer_name, customer_email, customer_phone, customer_city, customer_address, customer_country; optional state/postal). Prefill from `AuthContext.user` and default address when logged in. Client validation: required name/email/address/city/country + email regex + phone optional pattern `^[+0-9()\-\s]{6,20}$`. Stepper UI shows ۱-نشانی / ۲-پرداخت / ۳-بررسی.

- [ ] **Step 2: Payment step (2/3)**

Radio cards: درگاه بانکی (card) / پی‌پال (paypal) / پرداخت در محل (cod) with Persian labels — values exactly `card|paypal|cod`. Note copy: «پرداخت آنلاین در این نسخه نمایشی است؛ سفارش‌های کارتی بلافاصله پرداخت‌شده ثبت می‌شوند» (matches server behavior).

- [ ] **Step 3: Review + submit (3/3) + success**

Review lists items, address, payment method, promo chip, totals (`cartTotals`). Submit → `OrdersAPI.create({ ...flat customer fields, payment_method, promo_code: promo?.code })`. On 400, show server error on current step. On success: replace dialog body with `CheckoutSuccess` (order_number in `fa-IR` digits, thank-you copy), clear cart + promo, close drawer.
Verify: full guest checkout + logged-in checkout + invalid email + COD path; `npm test && npm run build --prefix client`.

### Task 8: Polish, a11y, old-file purge, docs

**Files:**
- Delete: `index.html`, `styles.css`, `script.js`, `art.js`, `date-3d.html`, `date-3d.js`, `date-3d.css`, `vendor/` (entire dir), `DELIVERY.md`
- Modify: `server.js` (`PUBLIC_FILES` → only `favicon.ico`, `robots.txt`, `manifest.webmanifest` if those exist under dist; delete root static allowlist for old files; move any needed favicon into `client/public/`)
- Modify: `test/api.test.mjs`, `test/static.test.mjs` (remove any remaining old-path assertions)
- Rewrite: `README.md` (NAJLA, new stack, commands: `npm run build && npm start`, `npm run dev`, `npm test`, `npm run seed`)
- Modify: `package.json` name → `najla`, description Persian/English brand line
- Create: `client/src/components/motion/motionConfig.tsx` if needed (central reduced-motion gate); polish imports across components

**Steps:**

- [ ] **Step 1: Visual + a11y polish pass**

Walk Vercel Web Interface Guidelines checklist on every surface: focus-visible rings on all interactive elements; contrast AA on badges/prices in both themes; dialogs trap focus + Esc close (Radix default — verify); touch targets ≥ 44px; form labels bound (shadcn Label+Input ids); `aria-live` on cart total and toast errors; images/SVG art `aria-hidden` when decorative + `role="img" aria-label` on product art. Micro-interaction pass: cart badge bump, add-button press scale, drawer spring (framer-motion), hero stagger — all behind reduced-motion gate.

- [ ] **Step 2: Purge old frontend**

Delete the files listed above. Grep repo (excluding `node_modules`, `client/node_modules`, `.superpowers`, `docs/`, `datenest.db`) for `datenest|DateNest|DATENEST_ART` — update remaining hits in `server.js` logs/comments to NAJLA wording where user-visible; internal env var names (`DATENEST_DB_PATH`, tests) stay for compatibility (note in README).

- [ ] **Step 3: Final gates**

Run: `npm run build && npm test`
Expected: all green; `GET /` serves NAJLA SPA; `GET /index.html` (old path) either 404s or serves the new SPA (SPA fallback is acceptable — assert one of the two in static tests, don't require 404).
Run Lighthouse mobile on `http://127.0.0.1:3000` (performance ≥ 80 target, a11y ≥ 95) and fix top findings within scope.
Present the running app to the human for the final design pass (iterations happen live).
