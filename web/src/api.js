const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const url = new URL(path, API_BASE);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw Object.assign(new Error('Request failed'), { status: res.status, data });
  return data;
}

export async function health() {
  return apiRequest('/health', { method: 'GET' });
}

export async function login(email, password) {
  return apiRequest('/auth/login', { method: 'POST', body: { email, password }, token: null });
}

