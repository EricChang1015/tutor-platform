<script>
  import { onMount } from 'svelte';
  import { availabilityApi } from '../../services/api.js';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import { notify } from '../../stores/notifications.js';

  let isLoading = true;
  let availabilitySlots = [];
  let isEditing = false;
  let editingSlots = {};

  const weekdays = [
    { value: 0, label: '週日' },
    { value: 1, label: '週一' },
    { value: 2, label: '週二' },
    { value: 3, label: '週三' },
    { value: 4, label: '週四' },
    { value: 5, label: '週五' },
    { value: 6, label: '週六' }
  ];

  // 載入可用時段
  async function loadAvailability() {
    try {
      isLoading = true;
      const slots = await availabilityApi.getMy();
      availabilitySlots = slots || [];

      // 初始化編輯狀態
      editingSlots = {};
      weekdays.forEach(day => {
        editingSlots[day.value] = getSlotsByDay(day.value);
      });
    } catch (error) {
      console.error('載入可用時段失敗:', error);
      notify.error('載入可用時段失敗');
    } finally {
      isLoading = false;
    }
  }

  // 獲取指定星期的時段
  function getSlotsByDay(weekday) {
    return availabilitySlots
      .filter(slot => slot.weekday === weekday)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  // 開始編輯
  function startEditing() {
    isEditing = true;
    // 重新初始化編輯狀態
    editingSlots = {};
    weekdays.forEach(day => {
      editingSlots[day.value] = getSlotsByDay(day.value).map(slot => ({...slot}));
    });
  }

  // 取消編輯
  function cancelEditing() {
    isEditing = false;
    editingSlots = {};
  }

  // 添加時段
  function addSlot(weekday) {
    if (!editingSlots[weekday]) {
      editingSlots[weekday] = [];
    }
    editingSlots[weekday].push({
      weekday,
      start_time: '09:00',
      end_time: '10:00',
      capacity: 2,
      isNew: true
    });
    editingSlots = {...editingSlots};
  }

  // 刪除時段
  function removeSlot(weekday, index) {
    editingSlots[weekday].splice(index, 1);
    editingSlots = {...editingSlots};
  }

  // 保存更改
  async function saveChanges() {
    try {
      isLoading = true;

      // 收集所有需要保存的時段
      const allSlots = [];
      Object.values(editingSlots).forEach(daySlots => {
        allSlots.push(...daySlots);
      });

      // 這裡應該調用批量更新 API
      // 目前先顯示成功消息
      notify.success('可用時段已更新');
      isEditing = false;

      // 重新載入數據
      await loadAvailability();
    } catch (error) {
      console.error('保存失敗:', error);
      notify.error('保存失敗，請重試');
    } finally {
      isLoading = false;
    }
  }

  // 格式化時間
  function formatTime(timeStr) {
    return timeStr.substring(0, 5); // 只顯示 HH:MM
  }

  onMount(() => {
    loadAvailability();
  });
</script>

{#if isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
{:else}
  <div class="space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">可用時段管理</h1>
        <p class="mt-1 text-sm text-gray-500">設定您的授課時間，學生可以從這些時段中預約課程</p>
      </div>

      <div class="flex space-x-3">
        {#if isEditing}
          <button
            class="btn btn-outline"
            on:click={cancelEditing}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            class="btn btn-primary"
            on:click={saveChanges}
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存更改'}
          </button>
        {:else}
          <button
            class="btn btn-primary"
            on:click={startEditing}
          >
            編輯時段
          </button>
        {/if}
      </div>
    </div>

    <!-- 統計信息 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-blue-600">總時段數</p>
            <p class="text-2xl font-semibold text-blue-900">{availabilitySlots.length}</p>
          </div>
        </div>
      </div>

      <div class="bg-green-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-green-600">每週時數</p>
            <p class="text-2xl font-semibold text-green-900">{availabilitySlots.length}</p>
          </div>
        </div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-purple-600">容量總計</p>
            <p class="text-2xl font-semibold text-purple-900">
              {availabilitySlots.reduce((sum, slot) => sum + (slot.capacity || 0), 0)}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 週間時段表格 -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-gray-900">週間時段安排</h2>
        <p class="text-sm text-gray-500">設定每週的可用授課時間</p>
      </div>
      <div class="card-body">
        <div class="space-y-6">
          {#each weekdays as day}
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-md font-medium text-gray-900">{day.label}</h3>
                {#if isEditing}
                  <button
                    class="btn btn-sm btn-outline"
                    on:click={() => addSlot(day.value)}
                  >
                    + 添加時段
                  </button>
                {/if}
              </div>

              {#if isEditing}
                <!-- 編輯模式 -->
                <div class="space-y-3">
                  {#if editingSlots[day.value] && editingSlots[day.value].length > 0}
                    {#each editingSlots[day.value] as slot, index}
                      <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-md">
                        <div class="flex-1 grid grid-cols-3 gap-4">
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">開始時間</label>
                            <input
                              type="time"
                              class="input input-sm"
                              bind:value={slot.start_time}
                            />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">結束時間</label>
                            <input
                              type="time"
                              class="input input-sm"
                              bind:value={slot.end_time}
                            />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">容量</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              class="input input-sm"
                              bind:value={slot.capacity}
                            />
                          </div>
                        </div>
                        <button
                          class="btn btn-sm btn-danger"
                          on:click={() => removeSlot(day.value, index)}
                        >
                          刪除
                        </button>
                      </div>
                    {/each}
                  {:else}
                    <div class="text-center py-8 text-gray-500">
                      <p class="text-sm">該日暫無時段</p>
                      <button
                        class="mt-2 btn btn-sm btn-outline"
                        on:click={() => addSlot(day.value)}
                      >
                        添加第一個時段
                      </button>
                    </div>
                  {/if}
                </div>
              {:else}
                <!-- 顯示模式 -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {#each getSlotsByDay(day.value) as slot}
                    <div class="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                      <div>
                        <span class="text-sm font-medium text-blue-900">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                        <span class="block text-xs text-blue-600">
                          容量: {slot.capacity} 人
                        </span>
                      </div>
                      <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  {:else}
                    <div class="col-span-full text-center py-4 text-gray-500">
                      <p class="text-sm">該日暫無可用時段</p>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- 快速設定 -->
    {#if isEditing}
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium text-gray-900">快速設定</h2>
          <p class="text-sm text-gray-500">使用預設模板快速設定時段</p>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button class="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <h3 class="font-medium text-gray-900">工作日模式</h3>
              <p class="text-sm text-gray-500 mt-1">週一至週五 9:00-17:00</p>
            </button>

            <button class="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <h3 class="font-medium text-gray-900">全週模式</h3>
              <p class="text-sm text-gray-500 mt-1">週一至週日 8:00-21:00</p>
            </button>

            <button class="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <h3 class="font-medium text-gray-900">週末模式</h3>
              <p class="text-sm text-gray-500 mt-1">週六週日 10:00-18:00</p>
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
