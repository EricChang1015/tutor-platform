#!/usr/bin/env node
/*
  Quick smoke test: teacher evidence upload + teacher report submit
*/
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE = process.env.API_BASE || 'http://localhost:3001';

async function api(url, { token, method='GET', json, formData, headers={} }={}) {
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
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}: ${typeof data==='string'?data:JSON.stringify(data)}`);
  return data;
}

async function run() {
  // 1) login teacher
  const t = await api('/auth/login', { method:'POST', json: { username: 'teacher1@example.com', password: 'password' } });
  const token = t.accessToken;
  console.log('Teacher login OK');

  // 2) list bookings (teacher view)
  const list = await api('/bookings?roleView=teacher', { token });
  const booking = (list.items || [])[0];
  if (!booking) throw new Error('No teacher bookings available');
  console.log('Using booking:', booking.id, booking.startsAt);

  // 3) upload evidence
  const fd = new FormData();
  const p = path.join(__dirname, '..', 'docs', 'media', 'teacher1.jpg');
  fd.append('file', fs.createReadStream(p), 'evidence.jpg');
  const uploaded = await api(`/bookings/${booking.id}/evidence`, { token, method:'POST', formData: fd });
  console.log('Uploaded evidence id:', uploaded.id);

  // 4) list evidence and submit teacher report
  const evidenceList = await api(`/bookings/${booking.id}/evidence`, { token });
  const evidenceIds = (evidenceList.items || []).map(x => x.id);
  const rep = await api(`/post-class/${booking.id}/teacher-report`, { token, method:'POST', json: {
    rubrics: {}, commentToStudent: 'API 自動測試評論', evidenceFileIds: evidenceIds
  }});
  console.log('Report OK status:', rep && rep.postClass && rep.postClass.reportStatus);
}

run().catch(e => { console.error(e); process.exit(1); });

