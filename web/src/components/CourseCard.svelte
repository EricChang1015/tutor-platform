<script>
  import { createEventDispatcher } from 'svelte';
  
  export let course;
  export let compact = false;
  
  const dispatch = createEventDispatcher();
  
  // 處理課程點擊
  function handleCourseClick() {
    dispatch('courseSelect', { course });
  }
  
  // 格式化價格
  function formatPrice(cents) {
    if (!cents) return '免費';
    return `$${(cents / 100).toFixed(0)}`;
  }
  
  // 格式化課程時長
  function formatDuration(minutes) {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}小時${mins}分鐘` : `${hours}小時`;
    }
    return `${minutes}分鐘`;
  }
  
  // 獲取課程類型顯示文字
  function getCourseTypeText(type) {
    const typeMap = {
      'one_on_one': '一對一',
      'group': '小組課',
      'workshop': '工作坊',
      'trial': '試聽課'
    };
    return typeMap[type] || type;
  }
  
  // 獲取受歡迎程度等級
  function getPopularityLevel(score) {
    if (score >= 100) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }
  
  $: popularityLevel = getPopularityLevel(course.popularity_score || 0);
</script>

<div 
  class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group
         {compact ? 'p-3' : 'p-4'}"
  on:click={handleCourseClick}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === 'Enter' && handleCourseClick()}
>
  <!-- 課程標題和類型 -->
  <div class="flex items-start justify-between mb-2">
    <div class="flex-1">
      <h4 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors {compact ? 'text-sm' : 'text-base'}">
        {course.title || '未命名課程'}
      </h4>
      
      <div class="flex items-center space-x-2 mt-1">
        <!-- 課程類型標籤 -->
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getCourseTypeText(course.type)}
        </span>
        
        <!-- 受歡迎程度標籤 -->
        {#if popularityLevel === 'high'}
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            🔥 熱門
          </span>
        {:else if popularityLevel === 'medium'}
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⭐ 推薦
          </span>
        {/if}
      </div>
    </div>
    
    <!-- 價格 -->
    <div class="text-right ml-2">
      <div class="text-lg font-bold text-green-600 {compact ? 'text-base' : 'text-lg'}">
        {formatPrice(course.default_price_cents)}
      </div>
      {#if !compact}
        <div class="text-xs text-gray-500">每堂課</div>
      {/if}
    </div>
  </div>
  
  <!-- 課程描述 -->
  {#if course.description && !compact}
    <p class="text-sm text-gray-600 mb-3 line-clamp-2">
      {course.description}
    </p>
  {/if}
  
  <!-- 課程詳情 -->
  <div class="flex items-center justify-between text-sm text-gray-500">
    <div class="flex items-center space-x-4">
      <!-- 課程時長 -->
      <div class="flex items-center space-x-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatDuration(course.duration_min)}</span>
      </div>
      
      <!-- 已授課次數 -->
      {#if !compact && course.session_count !== undefined}
        <div class="flex items-center space-x-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span>{course.session_count} 人已學</span>
        </div>
      {/if}
    </div>
    
    <!-- 立即預約按鈕 -->
    <button 
      class="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200"
      on:click|stopPropagation={handleCourseClick}
    >
      立即預約
    </button>
  </div>
  
  <!-- 緊湊模式下的額外信息 -->
  {#if compact}
    <div class="mt-2 pt-2 border-t border-gray-100">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>{course.session_count || 0} 人已學</span>
        <span class="text-blue-600 font-medium">查看詳情 →</span>
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
