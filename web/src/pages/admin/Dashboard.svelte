<script>
  import { onMount } from 'svelte';
  import { user } from '../../stores/auth.js';
  import { notify } from '../../stores/notifications.js';
  import api from '../../services/api.js';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import { formatNumber, formatCurrency } from '../../utils/helpers.js';

  let isLoading = true;
  let stats = {
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalSessions: 0,
    totalRevenue: 0,
    pendingPayouts: 0
  };

  let recentActivities = [];

  onMount(async () => {
    await loadDashboardData();
  });

  async function loadDashboardData() {
    isLoading = true;
    try {
      // 並行載入所有數據
      const [usersData, coursesData] = await Promise.all([
        api.users.getAll(),
        api.courses.getAll()
      ]);

      // 計算統計數據
      stats.totalUsers = usersData.length;
      stats.totalTeachers = usersData.filter(u => u.role === 'teacher').length;
      stats.totalStudents = usersData.filter(u => u.role === 'student').length;
      stats.totalCourses = coursesData.length;

      // 模擬其他統計數據（實際應該從 API 獲取）
      stats.totalSessions = 156;
      stats.totalRevenue = 125000;
      stats.pendingPayouts = 8;

      // 模擬最近活動
      recentActivities = [
        {
          id: 1,
          type: 'user_registered',
          message: '新用戶註冊',
          user: '張小明',
          time: '2 分鐘前'
        },
        {
          id: 2,
          type: 'session_completed',
          message: '課程已完成',
          user: '李老師',
          time: '15 分鐘前'
        },
        {
          id: 3,
          type: 'course_created',
          message: '新課程創建',
          user: '王老師',
          time: '1 小時前'
        }
      ];

    } catch (error) {
      notify.error('載入儀表板數據失敗');
      console.error('Dashboard error:', error);
    } finally {
      isLoading = false;
    }
  }

  // 統計卡片配置
  $: statCards = [
    {
      title: '總用戶數',
      value: formatNumber(stats.totalUsers),
      icon: 'users',
      color: 'blue',
      change: '+12%'
    },
    {
      title: '老師數量',
      value: formatNumber(stats.totalTeachers),
      icon: 'user-check',
      color: 'green',
      change: '+8%'
    },
    {
      title: '學生數量',
      value: formatNumber(stats.totalStudents),
      icon: 'user-plus',
      color: 'purple',
      change: '+15%'
    },
    {
      title: '課程總數',
      value: formatNumber(stats.totalCourses),
      icon: 'book',
      color: 'yellow',
      change: '+5%'
    },
    {
      title: '完成課程',
      value: formatNumber(stats.totalSessions),
      icon: 'check-circle',
      color: 'indigo',
      change: '+22%'
    },
    {
      title: '總收入',
      value: formatCurrency(stats.totalRevenue),
      icon: 'dollar-sign',
      color: 'green',
      change: '+18%'
    }
  ];

  // 圖標映射
  const icons = {
    'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    'user-check': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    'user-plus': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
    'book': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    'dollar-sign': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
  };

  // 顏色映射
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500'
  };
</script>

<div class="space-y-6">
  <!-- 頁面標題 -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">管理員儀表板</h1>
      <p class="mt-1 text-sm text-gray-500">
        歡迎回來，{$user?.name}！這裡是系統概覽。
      </p>
    </div>
    <button 
      class="btn btn-primary"
      on:click={loadDashboardData}
      disabled={isLoading}
    >
      {#if isLoading}
        <LoadingSpinner size="sm" color="white" />
        <span class="ml-2">載入中...</span>
      {:else}
        刷新數據
      {/if}
    </button>
  </div>

  {#if isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner size="lg" text="載入儀表板數據..." />
    </div>
  {:else}
    <!-- 統計卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each statCards as card}
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="p-3 rounded-full {colorClasses[card.color]} text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icons[card.icon]} />
                </svg>
              </div>
              <div class="ml-4 flex-1">
                <p class="text-sm font-medium text-gray-500">{card.title}</p>
                <div class="flex items-baseline">
                  <p class="text-2xl font-semibold text-gray-900">{card.value}</p>
                  <p class="ml-2 text-sm font-medium text-green-600">{card.change}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- 主要內容區域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最近活動 -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium text-gray-900">最近活動</h2>
        </div>
        <div class="card-body">
          {#if recentActivities.length > 0}
            <div class="space-y-4">
              {#each recentActivities as activity}
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span class="text-xs font-medium text-gray-600">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900">
                      <span class="font-medium">{activity.user}</span>
                      {activity.message}
                    </p>
                    <p class="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-4 text-gray-500">
              暫無最近活動
            </div>
          {/if}
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-medium text-gray-900">快速操作</h2>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2 gap-4">
            <a href="/admin/users" class="btn btn-outline text-center">
              <svg class="h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              用戶管理
            </a>
            
            <a href="/admin/courses" class="btn btn-outline text-center">
              <svg class="h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              課程管理
            </a>
            
            <a href="/admin/pricing" class="btn btn-outline text-center">
              <svg class="h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              定價管理
            </a>
            
            <a href="/admin/payouts" class="btn btn-outline text-center">
              <svg class="h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              結算管理
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 系統狀態 -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-gray-900">系統狀態</h2>
      </div>
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">正常</div>
            <div class="text-sm text-gray-500">API 服務</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">正常</div>
            <div class="text-sm text-gray-500">資料庫</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">正常</div>
            <div class="text-sm text-gray-500">檔案存儲</div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
