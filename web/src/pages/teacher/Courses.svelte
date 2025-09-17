<script>
  import { onMount } from 'svelte';
  import { coursesApi } from '../../services/api.js';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import { notify } from '../../stores/notifications.js';

  let isLoading = true;
  let courses = [];
  let filteredCourses = [];
  let searchTerm = '';
  let filterType = '';
  let filterStatus = '';

  // 載入課程數據
  async function loadCourses() {
    try {
      isLoading = true;
      const coursesData = await coursesApi.getAll();
      courses = coursesData || [];
      filteredCourses = courses;
    } catch (error) {
      console.error('載入課程失敗:', error);
      notify.error('載入課程失敗');
    } finally {
      isLoading = false;
    }
  }

  // 篩選課程
  function filterCourses() {
    filteredCourses = courses.filter(course => {
      const matchesSearch = !searchTerm ||
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !filterType || course.type === filterType;
      const matchesStatus = !filterStatus ||
        (filterStatus === 'active' && course.active) ||
        (filterStatus === 'inactive' && !course.active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  // 格式化價格
  function formatPrice(cents) {
    if (!cents) return '免費';
    return `$${(cents / 100).toFixed(0)}`;
  }

  // 格式化課程時長
  function formatDuration(minutes) {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}小時${mins}分鐘` : `${hours}小時`;
    }
    return `${minutes}分鐘`;
  }

  // 獲取課程類型顯示文字
  function getCourseTypeText(type) {
    const typeMap = {
      'one_on_one': '一對一',
      'group': '小組課',
      'workshop': '工作坊',
      'trial': '試聽課'
    };
    return typeMap[type] || type;
  }

  // 響應式篩選
  $: {
    filterCourses();
  }

  onMount(() => {
    loadCourses();
  });
</script>

{#if isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
{:else}
  <div class="space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">我的課程</h1>
        <p class="mt-1 text-sm text-gray-500">管理您的教學課程和查看課程統計</p>
      </div>

      <button class="btn btn-primary">
        + 新增課程
      </button>
    </div>

    <!-- 統計卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-blue-600">總課程數</p>
            <p class="text-2xl font-semibold text-blue-900">{courses.length}</p>
          </div>
        </div>
      </div>

      <div class="bg-green-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-green-600">活躍課程</p>
            <p class="text-2xl font-semibold text-green-900">
              {courses.filter(c => c.active).length}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-yellow-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-yellow-600">平均時長</p>
            <p class="text-2xl font-semibold text-yellow-900">
              {courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.duration_min, 0) / courses.length) : 0}分
            </p>
          </div>
        </div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-purple-600">平均價格</p>
            <p class="text-2xl font-semibold text-purple-900">
              ${courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + (c.default_price_cents || 0), 0) / courses.length / 100) : 0}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索和篩選 -->
    <div class="card">
      <div class="card-body">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-64">
            <input
              type="text"
              placeholder="搜索課程名稱或描述..."
              class="input"
              bind:value={searchTerm}
            />
          </div>

          <div class="flex items-center space-x-4">
            <select class="input" bind:value={filterType}>
              <option value="">所有類型</option>
              <option value="one_on_one">一對一</option>
              <option value="group">小組課</option>
              <option value="workshop">工作坊</option>
              <option value="trial">試聽課</option>
            </select>

            <select class="input" bind:value={filterStatus}>
              <option value="">所有狀態</option>
              <option value="active">活躍</option>
              <option value="inactive">停用</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 課程列表 -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-lg font-medium text-gray-900">課程列表</h2>
        <span class="text-sm text-gray-500">共 {filteredCourses.length} 門課程</span>
      </div>
      <div class="card-body">
        {#if filteredCourses.length === 0}
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">暫無課程</h3>
            <p class="mt-1 text-sm text-gray-500">開始創建您的第一門課程</p>
            <button class="mt-4 btn btn-primary">
              + 新增課程
            </button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">課程</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時長</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each filteredCourses as course}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {course.title || '未命名課程'}
                        </div>
                        <div class="text-sm text-gray-500">
                          {course.description || '無描述'}
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCourseTypeText(course.type)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(course.duration_min)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(course.default_price_cents)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {course.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        {course.active ? '活躍' : '停用'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-900">編輯</button>
                        <button class="text-green-600 hover:text-green-900">查看</button>
                        <button class="text-red-600 hover:text-red-900">
                          {course.active ? '停用' : '啟用'}
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
