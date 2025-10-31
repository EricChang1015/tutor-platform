import { apiFetch } from './client';
import type { paths } from '../types/api';

export async function login(username: string, password: string) {
  type Res = paths['/auth/login']['post']['responses'][200]['content']['application/json'];
  const data = await apiFetch<Res>({
    path: '/auth/login',
    method: 'POST',
    json: { username, password }
  });
  return data;
}

export async function me() {
  type Res = paths['/auth/me']['get']['responses'][200]['content']['application/json'];
  return apiFetch<Res>({ path: '/auth/me', auth: true });
}

export async function getTeachers(q?: { q?: string; domain?: string; region?: string; sort?: string; page?: number }) {
  type Res = paths['/teachers']['get']['responses'][200]['content']['application/json'];
  return apiFetch<Res>({ path: '/teachers', query: q, auth: true });
}

