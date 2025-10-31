<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { me } from '$lib/api/endpoints';
  import { goto } from '$app/navigation';

  let state = { accessToken: null as string | null, refreshToken: null as string | null, me: null as any };
  const unsub = auth.subscribe((v) => (state = v));
  onDestroy(unsub);

  onMount(async () => {
    if (state.accessToken && !state.me) {
      try {
        const res: any = await me();
        auth.setMe(res.user ?? res);
      } catch (e) {
        auth.logout();
        goto('/login');
      }
    }
  });

  function doLogout() {
    auth.logout();
    goto('/login');
  }
</script>

<nav style="display:flex;gap:12px;align-items:center;padding:8px 12px;border-bottom:1px solid #eee">
  <a href="/teachers">Teachers</a>
  <a href="/materials">Materials</a>
  <a href="/bookings">Bookings</a>
  <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
    {#if state.me}
      <span>Hi, {state.me.name ?? state.me.id}</span>
      <button on:click={doLogout}>Logout</button>
    {:else}
      <a href="/login">Login</a>
    {/if}
  </div>
</nav>

<slot />
