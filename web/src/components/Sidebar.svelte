<script>
  import { createEventDispatcher } from 'svelte';
  import { link, location } from 'svelte-spa-router';
  import { checkPermission } from '../stores/auth.js';
  import { t } from '../stores/i18n.js';
  
  export let open = false;
  export let menu = [];
  export let isMobile = false;
  
  const dispatch = createEventDispatcher();
  
  // 圖標映射
  const icons = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    'dollar-sign': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    'credit-card': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    package: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
  };

  function handleMenuClick() {
    if (isMobile) {
      dispatch('close');
    }
  }

  function isActiveRoute(path) {
    return $location === path || $location.startsWith(path + '/');
  }

  // 過濾有權限的菜單項
  $: visibleMenu = menu.filter(item => !item.permission || checkPermission(item.permission));
</script>

<!-- 側邊欄 -->
<aside 
  class="sidebar-transition fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 md:translate-x-0"
  class:translate-x-0={open}
  class:-translate-x-full={!open}
>
  <div class="flex flex-col h-full">
    <!-- 側邊欄頭部 -->
    <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
      <div class="flex items-center">
        <span class="text-xl font-bold text-primary-600">
          🎓 Tutor
        </span>
      </div>
      
      <!-- 移動端關閉按鈕 -->
      {#if isMobile}
        <button
          type="button"
          class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          on:click={() => dispatch('close')}
        >
          <span class="sr-only">關閉菜單</span>
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>

    <!-- 導航菜單 -->
    <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      {#each visibleMenu as item}
        <a
          href={item.path}
          use:link
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200"
          class:bg-primary-100={isActiveRoute(item.path)}
          class:text-primary-700={isActiveRoute(item.path)}
          class:text-gray-600={!isActiveRoute(item.path)}
          class:hover:bg-gray-100={!isActiveRoute(item.path)}
          class:hover:text-gray-900={!isActiveRoute(item.path)}
          on:click={handleMenuClick}
        >
          <!-- 圖標 -->
          <svg 
            class="mr-3 h-5 w-5 flex-shrink-0" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d={icons[item.icon] || icons.home}
            />
          </svg>
          
          <!-- 標題 -->
          <span>{$t(item.titleKey || item.title)}</span>
          
          <!-- 活動指示器 -->
          {#if isActiveRoute(item.path)}
            <div class="ml-auto w-2 h-2 bg-primary-600 rounded-full"></div>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- 側邊欄底部 -->
    <div class="p-4 border-t border-gray-200">
      <div class="text-xs text-gray-500 text-center">
        Tutor Platform v1.0
      </div>
    </div>
  </div>
</aside>

<style>
  .sidebar-transition {
    transition: transform 0.3s ease-in-out;
  }
</style>
