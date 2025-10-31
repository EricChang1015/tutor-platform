<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { getTeacher, getTeacherTimetable, createBooking } from '$lib/api/endpoints';
  import { todayInTaipei, toTaipeiIso } from '$lib/utils/datetime';

  export let params: { id: string };

  let teacher: any = null;
  let date = todayInTaipei();
  let slots: any[] = [];
  let loading = true;
  let error: string | null = null;
  let bookingMsg: string | null = null;

  async function loadTeacher() {
    teacher = await getTeacher(params.id);
  }

  async function loadSlots() {
    const res: any = await getTeacherTimetable({ teacherId: params.id, date });
    const data = res?.data ?? res ?? [];
    // 只保留可預約
    slots = data.filter((x: any) => x.canReserve === 1 || x.isOnline === 1);
  }

  async function init() {
    loading = true; error = null;
    try { await loadTeacher(); await loadSlots(); }
    catch (e: any) { error = e?.message ?? 'Failed to load'; }
    finally { loading = false; }
  }

  onMount(() => {
    if (!get(auth).accessToken) { goto('/login'); return; }
    init();
  });

  async function book(slot: any) {
    bookingMsg = null; error = null;
    try {
      const startsAt = toTaipeiIso(date, slot.time || slot.localTime || slot.localTimeFormatted?.slice(11,16));
      await createBooking({ teacherId: params.id, startsAt, durationMinutes: 30, source: 'student' });
      bookingMsg = '預約成功！';
      await loadSlots();
    } catch (e: any) {
      error = e?.message ?? '預約失敗';
    }
  }
</script>

<div style="max-width:900px;margin:16px auto;padding:0 12px">
  {#if loading}
    <div>Loading...</div>
  {:else if error}
    <div style="color:#b00020">{error}</div>
  {:else}
    <div style="display:flex;gap:16px;align-items:flex-start">
      <img src={teacher?.avatarUrl ?? 'https://placehold.co/96?text=T'} width="96" height="96" style="border-radius:8px" />
      <div style="flex:1">
        <h2 style="margin:8px 0">{teacher?.name ?? teacher?.user?.name}</h2>
        <div style="color:#666">{teacher?.profile?.intro ?? ''}</div>
      </div>
    </div>

    <div style="margin-top:16px;display:flex;gap:8px;align-items:center">
      <label>選擇日期 <input type="date" bind:value={date} on:change={loadSlots} /></label>
      <button on:click={loadSlots}>載入時段</button>
      {#if bookingMsg}<div style="color:#2e7d32">{bookingMsg}</div>{/if}
    </div>

    <div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px">
      {#each slots as s (s.uid || s.id || s.time)}
        <button on:click={() => book(s)} disabled={s.canReserve === 0}
          style="padding:8px;border:1px solid #ddd;border-radius:6px;background:#fafafa">
          {s.time || s.localTime}
        </button>
      {/each}
    </div>
  {/if}
</div>

