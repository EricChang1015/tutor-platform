<script>
  import { createEventDispatcher } from 'svelte';
  
  export let bookings = []; // 預約數據
  export let currentDate = new Date();
  
  const dispatch = createEventDispatcher();
  
  let selectedDate = new Date();
  
  // 獲取當月的日期數據
  function getCalendarData(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 當月第一天和最後一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 計算日曆需要顯示的開始日期（包含上月末尾）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 計算日曆需要顯示的結束日期（包含下月開頭）
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, firstDay, lastDay };
  }
  
  // 檢查日期是否有預約
  function getBookingStatus(date) {
    const dateStr = date.toDateString();
    const dayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.start_at);
      return bookingDate.toDateString() === dateStr;
    });
    
    if (dayBookings.length === 0) return null;
    
    // 檢查是否有已完成的課程
    const hasCompleted = dayBookings.some(booking => 
      new Date(booking.end_at) < new Date()
    );
    
    // 檢查是否有即將到來的課程
    const hasUpcoming = dayBookings.some(booking => 
      new Date(booking.start_at) > new Date()
    );
    
    if (hasCompleted && !hasUpcoming) return 'completed';
    if (hasUpcoming) return 'booked';
    return 'completed';
  }
  
  // 檢查是否是今天
  function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
  
  // 檢查是否是當前月份
  function isCurrentMonth(date, currentMonth) {
    return date.getMonth() === currentMonth.getMonth();
  }
  
  // 處理日期點擊
  function handleDateClick(date) {
    selectedDate = date;
    dispatch('dateSelect', { date });
  }
  
  // 上一個月
  function previousMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  }
  
  // 下一個月
  function nextMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }
  
  $: calendarData = getCalendarData(currentDate);
  $: monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  $: weekDays = ['日', '一', '二', '三', '四', '五', '六'];
</script>

<div class="bg-white rounded-lg shadow p-4">
  <!-- 月份導航 -->
  <div class="flex items-center justify-between mb-4">
    <button 
      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      on:click={previousMonth}
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    
    <h3 class="text-lg font-semibold text-gray-900">
      {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
    </h3>
    
    <button 
      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      on:click={nextMonth}
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
  
  <!-- 星期標題 -->
  <div class="grid grid-cols-7 gap-1 mb-2">
    {#each weekDays as day}
      <div class="text-center text-sm font-medium text-gray-500 py-2">
        {day}
      </div>
    {/each}
  </div>
  
  <!-- 日期網格 -->
  <div class="grid grid-cols-7 gap-1">
    {#each calendarData.days as date}
      {@const bookingStatus = getBookingStatus(date)}
      {@const isCurrentMonthDate = isCurrentMonth(date, currentDate)}
      {@const isTodayDate = isToday(date)}
      {@const isSelected = selectedDate.toDateString() === date.toDateString()}
      
      <button
        class="relative h-10 w-full rounded-lg text-sm transition-all duration-200 hover:bg-gray-100
               {isCurrentMonthDate ? 'text-gray-900' : 'text-gray-400'}
               {isTodayDate ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
               {isSelected ? 'ring-2 ring-blue-500' : ''}
               {bookingStatus === 'booked' ? 'bg-orange-100 text-orange-800' : ''}
               {bookingStatus === 'completed' ? 'bg-gray-100 text-gray-600' : ''}"
        on:click={() => handleDateClick(date)}
      >
        <span class="relative z-10">
          {date.getDate()}
        </span>
        
        <!-- 預約狀態指示器 -->
        {#if bookingStatus === 'booked'}
          <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full"></div>
        {:else if bookingStatus === 'completed'}
          <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-500 rounded-full"></div>
        {/if}
        
        <!-- 今天的指示器 -->
        {#if isTodayDate && !bookingStatus}
          <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
        {/if}
      </button>
    {/each}
  </div>
  
  <!-- 圖例 -->
  <div class="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600">
    <div class="flex items-center space-x-1">
      <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
      <span>今天</span>
    </div>
    <div class="flex items-center space-x-1">
      <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
      <span>已預約</span>
    </div>
    <div class="flex items-center space-x-1">
      <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
      <span>已完成</span>
    </div>
  </div>
</div>
