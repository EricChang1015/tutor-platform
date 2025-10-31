import { get } from 'svelte/store';
import { auth } from '../stores/auth';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

type Query = Record<string, string | number | boolean | null | undefined>;

function qs(q?: Query) {
  if (!q) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function apiFetch<T>(input: {
  path: string;
  method?: string;
  query?: Query;
  json?: unknown;
  formData?: FormData;
  auth?: boolean;
  headers?: HeadersInit;
  signal?: AbortSignal;
}): Promise<T> {
  const { path, method = 'GET', query, json, formData, auth: needAuth, headers, signal } = input;
  const url = `${API_BASE}${path}${qs(query)}`;
  let token: string | null = null;
  if (needAuth) token = get(auth).accessToken;

  const init: RequestInit = { method, signal, headers: { ...headers } };

  if (formData) {
    init.body = formData;
  } else if (json !== undefined) {
    init.body = JSON.stringify(json);
    (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  if (token) (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  let res = await fetch(url, init);
  if (res.status === 401 && needAuth) {
    const ok = await tryRefresh();
    if (ok) {
      const t = get(auth).accessToken;
      if (t) (init.headers as Record<string, string>)['Authorization'] = `Bearer ${t}`;
      res = await fetch(url, init);
    }
  }

  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.message ?? `HTTP ${res.status}`);
  }
  return safeJson(res) as Promise<T>;
}

async function tryRefresh() {
  const { refreshToken } = get(auth);
  if (!refreshToken) {
    auth.logout();
    return false;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) throw new Error('refresh failed');
    const data = await res.json();
    auth.setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    auth.logout();
    return false;
  }
}

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json();
  return undefined as any;
}

