<script>
  import { onMount } from 'svelte';
  import { link, push } from 'svelte-spa-router';
  import { auth, isAuthenticated, userRole } from '../stores/auth.js';
  import { notify } from '../stores/notifications.js';
  import { getDefaultRoute } from '../utils/routes.js';
  import { t } from '../stores/i18n.js';
  import LoadingSpinner from '../components/LoadingSpinner.svelte';

  let email = '';
  let password = '';
  let isLoading = false;
  let showPassword = false;

  // 如果已經登入，重定向到儀表板
  onMount(() => {
    if ($isAuthenticated) {
      const defaultRoute = getDefaultRoute($userRole);
      push(defaultRoute);
    }
  });

  async function handleSubmit() {
    if (!email || !password) {
      notify.error($t('validation.required'));
      return;
    }

    isLoading = true;

    try {
      const user = await auth.login({ email, password });
      notify.success($t('auth.login.welcome', { name: user.name }));

      // 重定向到對應的儀表板
      const defaultRoute = getDefaultRoute(user.role);
      push(defaultRoute);
    } catch (error) {
      notify.error(error.message || $t('auth.errors.loginFailed'));
    } finally {
      isLoading = false;
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  // 快速登入功能
  function quickLogin(role) {
    const credentials = {
      admin: { email: 'admin@example.com', password: 'admin123' },
      teacher: { email: 'teacher1@example.com', password: 'teacher123' },
      student: { email: 'student1@example.com', password: 'student123' }
    };

    const cred = credentials[role];
    if (cred) {
      email = cred.email;
      password = cred.password;
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
        {$t('auth.login.title')}
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        {$t('auth.login.subtitle')}
        <a href="/register" use:link class="font-medium text-primary-600 hover:text-primary-500">
          {$t('auth.login.createAccount')}
        </a>
      </p>
    </div>

    <!-- 登入表單 -->
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="space-y-4">
        <!-- Email 欄位 -->
        <div>
          <label for="email" class="label">
            {$t('auth.login.email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="input"
            placeholder={$t('auth.login.email')}
            bind:value={email}
            disabled={isLoading}
          />
        </div>

        <!-- 密碼欄位 -->
        <div>
          <label for="password" class="label">
            {$t('auth.login.password')}
          </label>
          <div class="relative">
            {#if showPassword}
              <input
                id="password"
                name="password"
                type="text"
                autocomplete="current-password"
                required
                class="input pr-10"
                placeholder={$t('auth.login.password')}
                bind:value={password}
                disabled={isLoading}
              />
            {:else}
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="input pr-10"
                placeholder={$t('auth.login.password')}
                bind:value={password}
                disabled={isLoading}
              />
            {/if}
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={togglePasswordVisibility}
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
        </div>
      </div>

      <!-- 記住我和忘記密碼 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-900">
            {$t('auth.login.rememberMe')}
          </label>
        </div>

        <div class="text-sm">
          <a href="/forgot-password" class="font-medium text-primary-600 hover:text-primary-500">
            {$t('auth.login.forgotPassword')}
          </a>
        </div>
      </div>

      <!-- 登入按鈕 -->
      <div>
        <button
          type="submit"
          class="btn btn-primary w-full flex justify-center py-3"
          disabled={isLoading}
        >
          {#if isLoading}
            <LoadingSpinner size="sm" color="white" />
            <span class="ml-2">{$t('auth.login.loggingIn')}</span>
          {:else}
            {$t('auth.login.loginButton')}
          {/if}
        </button>
      </div>
    </form>

    <!-- 快速登入 -->
    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-50 text-gray-500">{$t('auth.login.quickLogin')}</span>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-3 gap-3">
        <button
          type="button"
          class="btn btn-outline btn-sm"
          on:click={() => quickLogin('admin')}
          disabled={isLoading}
        >
          {$t('auth.login.admin')}
        </button>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          on:click={() => quickLogin('teacher')}
          disabled={isLoading}
        >
          {$t('auth.login.teacher')}
        </button>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          on:click={() => quickLogin('student')}
          disabled={isLoading}
        >
          {$t('auth.login.student')}
        </button>
      </div>
    </div>

    <!-- 頁腳信息 -->
    <div class="text-center text-xs text-gray-500">
      <p>登入即表示您同意我們的</p>
      <p>
        <a href="/terms" class="text-primary-600 hover:text-primary-500">服務條款</a>
        和
        <a href="/privacy" class="text-primary-600 hover:text-primary-500">隱私政策</a>
      </p>
    </div>
  </div>
</div>
