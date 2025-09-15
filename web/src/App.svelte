<script>
  import { health, login } from './api.js';

  let apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
  let email = 'admin@example.com';
  let password = 'admin123';
  let token = '';
  let output = 'Ready';

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
</script>

<style>
  body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
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
      <label>Email</label>
      <input bind:value={email} placeholder="admin@example.com" />
      <label style="margin-top:8px; display:block;">Password</label>
      <input type="password" bind:value={password} placeholder="••••••••" />
      <div style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button on:click={doLogin}>POST /auth/login</button>
        {#if token}
          <span style="font-size:12px; background:#d1fae5; color:#065f46; padding:4px 8px; border-radius:999px;">Token ready</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <h2>Output</h2>
    <pre>{output}</pre>
  </div>
</div>

