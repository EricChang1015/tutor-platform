<script>
  import { health, login, createPackage, getPackageSummary, listCourses, createCourse } from './api.js';

  let apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
  let email = 'admin@example.com';
  let password = 'admin123';
  let token = '';
  let output = 'Ready';

  // Packages UI state
  let studentId = '';
  let courseId = '';
  let totalSessions = 5;

  async function doHealth() {
    try {
      const r = await health();
      output = JSON.stringify(r, null, 2);
    } catch (e) {
      output = JSON.stringify(e.data || { error: String(e) }, null, 2);
    }
  }

  async function doLogin() {
    try {
      const r = await login(email, password);
      token = r?.access_token || '';
      output = JSON.stringify(r, null, 2);
    } catch (e) {
      output = JSON.stringify(e.data || { error: String(e) }, null, 2);
    }
  }

  async function doCreatePackage() {
    try {
      if (!token) throw new Error('Please login first');
      const r = await createPackage(token, { studentId, courseId, totalSessions });
      output = JSON.stringify(r, null, 2);
    } catch (e) {
      output = JSON.stringify(e.data || { error: String(e) }, null, 2);
    }
  }

  async function doGetSummary() {
    try {
      if (!token) throw new Error('Please login first');
      if (!studentId) throw new Error('Please input studentId');
      const r = await getPackageSummary(token, studentId);
      output = JSON.stringify(r, null, 2);
    } catch (e) {
      output = JSON.stringify(e.data || { error: String(e) }, null, 2);
    }
  }
</script>

<style>
  :global(body) { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 20px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 900px) { .row { grid-template-columns: 1fr; } }
  .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
  input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; }
  button { padding: 10px 14px; border-radius: 8px; border: 1px solid #d1d5db; background: #111827; color:#fff; cursor: pointer; }
  pre { background: #0b1220; color: #e5e7eb; padding: 12px; border-radius: 12px; overflow: auto; min-height: 200px; }
</style>

<div class="wrap">
  <h1>Tutor Platform Web (Svelte)</h1>
  <p>API Base: <code>{apiBase}</code></p>

  <div class="row">
    <div class="card">
      <h2>Health</h2>
      <button on:click={doHealth}>GET /health</button>
    </div>
    <div class="card">
      <h2>Login</h2>
      <label for="login_email">Email</label>
      <input id="login_email" bind:value={email} placeholder="admin@example.com" />
      <label for="login_password" style="margin-top:8px; display:block;">Password</label>
      <input id="login_password" type="password" bind:value={password} placeholder="••••••••" />
      <div style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button on:click={doLogin}>POST /auth/login</button>
        {#if token}
          <span style="font-size:12px; background:#d1fae5; color:#065f46; padding:4px 8px; border-radius:999px;">Token ready</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <h2>Courses</h2>
    <div class="row">
      <div>
        <div style="margin-bottom:8px;"><button on:click={async()=>{ try{ output = JSON.stringify(await listCourses(token), null, 2);} catch(e){ output = JSON.stringify(e.data||{error:String(e)}, null, 2);} }}>GET /courses</button></div>
        <small>Use the returned id as courseId below.</small>
      </div>
      <div>
        <label for="course_title">title</label>
        <input id="course_title" placeholder="English 1-on-1" />
        <div style="margin-top:10px;"><button on:click={async()=>{ try{ const title = document.getElementById('course_title')?.value||'English 1-on-1'; output = JSON.stringify(await createCourse(token,{ title }), null, 2);} catch(e){ output = JSON.stringify(e.data||{error:String(e)}, null, 2);} }}>POST /courses</button></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <h2>Packages (Admin)</h2>
    <div class="row">
      <div>
        <label for="pkg_student_id">studentId</label>
        <input id="pkg_student_id" bind:value={studentId} placeholder="UUID of student_profile" />
        <label for="pkg_course_id" style="margin-top:8px; display:block;">courseId</label>
        <input id="pkg_course_id" bind:value={courseId} placeholder="UUID of course" />
        <label for="pkg_total_sessions" style="margin-top:8px; display:block;">totalSessions</label>
        <input id="pkg_total_sessions" type="number" bind:value={totalSessions} min="1" />
        <div style="margin-top:10px;"><button on:click={doCreatePackage}>POST /packages</button></div>
      </div>
      <div>
        <label for="summary_student_id">studentId</label>
        <input id="summary_student_id" bind:value={studentId} placeholder="UUID of student_profile" />
        <div style="margin-top:10px;"><button on:click={doGetSummary}>GET /students/:id/packages/summary</button></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <h2>Output</h2>
    <pre>{output}</pre>
  </div>
</div>

