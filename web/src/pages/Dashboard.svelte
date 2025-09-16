<script>
  import { onMount } from 'svelte';
  import { user, userRole, isAuthenticated } from '../stores/auth.js';
  import { push } from 'svelte-spa-router';
  import { getDefaultRoute } from '../utils/routes.js';

  // 如果用戶已登入，重定向到對應的角色儀表板
  onMount(() => {
    if ($isAuthenticated && $userRole) {
      const defaultRoute = getDefaultRoute($userRole);
      if (defaultRoute !== '/dashboard') {
        push(defaultRoute);
      }
    }
  });
</script>

{#if $isAuthenticated}
  <!-- 已登入用戶的通用儀表板 -->
  <div class="space-y-6">
    <!-- 歡迎區域 -->
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg text-white p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">
            歡迎回來，{$user?.name || '用戶'}！
          </h1>
          <p class="mt-2 text-primary-100">
            今天是個學習的好日子
          </p>
        </div>
        <div class="hidden md:block">
          <div class="text-6xl opacity-20">
            🎓
          </div>
        </div>
      </div>
    </div>

    <!-- 快速導航 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#if $userRole === 'admin'}
        <a href="/admin/users" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">用戶管理</h3>
                <p class="text-sm text-gray-500">管理系統用戶</p>
              </div>
            </div>
          </div>
        </a>

        <a href="/admin/courses" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 text-green-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">課程管理</h3>
                <p class="text-sm text-gray-500">管理系統課程</p>
              </div>
            </div>
          </div>
        </a>

        <a href="/admin/payouts" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">結算管理</h3>
                <p class="text-sm text-gray-500">管理老師結算</p>
              </div>
            </div>
          </div>
        </a>
      {:else if $userRole === 'teacher'}
        <a href="/teacher/courses" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">我的課程</h3>
                <p class="text-sm text-gray-500">管理教學課程</p>
              </div>
            </div>
          </div>
        </a>

        <a href="/teacher/availability" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 text-green-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">可用時段</h3>
                <p class="text-sm text-gray-500">設定授課時間</p>
              </div>
            </div>
          </div>
        </a>

        <a href="/teacher/sessions" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">課程會議</h3>
                <p class="text-sm text-gray-500">管理線上課程</p>
              </div>
            </div>
          </div>
        </a>
      {:else if $userRole === 'student'}
        <a href="/student/courses" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">瀏覽課程</h3>
                <p class="text-sm text-gray-500">探索學習課程</p>
              </div>
            </div>
          </div>
        </a>

        <a href="/student/bookings" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 text-green-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">我的預約</h3>
                <p class="text-sm text-gray-500">管理課程預約</p>
              </div>
            </div>
          </div>
        </a>

        <a href="/student/sessions" class="card hover:shadow-lg transition-shadow duration-200">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">我的課程</h3>
                <p class="text-sm text-gray-500">參與線上課程</p>
              </div>
            </div>
          </div>
        </a>
      {/if}
    </div>

    <!-- 最近活動 -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-gray-900">最近活動</h2>
      </div>
      <div class="card-body">
        <div class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="mt-2">暫無最近活動</p>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- 未登入用戶的首頁 -->
  <div class="bg-white">
    <!-- Hero 區域 -->
    <div class="relative overflow-hidden">
      <div class="max-w-7xl mx-auto">
        <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div class="sm:text-center lg:text-left">
              <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span class="block xl:inline">線上學習</span>
                <span class="block text-primary-600 xl:inline">新體驗</span>
              </h1>
              <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                連接優秀的老師和學生，提供高品質的一對一線上教學服務。無論您是想要學習新技能還是分享知識，我們都能為您提供最佳的平台。
              </p>
              <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div class="rounded-md shadow">
                  <a href="/register" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                    開始學習
                  </a>
                </div>
                <div class="mt-3 sm:mt-0 sm:ml-3">
                  <a href="/login" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10">
                    立即登入
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div class="h-56 w-full bg-gradient-to-br from-primary-400 to-primary-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
          <div class="text-8xl text-white opacity-50">
            🎓
          </div>
        </div>
      </div>
    </div>

    <!-- 特色區域 -->
    <div class="py-12 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="lg:text-center">
          <h2 class="text-base text-primary-600 font-semibold tracking-wide uppercase">特色功能</h2>
          <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            為什麼選擇我們？
          </p>
        </div>

        <div class="mt-10">
          <div class="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            <div class="text-center">
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 class="mt-4 text-lg leading-6 font-medium text-gray-900">優秀師資</h3>
              <p class="mt-2 text-base text-gray-500">
                嚴格篩選的專業老師，提供高品質的教學服務
              </p>
            </div>

            <div class="text-center">
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="mt-4 text-lg leading-6 font-medium text-gray-900">彈性時間</h3>
              <p class="mt-2 text-base text-gray-500">
                自由安排學習時間，配合您的生活節奏
              </p>
            </div>

            <div class="text-center">
              <div class="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="mt-4 text-lg leading-6 font-medium text-gray-900">線上教學</h3>
              <p class="mt-2 text-base text-gray-500">
                便利的線上教學平台，隨時隨地開始學習
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
