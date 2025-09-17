<script>
  import { createEventDispatcher } from 'svelte';
  
  export let teacher;
  export let compact = false; // 是否為緊湊模式
  
  const dispatch = createEventDispatcher();
  
  // 處理老師卡片點擊
  function handleTeacherClick() {
    dispatch('teacherSelect', { teacher });
  }
  
  // 處理查看日曆點擊
  function handleCalendarClick(event) {
    event.stopPropagation();
    dispatch('viewCalendar', { teacher });
  }
  
  // 格式化評分
  function formatRating(rating) {
    return rating ? rating.toFixed(1) : '4.5';
  }
  
  // 生成星星評分
  function getStarRating(rating) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('full');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('half');
      } else {
        stars.push('empty');
      }
    }
    
    return stars;
  }
  
  $: stars = getStarRating(teacher.rating || 4.5);
</script>

<div 
  class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden
         {compact ? 'p-3' : 'p-4'}"
  on:click={handleTeacherClick}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === 'Enter' && handleTeacherClick()}
>
  <div class="flex items-start space-x-3">
    <!-- 老師頭像 -->
    <div class="flex-shrink-0">
      <div class="relative">
        {#if teacher.photo_url}
          <img 
            src={teacher.photo_url} 
            alt={teacher.display_name || teacher.name}
            class="w-12 h-12 rounded-full object-cover {compact ? 'w-10 h-10' : 'w-12 h-12'}"
          />
        {:else}
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold {compact ? 'w-10 h-10 text-sm' : 'w-12 h-12'}">
            {(teacher.display_name || teacher.name)?.charAt(0)?.toUpperCase() || 'T'}
          </div>
        {/if}
        
        <!-- 在線狀態指示器 -->
        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
      </div>
    </div>
    
    <!-- 老師信息 -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-gray-900 truncate {compact ? 'text-sm' : 'text-base'}">
            {teacher.display_name || teacher.name}
          </h4>
          
          <!-- 評分 -->
          <div class="flex items-center space-x-1 mt-1">
            <div class="flex items-center space-x-0.5">
              {#each stars as star}
                {#if star === 'full'}
                  <svg class="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                {:else if star === 'half'}
                  <svg class="w-3 h-3 text-yellow-400" viewBox="0 0 20 20">
                    <defs>
                      <linearGradient id="half-star">
                        <stop offset="50%" stop-color="currentColor"/>
                        <stop offset="50%" stop-color="transparent"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                {:else}
                  <svg class="w-3 h-3 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                {/if}
              {/each}
            </div>
            <span class="text-xs text-gray-600">{formatRating(teacher.rating)}</span>
          </div>
          
          <!-- 課程數量 -->
          {#if !compact}
            <p class="text-xs text-gray-500 mt-1">
              已授課 {teacher.session_count || 0} 堂
            </p>
          {/if}
          
          <!-- 簡介 -->
          {#if teacher.bio && !compact}
            <p class="text-xs text-gray-600 mt-2 line-clamp-2">
              {teacher.bio}
            </p>
          {/if}
        </div>
        
        <!-- 操作按鈕 -->
        {#if !compact}
          <button
            class="ml-2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            on:click={handleCalendarClick}
            title="查看日曆"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        {/if}
      </div>
      
      <!-- 緊湊模式下的額外信息 -->
      {#if compact}
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-gray-500">{teacher.session_count || 0} 堂課</span>
          <button
            class="text-xs text-blue-600 hover:text-blue-800 font-medium"
            on:click={handleCalendarClick}
          >
            查看時間
          </button>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- 介紹影片預覽 (僅非緊湊模式) -->
  {#if teacher.intro_video_url && !compact}
    <div class="mt-3 pt-3 border-t border-gray-100">
      <div class="flex items-center space-x-2 text-xs text-gray-600">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>有介紹影片</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
