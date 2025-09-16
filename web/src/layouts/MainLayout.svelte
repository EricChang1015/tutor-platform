<script>
  import { onMount } from 'svelte';
  import { user, isAuthenticated, userRole, auth } from '../stores/auth.js';
  import { notifications } from '../stores/notifications.js';
  import { navigationMenus, getDefaultRoute } from '../utils/routes.js';
  import { link, push } from 'svelte-spa-router';
  
  import Header from '../components/Header.svelte';
  import Sidebar from '../components/Sidebar.svelte';
  import NotificationContainer from '../components/NotificationContainer.svelte';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';

  export let currentRoute = '/';
  
  let sidebarOpen = false;
  let isLoading = true;

  // 響應式設計
  let innerWidth = 0;
  $: isMobile = innerWidth < 768;
  $: if (isMobile) sidebarOpen = false;

  // 獲取當前用戶角色的導航菜單
  $: currentMenu = $userRole ? navigationMenus[$userRole] || [] : [];

  // 初始化應用
  onMount(async () => {
    try {
      await auth.init();
      
      // 如果用戶已登入但在登入頁面，重定向到儀表板
      if ($isAuthenticated && (currentRoute === '/login' || currentRoute === '/register')) {
        const defaultRoute = getDefaultRoute($userRole);
        push(defaultRoute);
      }
    } catch (error) {
      console.error('初始化失敗:', error);
    } finally {
      isLoading = false;
    }
  });

  // 切換側邊欄
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  // 關閉側邊欄
  function closeSidebar() {
    if (isMobile) {
      sidebarOpen = false;
    }
  }

  // 登出
  async function handleLogout() {
    try {
      await auth.logout();
      push('/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  }
</script>

<svelte:window bind:innerWidth />

{#if isLoading}
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" />
  </div>
{:else}
  <div class="min-h-screen bg-gray-50">
    <!-- 通知容器 -->
    <NotificationContainer />

    {#if $isAuthenticated}
      <!-- 已登入用戶的佈局 -->
      <div class="flex h-screen overflow-hidden">
        <!-- 側邊欄 -->
        <Sidebar 
          bind:open={sidebarOpen}
          menu={currentMenu}
          {isMobile}
          on:close={closeSidebar}
        />

        <!-- 主內容區域 -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- 頂部導航 -->
          <Header 
            user={$user}
            on:toggleSidebar={toggleSidebar}
            on:logout={handleLogout}
          />

          <!-- 主內容 -->
          <main class="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            <div class="max-w-7xl mx-auto">
              <slot />
            </div>
          </main>
        </div>
      </div>

      <!-- 移動端側邊欄遮罩 -->
      {#if isMobile && sidebarOpen}
        <div
          class="fixed inset-0 bg-gray-600 bg-opacity-50 z-40"
          role="button"
          tabindex="0"
          on:click={closeSidebar}
          on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
        ></div>
      {/if}
    {:else}
      <!-- 未登入用戶的佈局 -->
      <div class="min-h-screen flex flex-col">
        <!-- 簡單的頂部導航 -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
              <div class="flex items-center">
                <a href="/" use:link class="text-xl font-bold text-primary-600">
                  🎓 Tutor Platform
                </a>
              </div>
              <div class="flex items-center space-x-4">
                <a href="/login" use:link class="text-gray-600 hover:text-gray-900">
                  登入
                </a>
                <a href="/register" use:link class="btn btn-primary">
                  註冊
                </a>
              </div>
            </div>
          </div>
        </nav>

        <!-- 主內容 -->
        <main class="flex-1">
          <slot />
        </main>

        <!-- 頁腳 -->
        <footer class="bg-white border-t border-gray-200">
          <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div class="text-center text-gray-500 text-sm">
              © 2025 Tutor Platform. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* 確保側邊欄動畫流暢 */
  :global(.sidebar-transition) {
    transition: transform 0.3s ease-in-out;
  }

  /* 響應式調整 */
  @media (max-width: 768px) {
    :global(.mobile-hidden) {
      display: none;
    }
  }
</style>
