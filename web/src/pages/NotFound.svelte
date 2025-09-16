<script>
  import { link } from 'svelte-spa-router';
  import { userRole } from '../stores/auth.js';
  import { getDefaultRoute } from '../utils/routes.js';

  $: homeRoute = $userRole ? getDefaultRoute($userRole) : '/';
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full text-center">
    <!-- 404 圖示 -->
    <div class="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-red-100 mb-8">
      <svg class="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>

    <!-- 錯誤信息 -->
    <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
    <h2 class="text-2xl font-semibold text-gray-700 mb-4">頁面未找到</h2>
    <p class="text-gray-500 mb-8">
      抱歉，您訪問的頁面不存在或已被移動。
    </p>

    <!-- 操作按鈕 -->
    <div class="space-y-4">
      <a 
        href={homeRoute} 
        use:link 
        class="btn btn-primary w-full"
      >
        返回首頁
      </a>
      
      <button 
        type="button" 
        class="btn btn-outline w-full"
        on:click={() => window.history.back()}
      >
        返回上一頁
      </button>
    </div>

    <!-- 幫助信息 -->
    <div class="mt-8 text-sm text-gray-500">
      <p>如果您認為這是一個錯誤，請聯繫我們的</p>
      <a href="/support" class="text-primary-600 hover:text-primary-500">技術支援團隊</a>
    </div>
  </div>
</div>
