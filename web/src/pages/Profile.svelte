<script>
  import { user, auth } from '../stores/auth.js';
  import { notify } from '../stores/notifications.js';
  import { ROLE_NAMES } from '../stores/auth.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';

  let isLoading = false;
  let isEditing = false;
  let formData = {
    name: '',
    email: ''
  };

  // 初始化表單數據
  $: if ($user && !isEditing) {
    formData = {
      name: $user.name || '',
      email: $user.email || ''
    };
  }

  function startEditing() {
    isEditing = true;
    formData = {
      name: $user.name || '',
      email: $user.email || ''
    };
  }

  function cancelEditing() {
    isEditing = false;
    formData = {
      name: $user.name || '',
      email: $user.email || ''
    };
  }

  async function saveProfile() {
    if (!formData.name || !formData.email) {
      notify.error('請填寫所有必填欄位');
      return;
    }

    isLoading = true;
    try {
      await auth.updateProfile(formData);
      notify.success('個人資料更新成功');
      isEditing = false;
    } catch (error) {
      notify.error(error.message || '更新個人資料失敗');
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- 頁面標題 -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">個人資料</h1>
    <p class="mt-1 text-sm text-gray-500">
      管理您的帳戶信息和偏好設定
    </p>
  </div>

  <!-- 個人資料卡片 -->
  <div class="card">
    <div class="card-header">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-medium text-gray-900">基本信息</h2>
        {#if !isEditing}
          <button class="btn btn-outline" on:click={startEditing}>
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            編輯
          </button>
        {/if}
      </div>
    </div>
    
    <div class="card-body">
      {#if isEditing}
        <!-- 編輯模式 -->
        <form on:submit|preventDefault={saveProfile} class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label">姓名 *</label>
              <input
                type="text"
                class="input"
                bind:value={formData.name}
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label class="label">Email *</label>
              <input
                type="email"
                class="input"
                bind:value={formData.email}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button 
              type="button" 
              class="btn btn-outline"
              on:click={cancelEditing}
              disabled={isLoading}
            >
              取消
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              disabled={isLoading}
            >
              {#if isLoading}
                <LoadingSpinner size="sm" color="white" />
                <span class="ml-2">保存中...</span>
              {:else}
                保存
              {/if}
            </button>
          </div>
        </form>
      {:else}
        <!-- 顯示模式 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-center space-x-4">
            <div class="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
              <span class="text-white text-xl font-medium">
                {$user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">{$user?.name || '未設定'}</h3>
              <p class="text-sm text-gray-500">{$user?.email || '未設定'}</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">角色</dt>
              <dd class="mt-1">
                <span class="badge badge-primary">
                  {ROLE_NAMES[$user?.role] || $user?.role || '未設定'}
                </span>
              </dd>
            </div>
            
            <div>
              <dt class="text-sm font-medium text-gray-500">註冊時間</dt>
              <dd class="mt-1 text-sm text-gray-900">
                {$user?.created_at ? new Date($user.created_at).toLocaleDateString() : '未知'}
              </dd>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- 帳戶安全 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">帳戶安全</h2>
    </div>
    <div class="card-body">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900">密碼</h3>
            <p class="text-sm text-gray-500">上次更新：未知</p>
          </div>
          <button class="btn btn-outline">
            更改密碼
          </button>
        </div>
        
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900">兩步驟驗證</h3>
            <p class="text-sm text-gray-500">為您的帳戶添加額外的安全保護</p>
          </div>
          <button class="btn btn-outline">
            設定
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 偏好設定 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">偏好設定</h2>
    </div>
    <div class="card-body">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900">語言</h3>
            <p class="text-sm text-gray-500">選擇您的偏好語言</p>
          </div>
          <select class="input w-32">
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
        </div>
        
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900">時區</h3>
            <p class="text-sm text-gray-500">設定您的時區</p>
          </div>
          <select class="input w-48">
            <option value="Asia/Taipei">台北 (GMT+8)</option>
            <option value="UTC">UTC (GMT+0)</option>
          </select>
        </div>
        
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-gray-900">郵件通知</h3>
            <p class="text-sm text-gray-500">接收重要的郵件通知</p>
          </div>
          <label class="flex items-center">
            <input type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked>
            <span class="ml-2 text-sm text-gray-900">啟用</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</div>
