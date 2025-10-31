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

export async function getTeacher(id: string) {
  type Res = paths['/teachers/{id}']['get']['responses'][200]['content']['application/json'];
  return apiFetch<Res>({ path: `/teachers/${id}`, auth: true });
}

export async function getTeacherTimetable(params: { teacherId: string; date: string }) {
  type Res = paths['/teacher-availability/teacher-timetable']['get']['responses'][200]['content']['application/json'];
  return apiFetch<Res>({ path: '/teacher-availability/teacher-timetable', query: params, auth: true });
}

export async function createBooking(input: {
  teacherId: string;
  startsAt: string;
  durationMinutes?: number;
  courseTitle?: string | null;
  message?: string | null;
  materialId?: string | null;
  source?: 'student' | 'admin' | 'teacher' | 'system';
}) {
  type Res = paths['/bookings']['post']['responses'][201]['content']['application/json'];
  return apiFetch<Res>({ path: '/bookings', method: 'POST', json: input, auth: true });
}

export async function getBookings(query?: { roleView?: 'student'|'teacher'; status?: string; page?: number; pageSize?: number }) {
  type Res = paths['/bookings']['get']['responses'][200]['content']['application/json'];
  return apiFetch<Res>({ path: '/bookings', query, auth: true });
}

export async function cancelBooking(id: string, body?: { reason?: string; cause?: 'student_request'|'teacher_request'|'admin_force'|'technical_issue'; waivePolicy?: boolean }) {
  type Res = paths['/bookings/{id}/cancel']['post']['responses'][200]['content']['application/json'];
  return apiFetch<Res>({ path: `/bookings/${id}/cancel`, method: 'POST', json: body ?? {}, auth: true });
}

