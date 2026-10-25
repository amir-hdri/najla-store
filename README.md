# NAJLA

فروشگاه تخصصی خرما و میوه (فارسی، راست‌به‌چپ) — SPA با React + Vite + Tailwind، پس‌زمینه‌ی Express + SQLite.

## Run

Requires **Node.js ≥ 22.5** (the API uses the built-in `node:sqlite` module).

```bash
cd projects/dates-fruits-store
npm install          # once — express, bcryptjs, jsonwebtoken
npm run build        # build the React client → client/dist
npm start            # http://localhost:3000
```

Other commands:

```bash
npm run dev          # API with --watch + Vite dev server (proxy /api → :3000)
npm run seed         # create + seed the SQLite DB, then exit
npm test             # API + static-contract tests (node:test)
PORT=4000 npm start
```

In development, open the Vite URL (default http://localhost:5173) — it proxies
`/api` to the Express server on :3000.

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `JWT_SECRET` | random per boot in dev | **must be set in production** — the server refuses to start without it when `NODE_ENV=production` |
| `NODE_ENV` | – | `production` enables stricter security behaviour |
| `DATENEST_DB_PATH` | `./datenest.db` | SQLite file location (legacy env name kept for compatibility; used by the test suite) |
| `CORS_ORIGINS` | empty | Comma-separated origins allowed to call the API cross-origin |

---

## Project layout

```
dates-fruits-store/
├── client/             React SPA (Vite + TS + Tailwind v4 + shadcn/ui + framer-motion)
│   ├── src/            components, contexts, lib, art (portable SVG illustrations)
│   ├── public/         self-hosted fonts, favicon
│   └── dist/           built output (served by Express)
├── server.js           Express API (auth, cart, catalog, orders, addresses)
├── db.js               SQLite schema + seed
├── test/               api.test.mjs, static.test.mjs
└── datenest.db         created on first run (git-ignored; env name kept for compatibility)
```

---

## How the pieces fit

1. **Client** (`client/`): a single-page React app branded **NAJLA / نجلا**.
   - Catalog, cart drawer, promo codes, 3-step checkout, account panel (profile,
     password, addresses, orders with cancel/reorder).
   - Talks to the same-origin API at `/api/*` (Bearer JWT + `X-Session-Id` for guest carts).
   - Persian RTL, light/dark toggle, self-hosted Vazirmatn font, no external origins/CDN.
2. **Server** (`server.js`): Express 4 + `node:sqlite`.
   - Static serving is an allowlist: only `client/dist` (SPA fallback for unknown
     non-API paths). `server.js`, `db.js`, `datenest.db`, `package.json` stay private.
   - API contract is frozen — see `test/api.test.mjs` for the authoritative shape.
3. **Database** (`db.js`): schema + seed products (prices in Toman). Delete the
   DB file and restart (or run `npm run seed`) to re-seed.

---

## Testing

```bash
npm run build && npm test
```

- `test/api.test.mjs` — health, catalog, cart, promo, orders, addresses, auth.
- `test/static.test.mjs` — SPA contract: `lang="fa"` / `dir="rtl"`, no remote
  origins in shipped assets, no inline `<script>`, SPA fallback vs API 404,
  secrets not exposed over HTTP.

Client unit tests (format helpers, product art) live next to the source under
`client/src` and run via `npm test --prefix client` (vitest).

---

## Notes

- The health endpoint still reports `service: "datenest"` for API-contract
  compatibility — the product itself is **NAJLA**.
- Env var `DATENEST_DB_PATH` and the on-disk filename `datenest.db` are kept
  as legacy names so existing test harnesses and scripts continue to work.
