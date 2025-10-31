<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { getTeachers } from '$lib/api/endpoints';
  import { goto } from '$app/navigation';
  import TeacherCard from '$lib/components/TeacherCard.svelte';

  let q = '';
  let loading = true;
  let error: string | null = null;
  let items: any[] = [];

  async function load() {
    loading = true;
    error = null;
    try {
      const res: any = await getTeachers(q ? { q } : undefined);
      items = res?.items ?? res?.data ?? res?.teachers ?? (Array.isArray(res) ? res : []);
    } catch (e: any) {
      error = e?.message ?? 'Failed to load teachers';
    } finally {
      loading = false;
    }
  }

  function doSearch(e: Event) {
    e.preventDefault();
    load();
  }

  onMount(() => {
    const s = get(auth);
    if (!s.accessToken) {
      goto('/login');
      return;
    }
    load();
  });
</script>

<div style="max-width:960px;margin:16px auto;padding:0 12px">
  <h2 style="margin:8px 0 12px">Teachers</h2>
  <form on:submit|preventDefault={doSearch} style="display:flex;gap:8px;margin-bottom:12px">
    <input placeholder="Search..." bind:value={q} />
    <button type="submit">Search</button>
  </form>
  {#if loading}
    <div>Loading...</div>
  {:else if error}
    <div style="color:#b00020">{error}</div>
  {:else if items.length === 0}
    <div>No teachers found.</div>
  {:else}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
      {#each items as t (t.id)}
        <TeacherCard teacher={t} query={$page.url.search} />
      {/each}
    </div>
  {/if}
</div>

