const SID_KEY = 'najla_sid';
const TOKEN_KEY = 'najla_token';

const SID_RE = /^[A-Za-z0-9._-]{6,64}$/;

export function getSid(): string {
  let sid = '';
  try {
    sid = localStorage.getItem(SID_KEY) || '';
  } catch {
    /* private mode */
  }
  if (!SID_RE.test(sid)) {
    sid = crypto.randomUUID().replace(/-/g, '');
    try {
      localStorage.setItem(SID_KEY, sid);
    } catch {
      /* ignore */
    }
  }
  return sid;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
