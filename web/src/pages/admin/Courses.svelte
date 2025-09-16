<script>
  import { onMount } from 'svelte';
  import { notify } from '../../stores/notifications.js';
  import api from '../../services/api.js';
  import LoadingSpinner from '../../components/LoadingSpinner.svelte';
  import { formatDate, truncateText } from '../../utils/helpers.js';

  let isLoading = true;
  let courses = [];
  let filteredCourses = [];
  let searchTerm = '';
  let showCreateModal = false;

  // 新課程表單
  let newCourse = {
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    duration_minutes: 60,
    max_students: 1
  };

  onMount(async () => {
    await loadCourses();
  });

  async function loadCourses() {
    isLoading = true;
    try {
      courses = await api.courses.getAll();
      filterCourses();
    } catch (error) {
      notify.error('載入課程列表失敗');
      console.error('Load courses error:', error);
    } finally {
      isLoading = false;
    }
  }

  function filterCourses() {
    filteredCourses = courses.filter(course => {
      return !searchTerm || 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }

  // 監聽搜尋變化
  $: if (searchTerm !== undefined) {
    filterCourses();
  }

  async function createCourse() {
    if (!newCourse.title) {
      notify.error('請填寫課程標題');
      return;
    }

    try {
      await api.courses.create(newCourse);
      notify.success('課程創建成功');
      showCreateModal = false;
      newCourse = {
        title: '',
        description: '',
        category: '',
        level: 'beginner',
        duration_minutes: 60,
        max_students: 1
      };
      await loadCourses();
    } catch (error) {
      notify.error(error.message || '創建課程失敗');
    }
  }

  async function deleteCourse(courseId, courseTitle) {
    if (!confirm(`確定要刪除課程 "${courseTitle}" 嗎？此操作無法撤銷。`)) {
      return;
    }

    try {
      await api.courses.delete(courseId);
      notify.success('課程刪除成功');
      await loadCourses();
    } catch (error) {
      notify.error(error.message || '刪除課程失敗');
    }
  }

  function closeModal() {
    showCreateModal = false;
    newCourse = {
      title: '',
      description: '',
      category: '',
      level: 'beginner',
      duration_minutes: 60,
      max_students: 1
    };
  }

  // 級別顯示名稱
  const levelNames = {
    beginner: '初級',
    intermediate: '中級',
    advanced: '高級'
  };
</script>

<div class="space-y-6">
  <!-- 頁面標題和操作 -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">課程管理</h1>
      <p class="mt-1 text-sm text-gray-500">
        管理系統中的所有課程
      </p>
    </div>
    <button 
      class="btn btn-primary"
      on:click={() => showCreateModal = true}
    >
      <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      新增課程
    </button>
  </div>

  <!-- 搜尋 -->
  <div class="card">
    <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="label">搜尋課程</label>
          <input
            type="text"
            class="input"
            placeholder="搜尋課程標題或描述..."
            bind:value={searchTerm}
          />
        </div>
        <div class="flex items-end">
          <button 
            class="btn btn-outline"
            on:click={loadCourses}
            disabled={isLoading}
          >
            {#if isLoading}
              <LoadingSpinner size="sm" />
            {:else}
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            {/if}
            刷新
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 課程列表 -->
  <div class="card">
    <div class="card-header">
      <h2 class="text-lg font-medium text-gray-900">
        課程列表 ({filteredCourses.length})
      </h2>
    </div>
    <div class="card-body p-0">
      {#if isLoading}
        <div class="flex justify-center py-8">
          <LoadingSpinner size="lg" text="載入課程列表..." />
        </div>
      {:else if filteredCourses.length === 0}
        <div class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p class="mt-2">沒有找到符合條件的課程</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {#each filteredCourses as course}
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <h3 class="text-lg font-medium text-gray-900 flex-1">
                  {course.title}
                </h3>
                <div class="flex space-x-1 ml-2">
                  <button 
                    class="text-gray-400 hover:text-gray-600"
                    title="編輯課程"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    class="text-red-400 hover:text-red-600"
                    title="刪除課程"
                    on:click={() => deleteCourse(course.id, course.title)}
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {#if course.description}
                <p class="text-sm text-gray-600 mb-3">
                  {truncateText(course.description, 100)}
                </p>
              {/if}
              
              <div class="space-y-2 text-sm">
                {#if course.category}
                  <div class="flex items-center">
                    <span class="text-gray-500">分類：</span>
                    <span class="ml-1 text-gray-900">{course.category}</span>
                  </div>
                {/if}
                
                {#if course.level}
                  <div class="flex items-center">
                    <span class="text-gray-500">級別：</span>
                    <span class="ml-1 badge badge-primary">
                      {levelNames[course.level] || course.level}
                    </span>
                  </div>
                {/if}
                
                <div class="flex items-center">
                  <span class="text-gray-500">時長：</span>
                  <span class="ml-1 text-gray-900">{course.duration_minutes} 分鐘</span>
                </div>
                
                <div class="flex items-center">
                  <span class="text-gray-500">創建時間：</span>
                  <span class="ml-1 text-gray-900">{formatDate(course.created_at)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- 創建課程模態框 -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-container max-w-lg" on:click|stopPropagation>
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">新增課程</h3>
        <button 
          type="button" 
          class="text-gray-400 hover:text-gray-500"
          on:click={closeModal}
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form on:submit|preventDefault={createCourse} class="p-4 space-y-4">
        <div>
          <label class="label">課程標題 *</label>
          <input
            type="text"
            class="input"
            placeholder="請輸入課程標題"
            bind:value={newCourse.title}
            required
          />
        </div>
        
        <div>
          <label class="label">課程描述</label>
          <textarea
            class="input"
            rows="3"
            placeholder="請輸入課程描述"
            bind:value={newCourse.description}
          ></textarea>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">分類</label>
            <input
              type="text"
              class="input"
              placeholder="例如：英語、數學"
              bind:value={newCourse.category}
            />
          </div>
          
          <div>
            <label class="label">級別</label>
            <select class="input" bind:value={newCourse.level}>
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">高級</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">課程時長（分鐘）</label>
            <input
              type="number"
              class="input"
              min="15"
              max="180"
              bind:value={newCourse.duration_minutes}
            />
          </div>
          
          <div>
            <label class="label">最大學生數</label>
            <input
              type="number"
              class="input"
              min="1"
              max="10"
              bind:value={newCourse.max_students}
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" class="btn btn-outline" on:click={closeModal}>
            取消
          </button>
          <button type="submit" class="btn btn-primary">
            創建課程
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
