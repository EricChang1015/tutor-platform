<script>
  import { onMount } from 'svelte';
  import { user, auth } from '../stores/auth.js';
  import { notify } from '../stores/notifications.js';
  import { t, currentLanguage, switchLanguage, SUPPORTED_LANGUAGES } from '../stores/i18n.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';
  import LanguageSwitcher from '../components/LanguageSwitcher.svelte';

  let isLoading = false;
  let settings = {
    language: 'zh-TW',
    timezone: 'Asia/Taipei',
    emailNotifications: true,
    pushNotifications: false,
    theme: 'light',
    autoSave: true,
    sessionTimeout: 30
  };

  let passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  let isChangingPassword = false;
  let showCurrentPassword = false;
  let showNewPassword = false;
  let showConfirmPassword = false;

  onMount(() => {
    loadSettings();
  });

  function loadSettings() {
    // 從 localStorage 載入設定
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        settings = { ...settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    }
    
    // 同步當前語言
    settings.language = $currentLanguage;
  }

  function saveSettings() {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      notify.success($t('notifications.success.saved'));
    } catch (error) {
      notify.error($t('notifications.error.generic'));
    }
  }

  function handleLanguageChange(event) {
    const newLanguage = event.target.value;
    settings.language = newLanguage;
    switchLanguage(newLanguage);
    saveSettings();
  }

  function handleSettingChange() {
    saveSettings();
  }

  async function changePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      notify.error('請填寫所有密碼欄位');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify.error('新密碼確認不一致');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      notify.error('新密碼長度至少 8 個字符');
      return;
    }

    isChangingPassword = true;
    try {
      // 這裡應該調用 API 更改密碼
      // await api.auth.changePassword(passwordForm);
      
      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notify.success('密碼更改成功');
      passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    } catch (error) {
      notify.error(error.message || '密碼更改失敗');
    } finally {
      isChangingPassword = false;
    }
  }

  function resetSettings() {
    if (confirm('確定要重置所有設定嗎？')) {
      settings = {
        language: 'zh-TW',
        timezone: 'Asia/Taipei',
        emailNotifications: true,
        pushNotifications: false,
        theme: 'light',
        autoSave: true,
        sessionTimeout: 30
      };
      saveSettings();
      notify.success('設定已重置');
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- 頁面標題 -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">{$t('nav.settings')}</h1>
    <p class="mt-1 text-sm text-gray-500">
      管理您的帳戶設定和偏好
    </p>
  </div>

  <!-- 一般設定 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">一般設定</h2>
    </div>
    <div class="card-body space-y-6">
      <!-- 語言設定 -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">{$t('pages.profile.language')}</h3>
          <p class="text-sm text-gray-500">{$t('pages.profile.languageDesc')}</p>
        </div>
        <div class="flex items-center space-x-4">
          <select 
            class="input w-40" 
            bind:value={settings.language}
            on:change={handleLanguageChange}
          >
            {#each Object.values(SUPPORTED_LANGUAGES) as language}
              <option value={language.code}>{language.nativeName}</option>
            {/each}
          </select>
          <LanguageSwitcher showText={false} size="sm" />
        </div>
      </div>

      <!-- 時區設定 -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">{$t('pages.profile.timezone')}</h3>
          <p class="text-sm text-gray-500">{$t('pages.profile.timezoneDesc')}</p>
        </div>
        <select 
          class="input w-48" 
          bind:value={settings.timezone}
          on:change={handleSettingChange}
        >
          <option value="Asia/Taipei">台北 (GMT+8)</option>
          <option value="UTC">UTC (GMT+0)</option>
          <option value="America/New_York">紐約 (GMT-5)</option>
          <option value="Europe/London">倫敦 (GMT+0)</option>
          <option value="Asia/Tokyo">東京 (GMT+9)</option>
        </select>
      </div>

      <!-- 主題設定 -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">主題</h3>
          <p class="text-sm text-gray-500">選擇您偏好的介面主題</p>
        </div>
        <select 
          class="input w-32" 
          bind:value={settings.theme}
          on:change={handleSettingChange}
        >
          <option value="light">淺色</option>
          <option value="dark">深色</option>
          <option value="auto">自動</option>
        </select>
      </div>

      <!-- 會話超時 -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">會話超時</h3>
          <p class="text-sm text-gray-500">設定自動登出時間（分鐘）</p>
        </div>
        <select 
          class="input w-32" 
          bind:value={settings.sessionTimeout}
          on:change={handleSettingChange}
        >
          <option value={15}>15 分鐘</option>
          <option value={30}>30 分鐘</option>
          <option value={60}>1 小時</option>
          <option value={120}>2 小時</option>
          <option value={0}>永不</option>
        </select>
      </div>
    </div>
  </div>

  <!-- 通知設定 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">通知設定</h2>
    </div>
    <div class="card-body space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">{$t('pages.profile.emailNotifications')}</h3>
          <p class="text-sm text-gray-500">{$t('pages.profile.emailNotificationsDesc')}</p>
        </div>
        <label class="flex items-center">
          <input 
            type="checkbox" 
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
            bind:checked={settings.emailNotifications}
            on:change={handleSettingChange}
          >
          <span class="ml-2 text-sm text-gray-900">{$t('pages.profile.enable')}</span>
        </label>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">推送通知</h3>
          <p class="text-sm text-gray-500">接收瀏覽器推送通知</p>
        </div>
        <label class="flex items-center">
          <input 
            type="checkbox" 
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
            bind:checked={settings.pushNotifications}
            on:change={handleSettingChange}
          >
          <span class="ml-2 text-sm text-gray-900">{$t('pages.profile.enable')}</span>
        </label>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">自動保存</h3>
          <p class="text-sm text-gray-500">自動保存表單內容</p>
        </div>
        <label class="flex items-center">
          <input 
            type="checkbox" 
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
            bind:checked={settings.autoSave}
            on:change={handleSettingChange}
          >
          <span class="ml-2 text-sm text-gray-900">{$t('pages.profile.enable')}</span>
        </label>
      </div>
    </div>
  </div>

  <!-- 安全設定 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">{$t('pages.profile.accountSecurity')}</h2>
    </div>
    <div class="card-body">
      <form on:submit|preventDefault={changePassword} class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-gray-900 mb-4">{$t('pages.profile.changePassword')}</h3>
          
          <div class="grid grid-cols-1 gap-4">
            <!-- 當前密碼 -->
            <div>
              <label class="label">當前密碼</label>
              <div class="relative">
                {#if showCurrentPassword}
                  <input
                    type="text"
                    class="input pr-10"
                    bind:value={passwordForm.currentPassword}
                    placeholder="請輸入當前密碼"
                    disabled={isChangingPassword}
                  />
                {:else}
                  <input
                    type="password"
                    class="input pr-10"
                    bind:value={passwordForm.currentPassword}
                    placeholder="請輸入當前密碼"
                    disabled={isChangingPassword}
                  />
                {/if}
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  on:click={() => showCurrentPassword = !showCurrentPassword}
                >
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {#if showCurrentPassword}
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    {:else}
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    {/if}
                  </svg>
                </button>
              </div>
            </div>

            <!-- 新密碼 -->
            <div>
              <label class="label">新密碼</label>
              <div class="relative">
                {#if showNewPassword}
                  <input
                    type="text"
                    class="input pr-10"
                    bind:value={passwordForm.newPassword}
                    placeholder="請輸入新密碼"
                    disabled={isChangingPassword}
                  />
                {:else}
                  <input
                    type="password"
                    class="input pr-10"
                    bind:value={passwordForm.newPassword}
                    placeholder="請輸入新密碼"
                    disabled={isChangingPassword}
                  />
                {/if}
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  on:click={() => showNewPassword = !showNewPassword}
                >
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {#if showNewPassword}
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    {:else}
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    {/if}
                  </svg>
                </button>
              </div>
            </div>

            <!-- 確認新密碼 -->
            <div>
              <label class="label">確認新密碼</label>
              <div class="relative">
                {#if showConfirmPassword}
                  <input
                    type="text"
                    class="input pr-10"
                    bind:value={passwordForm.confirmPassword}
                    placeholder="請再次輸入新密碼"
                    disabled={isChangingPassword}
                  />
                {:else}
                  <input
                    type="password"
                    class="input pr-10"
                    bind:value={passwordForm.confirmPassword}
                    placeholder="請再次輸入新密碼"
                    disabled={isChangingPassword}
                  />
                {/if}
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  on:click={() => showConfirmPassword = !showConfirmPassword}
                >
                  <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {#if showConfirmPassword}
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    {:else}
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    {/if}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <button
              type="submit"
              class="btn btn-primary"
              disabled={isChangingPassword}
            >
              {#if isChangingPassword}
                <LoadingSpinner size="sm" color="white" />
                <span class="ml-2">更改中...</span>
              {:else}
                更改密碼
              {/if}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- 危險操作 -->
  <div class="card border-red-200">
    <div class="card-header bg-red-50">
      <h2 class="text-lg font-medium text-red-900">危險操作</h2>
    </div>
    <div class="card-body">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">重置設定</h3>
          <p class="text-sm text-gray-500">將所有設定恢復為預設值</p>
        </div>
        <button
          type="button"
          class="btn btn-danger"
          on:click={resetSettings}
        >
          重置設定
        </button>
      </div>
    </div>
  </div>
</div>
