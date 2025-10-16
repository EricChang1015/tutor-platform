import fetch from 'node-fetch';

(async () => {
  const base = 'http://localhost:3001';
  const login = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'teacher1@example.com', password: 'password' }) });
  const d = await login.json();
  const t = d.accessToken;

  const listResp = await fetch(base + '/bookings?roleView=teacher', { headers: { authorization: 'Bearer ' + t } });
  const list = await listResp.json();
  const bid = list.items?.[0]?.id;
  console.log('picked booking', bid);
  if (bid) {
    const repResp = await fetch(base + `/post-class/${bid}/teacher-report`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + t }, body: JSON.stringify({ rubrics: {}, commentToStudent: 'status test', evidenceFileIds: [], status: 'completed' }) });
    console.log('submit status code', repResp.status);
    const repBody = await repResp.text();
    console.log(repBody);
  }

  const month = new Date().toISOString().slice(0,7);
  const report = await fetch(base + `/reports/teacher?month=${month}`, { headers: { authorization: 'Bearer ' + t } });
  console.log('reports code', report.status);
  const body = await report.text();
  console.log(body);
})();

