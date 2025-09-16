<script>
  import { t, currentLanguage, currentLanguageInfo, SUPPORTED_LANGUAGES, switchLanguage } from '../stores/i18n.js';
  import LanguageSwitcher from '../components/LanguageSwitcher.svelte';

  let testParams = { name: 'John Doe', count: 5 };
</script>

<div class="max-w-4xl mx-auto space-y-6 p-6">
  <!-- 頁面標題 -->
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-900">多語言測試頁面</h1>
    <p class="mt-2 text-gray-600">Language Test Page</p>
  </div>

  <!-- 語言切換器 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">語言切換器 / Language Switcher</h2>
    </div>
    <div class="card-body">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">當前語言 / Current Language: <strong>{$currentLanguageInfo.nativeName}</strong></p>
          <p class="text-sm text-gray-600">語言代碼 / Language Code: <strong>{$currentLanguage}</strong></p>
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  </div>

  <!-- 基本翻譯測試 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">基本翻譯測試 / Basic Translation Test</h2>
    </div>
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium text-gray-900 mb-2">通用詞彙 / Common Terms</h3>
          <ul class="space-y-1 text-sm">
            <li><strong>Loading:</strong> {$t('common.loading')}</li>
            <li><strong>Save:</strong> {$t('common.save')}</li>
            <li><strong>Cancel:</strong> {$t('common.cancel')}</li>
            <li><strong>Delete:</strong> {$t('common.delete')}</li>
            <li><strong>Edit:</strong> {$t('common.edit')}</li>
            <li><strong>Search:</strong> {$t('common.search')}</li>
          </ul>
        </div>
        
        <div>
          <h3 class="font-medium text-gray-900 mb-2">認證相關 / Authentication</h3>
          <ul class="space-y-1 text-sm">
            <li><strong>Login:</strong> {$t('auth.login.title')}</li>
            <li><strong>Email:</strong> {$t('auth.login.email')}</li>
            <li><strong>Password:</strong> {$t('auth.login.password')}</li>
            <li><strong>Register:</strong> {$t('auth.register.title')}</li>
            <li><strong>Logout:</strong> {$t('nav.logout')}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- 參數化翻譯測試 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">參數化翻譯測試 / Parameterized Translation Test</h2>
    </div>
    <div class="card-body">
      <div class="space-y-4">
        <div>
          <label class="label">測試參數 / Test Parameters:</label>
          <div class="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              class="input" 
              placeholder="Name" 
              bind:value={testParams.name}
            />
            <input 
              type="number" 
              class="input" 
              placeholder="Count" 
              bind:value={testParams.count}
            />
          </div>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-md">
          <p class="text-sm">
            <strong>歡迎訊息 / Welcome Message:</strong><br>
            {$t('auth.login.welcome', { name: testParams.name })}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- 角色和狀態翻譯 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">角色和狀態 / Roles and Status</h2>
    </div>
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium text-gray-900 mb-2">用戶角色 / User Roles</h3>
          <div class="space-y-2">
            <span class="badge badge-primary">{$t('roles.admin')}</span>
            <span class="badge badge-success">{$t('roles.teacher')}</span>
            <span class="badge badge-secondary">{$t('roles.student')}</span>
          </div>
        </div>
        
        <div>
          <h3 class="font-medium text-gray-900 mb-2">狀態 / Status</h3>
          <div class="space-y-2">
            <span class="badge badge-success">{$t('status.active')}</span>
            <span class="badge badge-warning">{$t('status.pending')}</span>
            <span class="badge badge-danger">{$t('status.cancelled')}</span>
            <span class="badge badge-primary">{$t('status.completed')}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 功能模組翻譯 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">功能模組 / Feature Modules</h2>
    </div>
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium text-gray-900 mb-2">管理功能 / Admin Features</h3>
          <ul class="space-y-1 text-sm">
            <li>• {$t('features.userManagement')}</li>
            <li>• {$t('features.courseManagement')}</li>
            <li>• {$t('features.pricingManagement')}</li>
            <li>• {$t('features.payoutManagement')}</li>
          </ul>
        </div>
        
        <div>
          <h3 class="font-medium text-gray-900 mb-2">學習功能 / Learning Features</h3>
          <ul class="space-y-1 text-sm">
            <li>• {$t('features.bookingManagement')}</li>
            <li>• {$t('features.sessionManagement')}</li>
            <li>• {$t('features.packageManagement')}</li>
            <li>• {$t('features.availabilityManagement')}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- 表單驗證翻譯 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">表單驗證 / Form Validation</h2>
    </div>
    <div class="card-body">
      <div class="space-y-2 text-sm">
        <p class="text-red-600">• {$t('validation.required')}</p>
        <p class="text-red-600">• {$t('validation.email')}</p>
        <p class="text-red-600">• {$t('validation.minLength', { min: 8 })}</p>
        <p class="text-red-600">• {$t('validation.maxLength', { max: 100 })}</p>
      </div>
    </div>
  </div>

  <!-- 通知訊息翻譯 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">通知訊息 / Notifications</h2>
    </div>
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-medium text-green-600 mb-2">成功訊息 / Success Messages</h3>
          <ul class="space-y-1 text-sm text-green-600">
            <li>• {$t('notifications.success.saved')}</li>
            <li>• {$t('notifications.success.created')}</li>
            <li>• {$t('notifications.success.updated')}</li>
            <li>• {$t('notifications.success.deleted')}</li>
          </ul>
        </div>
        
        <div>
          <h3 class="font-medium text-red-600 mb-2">錯誤訊息 / Error Messages</h3>
          <ul class="space-y-1 text-sm text-red-600">
            <li>• {$t('notifications.error.generic')}</li>
            <li>• {$t('notifications.error.network')}</li>
            <li>• {$t('notifications.error.unauthorized')}</li>
            <li>• {$t('notifications.error.validation')}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- 語言切換測試按鈕 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">快速語言切換 / Quick Language Switch</h2>
    </div>
    <div class="card-body">
      <div class="flex space-x-4">
        {#each Object.values(SUPPORTED_LANGUAGES) as language}
          <button
            type="button"
            class="btn"
            class:btn-primary={$currentLanguage === language.code}
            class:btn-outline={$currentLanguage !== language.code}
            on:click={() => switchLanguage(language.code)}
          >
            {language.flag} {language.nativeName}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- 返回按鈕 -->
  <div class="text-center">
    <button 
      type="button" 
      class="btn btn-outline"
      on:click={() => window.history.back()}
    >
      {$t('common.back')}
    </button>
  </div>
</div>
