<script>
  import { onMount } from 'svelte';
  import { link, push } from 'svelte-spa-router';
  import { auth, isAuthenticated, userRole } from '../stores/auth.js';
  import { notify } from '../stores/notifications.js';
  import { getDefaultRoute } from '../utils/routes.js';
  import { isValidEmail, validatePassword } from '../utils/helpers.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';

  let formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  };
  
  let isLoading = false;
  let showPassword = false;
  let showConfirmPassword = false;
  let passwordValidation = { isValid: true, errors: [] };

  // 如果已經登入，重定向到儀表板
  onMount(() => {
    if ($isAuthenticated) {
      const defaultRoute = getDefaultRoute($userRole);
      push(defaultRoute);
    }
  });

  // 密碼驗證
  $: if (formData.password) {
    passwordValidation = validatePassword(formData.password);
  }

  async function handleSubmit() {
    // 表單驗證
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      notify.error('請填寫所有必填欄位');
      return;
    }

    if (!isValidEmail(formData.email)) {
      notify.error('請輸入有效的 Email 地址');
      return;
    }

    if (!passwordValidation.isValid) {
      notify.error('密碼不符合要求');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      notify.error('密碼確認不一致');
      return;
    }

    isLoading = true;

    try {
      const user = await auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      notify.success(`註冊成功，歡迎加入 ${user.name}！`);
      
      // 重定向到對應的儀表板
      const defaultRoute = getDefaultRoute(user.role);
      push(defaultRoute);
    } catch (error) {
      notify.error(error.message || '註冊失敗');
    } finally {
      isLoading = false;
    }
  }

  function togglePasswordVisibility(field) {
    if (field === 'password') {
      showPassword = !showPassword;
    } else {
      showConfirmPassword = !showConfirmPassword;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- 頭部 -->
    <div class="text-center">
      <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
        <span class="text-2xl">🎓</span>
      </div>
      <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
        創建新帳戶
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        已有帳戶？
        <a href="/login" use:link class="font-medium text-primary-600 hover:text-primary-500">
          立即登入
        </a>
      </p>
    </div>

    <!-- 註冊表單 -->
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="space-y-4">
        <!-- 姓名欄位 -->
        <div>
          <label for="name" class="label">
            姓名 *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autocomplete="name"
            required
            class="input"
            placeholder="請輸入您的姓名"
            bind:value={formData.name}
            disabled={isLoading}
          />
        </div>

        <!-- Email 欄位 -->
        <div>
          <label for="email" class="label">
            Email 地址 *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="input"
            class:input-error={formData.email && !isValidEmail(formData.email)}
            placeholder="請輸入您的 Email"
            bind:value={formData.email}
            disabled={isLoading}
          />
          {#if formData.email && !isValidEmail(formData.email)}
            <p class="mt-1 text-sm text-red-600">請輸入有效的 Email 地址</p>
          {/if}
        </div>

        <!-- 角色選擇 -->
        <div>
          <label for="role" class="label">
            角色 *
          </label>
          <select
            id="role"
            name="role"
            class="input"
            bind:value={formData.role}
            disabled={isLoading}
          >
            <option value="student">學生</option>
            <option value="teacher">老師</option>
          </select>
        </div>

        <!-- 密碼欄位 -->
        <div>
          <label for="password" class="label">
            密碼 *
          </label>
          <div class="relative">
            {#if showPassword}
              <input
                id="password"
                name="password"
                type="text"
                autocomplete="new-password"
                required
                class="input pr-10"
                class:input-error={formData.password && !passwordValidation.isValid}
                placeholder="請輸入密碼"
                bind:value={formData.password}
                disabled={isLoading}
              />
            {:else}
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                class="input pr-10"
                class:input-error={formData.password && !passwordValidation.isValid}
                placeholder="請輸入密碼"
                bind:value={formData.password}
                disabled={isLoading}
              />
            {/if}
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={() => togglePasswordVisibility('password')}
            >
              <svg 
                class="h-5 w-5 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {#if showPassword}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                {:else}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                {/if}
              </svg>
            </button>
          </div>
          
          <!-- 密碼強度提示 -->
          {#if formData.password && !passwordValidation.isValid}
            <div class="mt-2 text-sm text-red-600">
              <p class="font-medium">密碼要求：</p>
              <ul class="list-disc list-inside space-y-1">
                {#each passwordValidation.errors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>

        <!-- 確認密碼欄位 -->
        <div>
          <label for="confirmPassword" class="label">
            確認密碼 *
          </label>
          <div class="relative">
            {#if showConfirmPassword}
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="text"
                autocomplete="new-password"
                required
                class="input pr-10"
                class:input-error={formData.confirmPassword && formData.password !== formData.confirmPassword}
                placeholder="請再次輸入密碼"
                bind:value={formData.confirmPassword}
                disabled={isLoading}
              />
            {:else}
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class="input pr-10"
                class:input-error={formData.confirmPassword && formData.password !== formData.confirmPassword}
                placeholder="請再次輸入密碼"
                bind:value={formData.confirmPassword}
                disabled={isLoading}
              />
            {/if}
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={() => togglePasswordVisibility('confirm')}
            >
              <svg 
                class="h-5 w-5 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {#if showConfirmPassword}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                {:else}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                {/if}
              </svg>
            </button>
          </div>
          
          {#if formData.confirmPassword && formData.password !== formData.confirmPassword}
            <p class="mt-1 text-sm text-red-600">密碼確認不一致</p>
          {/if}
        </div>
      </div>

      <!-- 服務條款 -->
      <div class="flex items-center">
        <input
          id="agree-terms"
          name="agree-terms"
          type="checkbox"
          required
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label for="agree-terms" class="ml-2 block text-sm text-gray-900">
          我同意
          <a href="/terms" class="text-primary-600 hover:text-primary-500">服務條款</a>
          和
          <a href="/privacy" class="text-primary-600 hover:text-primary-500">隱私政策</a>
        </label>
      </div>

      <!-- 註冊按鈕 -->
      <div>
        <button
          type="submit"
          class="btn btn-primary w-full flex justify-center py-3"
          disabled={isLoading}
        >
          {#if isLoading}
            <LoadingSpinner size="sm" color="white" />
            <span class="ml-2">註冊中...</span>
          {:else}
            創建帳戶
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>
