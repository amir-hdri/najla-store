# NAJLA — بازطراحی فرانت‌اند فروشگاه خرما (Design Document)

**Date:** 2026-10-11
**Status:** approved by human (2026-10-11), with one amendment: **old frontend is fully deleted** — nothing of the DateNest vanilla UI remains on disk.
**Review channel (answered):** local only — `npm run dev` / `npm start`. The old AutoClaw static preview (`website-fa0311071a2cbdfc916a40e4`) is retired with the old files; no client-side mock API layer is built for it.
**Repo:** `projects/dates-fruits-store` (workspace: `Najla`)

## 1. Intent

Rebrand and rebuild the storefront of a Persian specialty **dates (خرما)** e-commerce from the current vanilla HTML/CSS/JS app ("DateNest") into a modern, light, animation-rich **React web app** branded **NAJLA / نجلا**. The backend (Express + SQLite) already works and stays. The user rejected three earlier visual mockup directions (warm-luxury, modern-minimal, vibrant-market); the new direction is: **light, exclusive, modern, animated** — refined iteratively on real running components, not on more static mockups.

## 2. Goals

- **Brand:** store is renamed **NAJLA** (Persian: نجلا). All user-facing copy Persian, `dir="rtl"`, `lang="fa"`.
- **Stack (frontend):** Vite + React + TypeScript + Tailwind CSS + shadcn/ui, as a SPA ("وب‌اپ").
- **Stack (backend):** keep `server.js` + `db.js` (Express + `node:sqlite`) and the existing JSON API **unchanged in contract**.
- **Look & feel:** light-first (روشن و سبک), airy spacing, warm date-inspired accents (not dark luxury, not loud market), tasteful modern **animations** (page/section entrances, cart micro-interactions, hover states) — all respecting `prefers-reduced-motion`.
- **Feature parity:** catalog + category filter + search + sort, product quick-view, cart (add/qty/remove/clear), promo codes, 3-step checkout, guest + registered orders, auth (register/login/logout, JWT), order history + reorder + cancel, newsletter form, dark/light theme toggle, account modal.
- **Quality bar:** WCAG AA contrast, full keyboard support, focus-visible states (per Vercel Web Interface Guidelines), Lighthouse mobile ≥ 90 target, tests green.

## 3. Non-goals / Anti-goals

- No real payment gateway; card/paypal stay simulated exactly as today (server marks non-COD as paid).
- No admin panel, no email delivery, no PWA service worker (manifest optional, low priority).
- No change to DB schema or API routes. No mobile app.
- Anti-goal: no external CDNs, no remote fonts, no runtime remote assets — everything bundled/served same-origin (existing test constraint).

## 4. Architecture decisions

- **Monorepo layout:** `client/` (Vite React app) + existing `server.js`, `db.js`, `test/` at root. Server serves `client/dist` static build + API. Dev: Vite dev server with `/api` proxy to Express; `npm run dev` runs both (concurrently or simple npm script pair).
- **Demo/static mode is dropped** (builder call): the old "open index.html without server" localStorage mode does not survive a React SPA. Everything runs through Express (which serves the built SPA). API-availability check (`/api/health`) is removed.
- **Server static allowlist updated:** serve `client/dist/**` (hashed assets) instead of root `index.html/styles.css/script.js/art.js`. **Old frontend files are deleted as part of the migration** (user amendment): `index.html`, `styles.css`, `script.js`, `art.js`, `vendor/`, `date-3d.html/js/css`, and the old static-serving allowlist entries. Illustrations needed by the new app are ported into `client/src` first, then the old files go. Delivery/design notes that only describe the old UI (`DELIVERY.md` AutoClaw flow) are removed or rewritten; `README.md` is rewritten for the new stack.
- **CSP:** keep `script-src 'self'` (Vite emits external scripts); `style-src 'self' 'unsafe-inline'` already allows runtime style attrs used by some libs; verify no inline `<script>` in built HTML (Vite default is fine). Add nothing to CSP.
- **Icons:** `lucide-react` (bundled, tree-shaken). Replace the old SVG sprite.
- **Animations:** `framer-motion` (bundled). Declarative entrances, layout animations for cart drawer/badges, `whileHover` micro-interactions. Global reduced-motion guard.
- **Fonts:** reuse local assets under `assets/fonts/` if present; otherwise system Persian stack (`Tahoma, "Segoe UI", system-ui, sans-serif`) — never a remote font URL.
- **Art/illustrations:** current `art.js` SVGs (650 lines, emoji-based product art) are ported as React components (or kept as data-URL SVG strings) so products keep their illustrated look.
- **State:** lightweight — React Context + hooks for cart/user/theme (no Redux). Server is source of truth in API mode; JWT + `X-Session-Id` stored in `localStorage` exactly like today.
- **Theming:** shadcn/ui tokens (CSS variables) wired to light/dark via `data-theme` on `<html>`, same toggle UX as today. Brand palette: warm neutrals + a single date-brown/amber accent family, light background default.
- **Routing:** `react-router-dom` for `/`, product quick routes if useful; modals/drawer remain overlays (not routes) to match current UX.

## 5. Constraints

- Node ≥ 22.5 (`node:sqlite`). CommonJS server stays CJS; client is ESM.
- Keep existing security posture: rate limits, JWT rules, order ownership checks, request size limits, security headers.
- `npm test` at root must stay green: API tests largely unchanged; `static.test.mjs` rewritten to assert the new dist contract (no external origins in built HTML, no inline scripts, public-file allowlist, CSP headers).
- Package manager: npm. New deps: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `framer-motion`, `lucide-react`, `react-router-dom`, shadcn/ui essentials (`class-variance-authority`, `clsx`, `tailwind-merge`, Radix primitives as added).
- Persian/RTL: Tailwind logical properties or `dir="rtl"`-aware utilities; numbers/prices formatted `Intl.NumberFormat('fa-IR')` as today.

## 6. Out of scope for builder to invent

- Product catalog data, prices, shipping thresholds, promo seed — all already in `db.js`; do not invent new products.
- Email verification flows — `verification_token` column exists but no endpoint; leave as-is.

## 7. Success criteria

1. `npm run build && npm start` serves the NAJLA SPA + working API on one port.
2. Every feature in §2 feature parity works end-to-end against the real API.
3. `npm test` green; security headers/CSP unchanged.
4. Visual: light, airy, animated, modern — user reviews the running app and gives a final design pass (further polish iterations happen on the live app, not mockups).
