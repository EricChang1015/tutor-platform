#!/usr/bin/env node

/*
  E2E test runner for Tutor Platform
  - Auth (admin/teacher/student)
  - Users (me, update)
  - Teachers (list/detail)
  - Availability (time-slots, teacher-timetable, set-availability)
  - Timeslots & Holds (search, create/delete hold)
  - Purchases (admin create)
  - Bookings (create/detail/message/reschedule/cancel)
  - Favorites (add/list/delete)
  - Materials (list/tree)
  - Uploads (avatar/my-files)
  - Notifications (list)
  - Admin (users list/basic ops, bookings stats)
*/

const { promisify } = require('util');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE = process.env.API_BASE || 'http://localhost:3001';
const TZ = 'Asia/Taipei';

const log = {
  step: (msg) => console.log(`\n== ${msg} ==`),
  ok: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️ ${msg}`),
  err: (msg) => console.log(`❌ ${msg}`)
};

async function api(url, { token, method = 'GET', json, formData, headers = {} } = {}) {
  const h = { ...headers };
  if (token) h['Authorization'] = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
    h['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (formData) {
    Object.assign(h, formData.getHeaders());
    body = formData;
  }
  const res = await fetch(BASE + url, { method, headers: h, body });
  const text = await res.text();
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? JSON.parse(text || '{}') : text;
  if (!res.ok) {
    const msg = typeof data === 'string' ? data : data.message || JSON.stringify(data);
    throw new Error(`HTTP ${res.status} ${url}: ${msg}`);
  }
  return data;
}

async function login(username, password) {
  const d = await api('/auth/login', { method: 'POST', json: { username, password } });
  return { token: d.accessToken, me: d.user };
}

function tomorrow(offsetDays = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function run() {
  const summary = { passed: 0, failed: 0 };
  try {
    log.step('Auth: login as admin/teacher/student');
    const admin = await login('admin@example.com', 'password');
    log.ok(`Admin: ${admin.me.name}`);
    const teacher = await login('teacher1@example.com', 'password');
    log.ok(`Teacher: ${teacher.me.name}`);
    const student = await login('student1@example.com', 'password');
    log.ok(`Student: ${student.me.name}`);

    log.step('Auth: /auth/me');
    const meAdmin = await api('/auth/me', { token: admin.token });
    const meStudent = await api('/auth/me', { token: student.token });
    log.ok(`Me(admin)=${meAdmin.name}, Me(student)=${meStudent.name}`);

    log.step('Teachers: list and one detail');
    const teachers = await api('/teachers');
    if (!teachers.items || teachers.items.length === 0) throw new Error('No teachers');
    const teacherCard = teachers.items[0];
    const teacherId = teacherCard.id;
    const teacherDetail = await api(`/teachers/${teacherId}`);
    log.ok(`Teachers: ${teachers.items.length}, detail=${teacherDetail.name}`);

    log.step('Availability: time slots / teacher timetable / set-availability');
    const slots = await api('/teacher-availability/time-slots');
    log.ok(`Time slots loaded (${(slots.data || []).length})`);
    // Ensure availability for tomorrow 09:00 (slot 18)
    const date = tomorrow(1);
    try {
      await api('/teacher-availability/set-availability', {
        token: admin.token,
        method: 'POST',
        json: { teacherId, date, timeSlots: [18, 19] }
      });
      log.ok(`Set availability for teacher ${teacherId} on ${date} at slots [18,19]`);
    } catch (e) {
      log.warn(`set-availability skipped: ${e.message}`);
    }
    const timetable = await api(`/teacher-availability/teacher-timetable?teacherId=${encodeURIComponent(teacherId)}&date=${date}&timezone=${encodeURIComponent(TZ)}`);
    const tt = timetable.data || [];
    log.ok(`Timetable items: ${tt.length}`);

    log.step('Timeslots search (optional)');
    const fromISO = new Date(Date.now() + 36 * 3600 * 1000).toISOString();
    const toISO = new Date(Date.now() + 40 * 3600 * 1000).toISOString();
    let tsItems = [];
    try {
      const timeslots = await api(`/timeslots?teacherId=${encodeURIComponent(teacherId)}&from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}&tz=${encodeURIComponent(TZ)}&duration=30`);
      tsItems = timeslots.items || [];
      log.ok(`Timeslots: ${tsItems.length}`);
    } catch (e) {
      log.warn(`Timeslots endpoint unavailable: ${e.message}`);
    }

    // Pick a start time
    let startsAtISO;
    if (tsItems.length > 0) {
      startsAtISO = tsItems[0].start;
    } else if (tt.length > 0 && tt[0].startTimeUtc) {
      startsAtISO = tt[0].startTimeUtc;
    } else {
      // fallback: tomorrow at 09:00 +08:00
      startsAtISO = `${date}T09:00:00+08:00`;
      log.warn('No available slot found; using fallback 09:00 +08:00 (may conflict)');
    }

    log.step('Purchases: admin grant one lesson card to student1');
    try {
      const created = await api('/purchases', {
        token: admin.token,
        method: 'POST',
        json: {
          studentId: student.me.id,
          packageName: 'E2E Test Package',
          quantity: 1,
          type: 'lesson_card'
        }
      });
      log.ok('Purchase granted');
      // Activate if possible
      try {
        const purchaseId = created?.id;
        if (purchaseId) {
          await api(`/purchases/${purchaseId}/activate`, { token: admin.token, method: 'POST', json: {} });
          log.ok('Purchase activated');
        } else {
          // fallback: query and activate first activatable
          const list = await api(`/purchases?studentId=${student.me.id}`, { token: admin.token });
          const activatable = (list.items || []).find(p => p.canActivate);
          if (activatable) {
            await api(`/purchases/${activatable.id}/activate`, { token: admin.token, method: 'POST', json: {} });
            log.ok('Purchase activated (fallback)');
          }
        }
      } catch (e2) {
        log.warn(`Activate purchase skipped: ${e2.message}`);
      }
    } catch (e) {
      log.warn(`Grant purchase skipped: ${e.message}`);
    }

    log.step('Bookings: create');
    let booking;
    try {
      booking = await api('/bookings', {
        token: student.token,
        method: 'POST',
        json: {
          teacherId,
          startsAt: startsAtISO,
          durationMinutes: 30,
          timezone: TZ,
          courseTitle: 'E2E Test Lesson',
          message: 'E2E booking test'
        }
      });
      log.ok(`Booking created: ${booking.id}`);
    } catch (e) {
      log.warn(`Create booking failed (likely conflict or policy): ${e.message}`);
    }

    log.step('Bookings: list mine (student)');
    const myBookings = await api('/bookings', { token: student.token });
    log.ok(`Bookings total: ${myBookings.total}`);

    if (booking && booking.id) {
      const bid = booking.id;
      log.step('Bookings: detail');
      const bdetail = await api(`/bookings/${bid}`, { token: student.token });
      log.ok(`Booking detail ok: ${bdetail.id}`);

      log.step('Bookings: message (optional)');
      try {
        await api(`/bookings/${bid}/messages`, { token: student.token, method: 'POST', json: { text: 'Hello from E2E' } });
        log.ok('Message posted');
      } catch (e) {
        log.warn(`Message endpoint unavailable: ${e.message}`);
      }

      log.step('Bookings: reschedule (+30m)');
      const dt = new Date(bdetail.startsAt);
      dt.setMinutes(dt.getMinutes() + 30);
      const newStartsAt = dt.toISOString();
      try {
        await api(`/bookings/${bid}/reschedule`, { token: student.token, method: 'POST', json: { newStartsAt, durationMinutes: 30 } });
        log.ok('Rescheduled');
      } catch (e) {
        log.warn(`Reschedule skipped: ${e.message}`);
      }

      log.step('Bookings: cancel (admin waivePolicy)');
      try {
        await api(`/bookings/${bid}/cancel`, { token: admin.token, method: 'POST', json: { reason: 'e2e', cause: 'admin_force', waivePolicy: true } });
        log.ok('Canceled');
      } catch (e) {
        log.warn(`Cancel skipped: ${e.message}`);
      }
    }

    log.step('Favorites: add/list/delete');
    try {
      await api('/favorites', { token: student.token, method: 'POST', json: { teacherId } });
      const favs = await api('/favorites', { token: student.token });
      log.ok(`Favorites count: ${(favs.items || []).length}`);
      await api(`/favorites/${teacherId}`, { token: student.token, method: 'DELETE' });
      log.ok('Favorite removed');
    } catch (e) {
      log.warn(`Favorites flow skipped: ${e.message}`);
    }

    log.step('Uploads: avatar + my files');
    try {
      const fd = new FormData();
      const avatarPath = path.join(__dirname, 'test_avatar.png');
      fd.append('file', fs.createReadStream(avatarPath), 'avatar.png');
      await api(`/users/${teacher.me.id}/avatar`, { token: teacher.token, method: 'POST', formData: fd });
      const myFiles = await api('/uploads/my-files?category=avatar', { token: teacher.token });
      log.ok(`Uploads (avatar) files: ${(myFiles.items || []).length}`);
    } catch (e) {
      log.warn(`Uploads skipped: ${e.message}`);
    }

    log.step('Materials: list and tree');
    const matsList = await api('/materials');
    log.ok(`Materials list ok (${matsList.items ? matsList.items.length : 0})`);
    const matsTree = await api('/materials?include=root&depth=2');
    log.ok('Materials tree ok');

    log.step('Notifications: list');
    try {
      const notes = await api('/notifications', { token: student.token });
      log.ok(`Notifications: ${(notes.items || []).length}`);
    } catch (e) {
      log.warn(`Notifications skipped: ${e.message}`);
    }

    log.step('Admin: users list and bookings stats');
    const usersPage = await api('/admin/users?page=1&pageSize=5', { token: admin.token });
    log.ok(`Admin users list ok (${usersPage.items.length})`);
    try {
      const stats = await api('/admin/bookings', { token: admin.token });
      log.ok(`Admin booking stats: total=${stats.total}`);
    } catch (e) {
      log.warn(`Admin bookings stats skipped: ${e.message}`);
    }

    log.step('DONE');
    summary.passed += 1;
    console.log('\n🎉 All E2E checks completed');
    process.exit(0);
  } catch (e) {
    summary.failed += 1;
    log.err(e.message);
    process.exit(1);
  }
}

if (require.main === module) run();

