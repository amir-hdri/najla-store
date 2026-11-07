import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';
import { AuthAPI } from './api';

let base: string;
const directory = mkdtempSync(path.join(tmpdir(), 'najla-client-api-'));
const nativeFetch = globalThis.fetch;
let server: ChildProcess;
const values = new Map<string, string>();

beforeAll(async () => {
  const port = await new Promise<number>((resolve, reject) => {
    const reservation = createServer();
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', () => {
      const address = reservation.address();
      if (!address || typeof address === 'string') return reject(new Error('No test port allocated'));
      reservation.close(error => error ? reject(error) : resolve(address.port));
    });
  });
  base = `http://127.0.0.1:${port}`;
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  // Browser-relative URLs point at the real isolated API server in this test.
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => nativeFetch(new URL(url, base), init));
  server = spawn(process.execPath, [new URL('../../../server.js', import.meta.url).pathname], {
    env: { ...process.env, PORT: String(port), DATENEST_DB_PATH: path.join(directory, 'test.db'), JWT_SECRET: 'ui-contract-test', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Readiness must come from our child, never an unrelated listener on a port.
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Isolated API did not start')), 5000);
    let output = '';
    server.once('error', error => { clearTimeout(timeout); reject(error); });
    server.once('exit', () => { clearTimeout(timeout); reject(new Error('Isolated API exited before readiness')); });
    server.stdout!.on('data', chunk => {
      output += chunk.toString();
      if (output.includes(`http://localhost:${port}`)) { clearTimeout(timeout); resolve(); }
    });
  });
});

afterAll(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await exited;
  }
  vi.unstubAllGlobals();
  rmSync(directory, { recursive: true, force: true });
});

it('registers using the single-password client form contract', async () => {
  const result = await AuthAPI.register({ name: 'UI Customer', email: 'ui@example.com', password: 'Passw0rd123', phone: '09121234567' });
  expect(result.user.email).toBe('ui@example.com');
  expect(result.token).toBeTruthy();
});

it('changes the password through the client and can log in with it', async () => {
  const response = await nativeFetch(`${base}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Password Customer', email: 'password@example.com', phone: '09121234568', password: 'Passw0rd123', confirm_password: 'Passw0rd123' }),
  });
  const { token } = await response.json();
  values.set('najla_token', token);
  await AuthAPI.changePassword({ current_password: 'Passw0rd123', new_password: 'NewPassw0rd123' });
  const result = await AuthAPI.login({ email: 'password@example.com', password: 'NewPassw0rd123' });
  expect(result.user.email).toBe('password@example.com');
});
