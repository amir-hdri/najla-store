/**
 * NAJLA — built-SPA contract tests.
 *
 * The storefront is a Vite React app built into client/dist and served by
 * Express with SPA fallback. These tests guard the invariants that keep that
 * contract safe to ship:
 *
 *  1. The build output exists (run `npm run build` before `npm test`).
 *  2. Nothing references a remote origin (fonts, scripts, images, styles).
 *  3. index.html has no inline <script> (CSP is script-src 'self').
 *  4. Every local reference in index.html resolves inside dist on disk.
 *  5. dist contains no source maps or leftover Vite scaffold junk.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'client', 'dist');

const read = p => readFileSync(path.join(DIST, p), 'utf8');

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) return walk(abs);
    return [abs];
  });
}

test('the client build output exists', () => {
  assert.ok(existsSync(path.join(DIST, 'index.html')),
    'client/dist/index.html missing — run `npm run build` (or `npm run build:client`) first');
  assert.ok(existsSync(path.join(DIST, 'assets')), 'client/dist/assets missing — run `npm run build`');
});

test('no built file fetches a remote origin at runtime', () => {
  // Guards the "no external network requests" invariant: remote URLs may
  // appear as inert string literals (license comments, React error-code docs);
  // what matters is anything the browser would actually fetch — CSS url(),
  // HTML src/href attributes, and any absolute URL in index.html.
  const offenders = [];
  for (const abs of walk(DIST)) {
    if (abs.endsWith('.woff2') || abs.endsWith('.woff')) continue;
    const text = readFileSync(abs, 'utf8');
    const rel = path.relative(DIST, abs);
    const fetchable = [
      ...(text.match(/url\(\s*['"]?https?:\/\/[^)'"]+/g) || []),
      ...(text.match(/\b(?:src|href)\s*=\s*['"]https?:\/\/[^'"]+/g) || []),
      ...(rel === 'index.html' ? (text.match(/https?:\/\/[^\s"'`)]+/g) || []) : []),
    ].filter(u => !u.includes('www.w3.org') && !u.includes('schema.w3.org'));
    if (fetchable.length) offenders.push(`${rel}: ${fetchable.join(', ')}`);
  }
  assert.equal(offenders.length, 0, `remote fetches found:\n${offenders.join('\n')}`);
});

test('index.html has no inline <script> (CSP script-src is self only)', () => {
  const html = read('index.html');
  const inlineScripts = html.match(/<script(?![^>]*\bsrc=)[^>]*>/gi) || [];
  assert.equal(inlineScripts.length, 0, 'index.html contains an inline <script>');
});

test('every local reference in index.html resolves inside dist', () => {
  const html = read('index.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(m => m[1])
    .filter(u => !/^(?:https?:|data:|mailto:|#)/.test(u));
  for (const ref of refs) {
    const clean = ref.replace(/^\//, '').split('?')[0];
    assert.ok(existsSync(path.join(DIST, clean)),
      `index.html references a missing dist file: ${ref}`);
  }
});

test('dist contains no source maps or scaffold leftovers', () => {
  const abs = walk(DIST).map(f => path.relative(DIST, f));
  const maps = abs.filter(f => f.endsWith('.map'));
  assert.equal(maps.length, 0, `source maps leaked into dist: ${maps.join(', ')}`);
  for (const junk of ['src/main.tsx', 'vite.config.ts', '.env']) {
    assert.ok(!abs.includes(junk), `scaffold file leaked into dist: ${junk}`);
  }
});

test('index.html is a Persian RTL document for NAJLA', () => {
  const html = read('index.html');
  assert.match(html, /<html[^>]*\blang="fa"/);
  assert.match(html, /<html[^>]*\bdir="rtl"/);
  assert.match(html, /NAJLA/);
  assert.match(html, /viewport/);
});
