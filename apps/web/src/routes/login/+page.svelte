<script lang="ts">
  import { goto } from '$app/navigation';
  import { login, me } from '$lib/api/endpoints';
  import { auth } from '$lib/stores/auth';

  let username = 'admin@example.com';
  let password = 'password';
  let loading = false;
  let error: string | null = null;

  async function onSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = null;
    try {
      const res: any = await login(username, password);
      auth.setTokens(res.accessToken, res.refreshToken);
      const profile: any = await me();
      auth.setMe(profile.user ?? profile);
      goto('/teachers');
    } catch (e: any) {
      error = e?.message ?? 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<div style="max-width:420px;margin:40px auto;padding:24px;border:1px solid #eee;border-radius:8px">
  <h2 style="margin:0 0 16px">登入</h2>
  {#if error}
    <div style="margin:8px 0;color:#b00020">{error}</div>
  {/if}
  <form on:submit|preventDefault={onSubmit}>
    <div style="display:flex;flex-direction:column;gap:8px">
      <label>
        <div>帳號（Email）</div>
        <input type="email" bind:value={username} required />
      </label>
      <label>
        <div>密碼</div>
        <input type="password" bind:value={password} required />
      </label>
      <button disabled={loading} type="submit">{loading ? '登入中...' : '登入'}</button>
    </div>
  </form>
</div>

