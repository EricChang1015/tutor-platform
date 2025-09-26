<script>
  import { onMount } from 'svelte';
  import { bookingApi, availabilityApi } from '../../services/api.js';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import Avatar from '../../components/Avatar.svelte';
  import { notify } from '../../stores/notifications.js';

  let isLoading = true;
  let bookings = [];
  let showReschedule = false;
  let activeBooking = null;
  let selectedDate = '';
  let availableSlots = [];
  let isLoadingSlots = false;

  async function loadBookings(){
    try{
      isLoading = true;
      bookings = await bookingApi.getMyBookings();
    }catch(err){
      console.error('載入預約失敗', err);
      notify.error(err?.data?.message || '載入預約失敗');
    }finally{
      isLoading = false;
    }
  }

  onMount(loadBookings);

  async function cancel(id){
    if(!confirm('確定要取消此預約嗎？')) return;
    try{
      await bookingApi.cancel(id, 'student_cancel');
      notify.success('已取消預約');
      await loadBookings();
    }catch(err){
      notify.error(err?.data?.message || '取消失敗');
    }
  }

  function minutesDiff(a,b){ return Math.round((new Date(b)-new Date(a))/60000); }

  function openReschedule(b){
    activeBooking = b;
    selectedDate = new Date(b.start_at).toISOString().split('T')[0];
    availableSlots = [];
    showReschedule = true;
    loadSlots();
  }

  function timeToMinutes(t){ const [h,m]=t.split(':').map(Number); return h*60+m; }
  function minutesToTime(mins){ const h=Math.floor(mins/60), m=mins%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` }

  async function loadSlots(){
    if(!activeBooking || !selectedDate) return;
    try{
      isLoadingSlots = true;
      const all = await availabilityApi.getByTeacher(activeBooking.teacher.id);
      const weekday = new Date(selectedDate).getDay();
      const daySlots = all.filter(s=>s.weekday===weekday);
      const durMin = minutesDiff(activeBooking.start_at, activeBooking.end_at);
      const out=[];
      daySlots.forEach(s=>{
        const startM = timeToMinutes(s.start_time);
        const endM = timeToMinutes(s.end_time);
        const step = 30; // half-hour grid
        for(let t=startM; t+durMin<=endM; t+=step){
          out.push({ start: minutesToTime(t), end: minutesToTime(t+durMin), available:true });
        }
      });
      availableSlots = out;
    }catch(err){
      console.error('載入可用時段失敗', err);
      notify.error('載入可用時段失敗');
    }finally{
      isLoadingSlots = false;
    }
  }

  async function confirmReschedule(slot){
    if(!activeBooking) return;
    try{
      const startLocal = new Date(`${selectedDate}T${slot.start}:00`);
      const endLocal = new Date(`${selectedDate}T${slot.end}:00`);
      // 先創建新的
      await bookingApi.create({
        course_id: activeBooking.course.id,
        teacher_id: activeBooking.teacher.id,
        start_at: startLocal.toISOString(),
        end_at: endLocal.toISOString()
      });
      // 再取消舊的
      await bookingApi.cancel(activeBooking.id, 'rescheduled');
      notify.success('改期成功');
      showReschedule=false; activeBooking=null; availableSlots=[];
      await loadBookings();
    }catch(err){
      notify.error(err?.data?.message || '改期失敗');
    }
  }
</script>

{#if isLoading}
  <div class="flex items-center justify-center min-h-[40vh]"><LoadingSpinner size="lg" /></div>
{:else}
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">我的預約</h1>
      <p class="mt-1 text-sm text-gray-500">管理您的課程預約</p>
    </div>

    {#if bookings.length === 0}
      <div class="card"><div class="card-body text-center py-12 text-gray-500">目前沒有預約</div></div>
    {:else}
      <div class="card">
        <div class="card-body">
          <div class="divide-y">
            {#each bookings as b}
              <div class="py-4 flex items-center gap-4">
                <Avatar name={b.teacher.name} userId={b.teacher.id} size={40} />
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-gray-900 truncate">{b.course.title}</div>
                  <div class="text-sm text-gray-600 truncate">{new Date(b.start_at).toLocaleString('zh-TW', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })} ~ {new Date(b.end_at).toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' })} · 老師：{b.teacher.name}</div>
                  {#if b.meeting_url}
                    <a href={b.meeting_url} class="text-xs text-blue-600 hover:underline" target="_blank" rel="noreferrer">教室連結</a>
                  {/if}
                </div>
                <div class="flex items-center gap-2">
                  <button class="btn small" on:click={() => openReschedule(b)}>改期</button>
                  <button class="btn small danger" on:click={() => cancel(b.id)}>取消</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

{#if showReschedule}
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" on:click={() => showReschedule=false}>
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl p-5" on:click|stopPropagation>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">改期 - {activeBooking?.course.title}</h3>
        <button class="text-gray-500 hover:text-gray-700" on:click={() => showReschedule=false}>&times;</button>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">選擇日期</label>
        <input type="date" bind:value={selectedDate} min={new Date().toISOString().split('T')[0]} class="border border-gray-300 rounded-md px-3 py-2" on:change={loadSlots} />
      </div>

      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-3">可預約時段</h4>
        {#if isLoadingSlots}
          <div class="flex items-center justify-center py-8"><LoadingSpinner size="sm" /></div>
        {:else if availableSlots.length === 0}
          <div class="text-gray-500 py-6 text-center">該日期暫無可預約時段</div>
        {:else}
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {#each availableSlots as s}
              <button class="p-2 text-sm border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50" on:click={() => confirmReschedule(s)}>
                {s.start}-{s.end}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
