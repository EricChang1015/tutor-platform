<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { getBookings, cancelBooking } from '$lib/api/endpoints';
  import { formatInTaipei } from '$lib/utils/datetime';

  let loading = true;
  let error: string | null = null;
  let items: any[] = [];
  let cancelMsg: string | null = null;

  async function load() {
    loading = true; error = null;
    try {
      const res: any = await getBookings({ status: 'upcoming' });
      items = res?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
    } catch (e: any) {
      error = e?.message ?? 'Failed to load bookings';
    } finally { loading = false; }
  }

  onMount(() => {
    if (!get(auth).accessToken) { goto('/login'); return; }
    load();
  });

  async function doCancel(id: string) {
    cancelMsg = null; error = null;
    try { await cancelBooking(id, { reason: 'user_request', cause: 'student_request' }); cancelMsg = '已取消'; await load(); }
    catch (e: any) { error = e?.message ?? '取消失敗'; }
  }
</script>

<div style="max-width:900px;margin:16px auto;padding:0 12px">
  <h2 style="margin:8px 0 12px">我的預約</h2>
  {#if loading}
    <div>Loading...</div>
  {:else if error}
    <div style="color:#b00020">{error}</div>
  {:else if items.length === 0}
    <div>目前沒有預約</div>
  {:else}
    {#if cancelMsg}<div style="color:#2e7d32">{cancelMsg}</div>{/if}
    <div style="display:flex;flex-direction:column;gap:8px">
      {#each items as b (b.id)}
        <div style="border:1px solid #eee;border-radius:8px;padding:12px;display:flex;gap:12px;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:600">{b.teacher?.name ?? b.teacherName ?? 'Teacher'} / {b.courseTitle ?? 'Lesson'}</div>
            <div style="color:#666;font-size:12px">{formatInTaipei(b.startsAt)} - {formatInTaipei(b.endsAt)}</div>
          </div>
          {#if b.status !== 'canceled'}
            <button on:click={() => doCancel(b.id)}>取消</button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

