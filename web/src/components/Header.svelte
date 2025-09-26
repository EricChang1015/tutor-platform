<script>
  import { createEventDispatcher } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { ROLE_NAMES } from '../stores/auth.js';
  import { t } from '../stores/i18n.js';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import Avatar from './Avatar.svelte';

  export let user;
  
  const dispatch = createEventDispatcher();
  
  let dropdownOpen = false;

  function toggleSidebar() {
    dispatch('toggleSidebar');
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function closeDropdown() {
    dropdownOpen = false;
  }

  function handleLogout() {
    closeDropdown();
    dispatch('logout');
  }

  // 點擊外部關閉下拉菜單
  function handleClickOutside(event) {
    if (!event.target.closest('.user-dropdown')) {
      dropdownOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<header class="bg-white shadow-sm border-b border-gray-200 z-30">
  <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
    <!-- 左側：菜單按鈕和標題 -->
    <div class="flex items-center">
      <!-- 移動端菜單按鈕 -->
      <button
        type="button"
        class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        on:click={toggleSidebar}
      >
        <span class="sr-only">打開菜單</span>
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- 標題 -->
      <div class="ml-4 md:ml-0">
        <h1 class="text-xl font-semibold text-gray-900">
          🎓 Tutor Platform
        </h1>
      </div>
    </div>

    <!-- 右側：用戶信息和操作 -->
    <div class="flex items-center space-x-4">
      <!-- 語言切換器 -->
      <LanguageSwitcher showText={false} size="sm" />

      <!-- 通知按鈕 -->
      <button
        type="button"
        class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        title={$t('nav.notifications')}
      >
        <span class="sr-only">{$t('nav.notifications')}</span>
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM9 7h6m0 0V3m0 4l4 4m-4-4l-4 4" />
        </svg>
      </button>

      <!-- 用戶下拉菜單 -->
      <div class="relative user-dropdown">
        <button
          type="button"
          class="flex items-center space-x-3 p-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          on:click={toggleDropdown}
        >
          <!-- 用戶頭像 -->
          <Avatar src={user?.teacher_profile?.photo_url} name={user?.name} userId={user?.id} size={32} />
          
          <!-- 用戶信息 -->
          <div class="hidden md:block text-left">
            <div class="font-medium">{user?.name || $t('common.user', { default: '用戶' })}</div>
            <div class="text-xs text-gray-500">
              {$t(`roles.${user?.role}`) || user?.role}
            </div>
          </div>

          <!-- 下拉箭頭 -->
          <svg 
            class="h-4 w-4 text-gray-400 transition-transform duration-200"
            class:rotate-180={dropdownOpen}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- 下拉菜單 -->
        {#if dropdownOpen}
          <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div class="py-1">
              <!-- 用戶信息（移動端顯示） -->
              <div class="md:hidden px-4 py-2 border-b border-gray-100">
                <div class="font-medium text-gray-900">{user?.name || $t('common.user', { default: '用戶' })}</div>
                <div class="text-sm text-gray-500">{user?.email}</div>
                <div class="text-xs text-gray-400">
                  {$t(`roles.${user?.role}`) || user?.role}
                </div>
              </div>

              <!-- 菜單項目 -->
              <a
                href="/profile"
                use:link
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                on:click={closeDropdown}
              >
                <div class="flex items-center">
                  <svg class="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {$t('nav.profile')}
                </div>
              </a>

              <a
                href="/settings"
                use:link
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                on:click={closeDropdown}
              >
                <div class="flex items-center">
                  <svg class="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {$t('nav.settings')}
                </div>
              </a>

              <div class="border-t border-gray-100"></div>

              <button
                type="button"
                class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                on:click={handleLogout}
              >
                <div class="flex items-center">
                  <svg class="mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {$t('nav.logout')}
                </div>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>

<style>
  .rotate-180 {
    transform: rotate(180deg);
  }
</style>
